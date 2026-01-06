/**
 * Claude Agent SDK - Core Agent
 *
 * Implements the agent loop: observe → think → act → learn → repeat
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  AgentConfig,
  AgentState,
  AgentResponse,
  Observation,
  Thought,
  Action,
  Learning,
  Memory,
  AgentPhase,
  HookContext,
} from './types';

export class Agent {
  private config: AgentConfig;
  private client: Anthropic;
  private state: AgentState;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.state = this.initializeState();
  }

  /**
   * Initialize the agent state
   */
  private initializeState(): AgentState {
    return {
      phase: 'observe',
      iteration: 0,
      context: {},
      memory: [],
      goal: '',
    };
  }

  /**
   * Main execution method - runs the agent loop
   */
  async run(goal: string, initialContext: Record<string, any> = {}): Promise<AgentResponse> {
    this.state.goal = goal;
    this.state.context = { ...initialContext };
    this.state.iteration = 0;
    const logs: string[] = [];

    this.log(logs, `🎯 Starting agent with goal: ${goal}`);

    while (this.state.iteration < this.config.maxIterations) {
      this.state.iteration++;
      this.log(logs, `\n📍 Iteration ${this.state.iteration}`);

      try {
        // OBSERVE
        this.state.phase = 'observe';
        const observation = await this.observe(logs);
        this.log(logs, `👁️  OBSERVE: ${JSON.stringify(observation.content).substring(0, 100)}...`);

        // THINK
        this.state.phase = 'think';
        const thought = await this.think(observation, logs);
        this.log(logs, `🧠 THINK: ${thought.reasoning.substring(0, 100)}...`);

        // Check if goal is achieved
        if (thought.nextAction === 'GOAL_ACHIEVED') {
          this.log(logs, '✅ Goal achieved!');
          break;
        }

        // ACT
        this.state.phase = 'act';
        const action = this.planAction(thought);

        // Run pre-action hooks
        const hookAllowed = await this.runHooks('pre-action', { action }, logs);
        if (!hookAllowed) {
          this.log(logs, '🚫 Action blocked by guard rails');
          continue;
        }

        const actionResult = await this.act(action, logs);
        this.log(logs, `🎬 ACT: Executed ${action.type} - ${action.target}`);

        // Run post-action hooks
        await this.runHooks('post-action', { action, result: actionResult }, logs);

        // LEARN
        this.state.phase = 'learn';
        const learning = await this.learn(action, actionResult, logs);
        this.log(logs, `📚 LEARN: ${learning.insights.join(', ')}`);

        // Store memory
        this.storeMemory(learning);

      } catch (error: any) {
        this.log(logs, `❌ Error in iteration ${this.state.iteration}: ${error.message}`);

        // Run error hooks
        await this.runHooks('error', { error }, logs);

        // Continue to next iteration or break on critical errors
        if (error.critical) break;
      }
    }

    return {
      success: true,
      result: this.state.context.result || this.state.context,
      iterations: this.state.iteration,
      logs,
      memory: this.state.memory,
    };
  }

  /**
   * OBSERVE phase - gather information
   */
  private async observe(logs: string[]): Promise<Observation> {
    // Create an observation from the current state
    const observation: Observation = {
      type: 'environment',
      content: {
        goal: this.state.goal,
        context: this.state.context,
        iteration: this.state.iteration,
        availableTools: this.config.tools.map(t => t.name),
        availableSkills: this.config.skills.map(s => s.name),
        memory: this.state.memory.slice(-5), // Last 5 memories
      },
      timestamp: new Date(),
    };

    return observation;
  }

  /**
   * THINK phase - reason about what to do next
   */
  private async think(observation: Observation, logs: string[]): Promise<Thought> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildThinkingPrompt(observation);

    const response = await this.client.messages.create({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse the thought from Claude's response
    return this.parseThought(responseText);
  }

  /**
   * ACT phase - execute the planned action
   */
  private async act(action: Action, logs: string[]): Promise<any> {
    switch (action.type) {
      case 'tool_use':
        return await this.executeTool(action, logs);

      case 'skill_invoke':
        return await this.executeSkill(action, logs);

      case 'subagent_spawn':
        return await this.executeSubagent(action, logs);

      case 'respond':
        return action.parameters;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * LEARN phase - extract insights from the action result
   */
  private async learn(action: Action, result: any, logs: string[]): Promise<Learning> {
    const learningPrompt = `
You just executed this action: ${JSON.stringify(action)}
The result was: ${JSON.stringify(result)}

What did you learn? Provide:
1. Was this action successful? (yes/no)
2. Key insights from this result
3. What adjustments should be made for future actions?
4. Any new knowledge to remember?

Respond in JSON format:
{
  "success": true/false,
  "insights": ["insight 1", "insight 2"],
  "adjustments": ["adjustment 1", "adjustment 2"],
  "newKnowledge": {}
}
`;

    const response = await this.client.messages.create({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: learningPrompt,
        },
      ],
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '{}';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const learning = JSON.parse(jsonMatch[0]);

      // Update context with new knowledge
      if (learning.newKnowledge) {
        this.state.context = { ...this.state.context, ...learning.newKnowledge };
      }

      return learning;
    }

    // Fallback learning
    return {
      success: true,
      insights: ['Action completed'],
      adjustments: [],
    };
  }

  /**
   * Execute a tool
   */
  private async executeTool(action: Action, logs: string[]): Promise<any> {
    const tool = this.config.tools.find(t => t.name === action.target);
    if (!tool) {
      throw new Error(`Tool not found: ${action.target}`);
    }

    this.log(logs, `🔧 Executing tool: ${tool.name}`);
    const result = await tool.execute(action.parameters);
    return result;
  }

  /**
   * Execute a skill
   */
  private async executeSkill(action: Action, logs: string[]): Promise<any> {
    const skill = this.config.skills.find(s => s.name === action.target);
    if (!skill) {
      throw new Error(`Skill not found: ${action.target}`);
    }

    this.log(logs, `⚡ Executing skill: ${skill.name}`);
    const result = await skill.execute(this.state);
    return result;
  }

  /**
   * Execute a subagent
   */
  private async executeSubagent(action: Action, logs: string[]): Promise<any> {
    const subagent = this.config.subagents.find(s => s.name === action.target);
    if (!subagent) {
      throw new Error(`Subagent not found: ${action.target}`);
    }

    this.log(logs, `🤖 Spawning subagent: ${subagent.name}`);
    const result = await subagent.execute(action.parameters.task, action.parameters.context || {});
    return result;
  }

  /**
   * Run hooks
   */
  private async runHooks(
    type: 'pre-action' | 'post-action' | 'error' | 'logging',
    context: Partial<HookContext>,
    logs: string[]
  ): Promise<boolean> {
    const hooks = this.config.hooks.filter(h => h.type === type);

    for (const hook of hooks) {
      const hookContext: HookContext = {
        phase: this.state.phase,
        state: this.state,
        ...context,
      };

      const result = await hook.execute(hookContext);

      if (result.message) {
        this.log(logs, `🪝 Hook [${hook.name}]: ${result.message}`);
      }

      if (result.requireHumanApproval) {
        this.log(logs, `⏸️  Human approval required for: ${hook.name}`);
        // In a real implementation, this would pause and wait for human input
      }

      if (!result.allowed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(): string {
    return `You are an intelligent agent following the observe-think-act-learn loop.

Your goal is to: ${this.state.goal}

Available tools: ${this.config.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Available skills: ${this.config.skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}

Available subagents: ${this.config.subagents.map(s => `- ${s.name}: ${s.description}`).join('\n')}

You should think carefully about each step and choose the best action to achieve the goal.`;
  }

  /**
   * Build thinking prompt
   */
  private buildThinkingPrompt(observation: Observation): string {
    return `Current observation:
${JSON.stringify(observation.content, null, 2)}

Based on this observation, think about:
1. What is the current state?
2. What do I need to do next to achieve the goal?
3. Which tool, skill, or subagent should I use?
4. Am I close to achieving the goal?

Respond with your reasoning and next action.

If the goal is achieved, respond with "GOAL_ACHIEVED" as the next action.`;
  }

  /**
   * Parse thought from Claude's response
   */
  private parseThought(response: string): Thought {
    // Simple parsing - in production, use more robust parsing
    return {
      reasoning: response,
      nextAction: response.includes('GOAL_ACHIEVED') ? 'GOAL_ACHIEVED' : 'continue',
      confidence: 0.8,
    };
  }

  /**
   * Plan the next action based on thought
   */
  private planAction(thought: Thought): Action {
    // Simple action planning - in production, use Claude to generate structured actions
    // For now, we'll return a default action
    return {
      type: 'respond',
      target: 'user',
      parameters: {
        message: thought.reasoning,
      },
    };
  }

  /**
   * Store memory
   */
  private storeMemory(learning: Learning): void {
    const memory: Memory = {
      id: `mem_${Date.now()}`,
      timestamp: new Date(),
      phase: 'learn',
      content: JSON.stringify(learning),
      metadata: {
        iteration: this.state.iteration,
      },
    };

    this.state.memory.push(memory);

    // Keep only last 100 memories
    if (this.state.memory.length > 100) {
      this.state.memory = this.state.memory.slice(-100);
    }
  }

  /**
   * Logging helper
   */
  private log(logs: string[], message: string): void {
    if (this.config.enableLogging) {
      logs.push(`[${new Date().toISOString()}] ${message}`);
      console.log(message);
    }
  }
}
