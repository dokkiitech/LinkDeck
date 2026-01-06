/**
 * React Native Integration Service
 *
 * This service provides a bridge between the React Native app
 * and the Claude Agent SDK running on the server.
 */

import { Agent } from '../core/agent';
import { AgentConfig, AgentResponse } from '../core/types';
import { getBuiltinTools } from '../tools/builtin';
import { getCustomTools, searchLinksTool, createLinkTool, addNoteTool } from '../tools/custom';
import { leadResearchSkill } from '../skills/lead-research';
import { emailDraftingSkill } from '../skills/email-drafting';
import { researcherSubagent } from '../subagents/researcher';
import { getGuardRailHooks } from '../hooks/guard-rails';
import { getLoggingHooks } from '../hooks/logging';

/**
 * Agent Service for LinksDeck
 */
export class LinksDeckAgentService {
  private apiKey: string;
  private defaultConfig: Partial<AgentConfig>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.defaultConfig = {
      model: 'claude-3-5-sonnet-20241022',
      apiKey: this.apiKey,
      maxIterations: 10,
      enableLogging: true,
      enableGuardRails: true,
      enableHumanInLoop: false,
    };
  }

  /**
   * Search links using natural language
   */
  async searchLinks(
    query: string,
    userId: string,
    conversationHistory?: any[]
  ): Promise<any> {
    const agent = this.createAgent({
      tools: [searchLinksTool],
    });

    const goal = `Search for links matching: ${query}`;
    const context = {
      userId,
      query,
      conversationHistory,
    };

    const result = await agent.run(goal, context);

    return {
      success: true,
      links: result.result.links || [],
      explanation: result.result.explanation || 'Search completed',
      logs: result.logs,
    };
  }

  /**
   * Create a new link with AI assistance
   */
  async createLink(
    url: string,
    userId: string,
    autoGenerateMetadata: boolean = true
  ): Promise<any> {
    const agent = this.createAgent({
      tools: [createLinkTool, ...getBuiltinTools()],
    });

    const goal = autoGenerateMetadata
      ? `Create a link for ${url} and automatically generate a good title and relevant tags`
      : `Create a link for ${url}`;

    const context = {
      userId,
      url,
      autoGenerateMetadata,
    };

    const result = await agent.run(goal, context);

    return {
      success: true,
      link: result.result.link,
      logs: result.logs,
    };
  }

  /**
   * Add intelligent notes to a link
   */
  async addNoteToLink(
    linkId: string,
    noteContent: string,
    userId: string
  ): Promise<any> {
    const agent = this.createAgent({
      tools: [addNoteTool],
    });

    const goal = `Add a note to link ${linkId}: ${noteContent}`;
    const context = {
      userId,
      linkId,
      noteContent,
    };

    const result = await agent.run(goal, context);

    return {
      success: true,
      note: result.result.note,
      logs: result.logs,
    };
  }

  /**
   * Handle a new lead (for business use case)
   */
  async handleLead(leadData: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    source?: string;
  }): Promise<any> {
    const agent = this.createAgent({
      tools: [...getCustomTools()],
      skills: [leadResearchSkill, emailDraftingSkill],
      subagents: [researcherSubagent],
    });

    const goal = `Handle this lead: Research the lead, draft a personalized email, and provide next steps`;
    const context = {
      lead: leadData,
      emailPurpose: 'introduction',
    };

    const result = await agent.run(goal, context);

    return {
      success: true,
      lead: leadData,
      research: result.result.research,
      emailDraft: result.result.emailDraft,
      nextSteps: result.result.nextSteps || [],
      logs: result.logs,
    };
  }

  /**
   * General agent query
   */
  async query(
    goal: string,
    context: Record<string, any> = {}
  ): Promise<AgentResponse> {
    const agent = this.createAgent({
      tools: [...getBuiltinTools(), ...getCustomTools()],
      skills: [],
      subagents: [],
    });

    return await agent.run(goal, context);
  }

  /**
   * Create an agent with custom configuration
   */
  private createAgent(customConfig: Partial<AgentConfig> = {}): Agent {
    const config: AgentConfig = {
      ...this.defaultConfig,
      tools: customConfig.tools || [...getBuiltinTools()],
      skills: customConfig.skills || [],
      subagents: customConfig.subagents || [],
      hooks: [
        ...(this.defaultConfig.enableGuardRails ? getGuardRailHooks() : []),
        ...(this.defaultConfig.enableLogging ? getLoggingHooks() : []),
      ],
      ...customConfig,
    } as AgentConfig;

    return new Agent(config);
  }
}

/**
 * Factory function to create the service
 */
export function createAgentService(apiKey: string): LinksDeckAgentService {
  return new LinksDeckAgentService(apiKey);
}

/**
 * Example usage in a React Native API call
 */
export async function exampleUsage() {
  const service = createAgentService(process.env.ANTHROPIC_API_KEY!);

  // Search links
  const searchResult = await service.searchLinks(
    '最近保存したReactの記事',
    'user123'
  );
  console.log('Search result:', searchResult);

  // Create link
  const createResult = await service.createLink(
    'https://react.dev',
    'user123',
    true
  );
  console.log('Create result:', createResult);

  // Handle lead
  const leadResult = await service.handleLead({
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Tech Corp',
  });
  console.log('Lead result:', leadResult);
}
