/**
 * Claude Agent SDK - Main Entry Point
 *
 * This SDK implements the agent loop architecture:
 * observe → think → act → learn → repeat
 *
 * Components:
 * - Agent Loop: Core reasoning and action loop
 * - Tools: Built-in, MCP, and custom tools
 * - Skills: Domain expertise that auto-invokes
 * - Subagents: Parallel, isolated task executors
 * - Hooks: Guard rails, logging, human-in-the-loop
 * - Schemas: Structured output validation with Zod
 */

// Core exports
export { Agent } from './core/agent';
export * from './core/types';

// Tools exports
export { getBuiltinTools } from './tools/builtin';
export { getCustomTools } from './tools/custom';

// Skills exports
export { leadResearchSkill } from './skills/lead-research';
export { emailDraftingSkill, draftEmailWithClaude } from './skills/email-drafting';

// Subagents exports
export { codeReviewerSubagent } from './subagents/code-reviewer';
export { testRunnerSubagent } from './subagents/test-runner';
export { researcherSubagent } from './subagents/researcher';

// Hooks exports
export { getGuardRailHooks } from './hooks/guard-rails';
export { getLoggingHooks, getAuditTrail, getPerformanceMetrics } from './hooks/logging';

// Schemas exports
export * from './schemas/lead';

// Examples exports
export { handleLead, runExample } from './examples/lead-handling';

/**
 * Quick Start Example
 */
export async function quickStart(apiKey: string) {
  const { Agent } = require('./core/agent');
  const { getBuiltinTools } = require('./tools/builtin');
  const { getCustomTools } = require('./tools/custom');

  const agent = new Agent({
    model: 'claude-3-5-sonnet-20241022',
    apiKey,
    maxIterations: 5,
    tools: [...getBuiltinTools(), ...getCustomTools()],
    skills: [],
    subagents: [],
    hooks: [],
    enableLogging: true,
    enableGuardRails: false,
    enableHumanInLoop: false,
  });

  const result = await agent.run('Say hello and explain what you can do');

  console.log('Agent response:', result);

  return result;
}
