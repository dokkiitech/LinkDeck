/**
 * Claude Agent SDK - Core Types
 *
 * This file defines the core types for the agent system based on the
 * observe → think → act → learn → repeat loop.
 */

import { z } from 'zod';

/**
 * Agent Loop Phases
 * The agent follows: observe → think → act → learn → repeat
 */
export type AgentPhase = 'observe' | 'think' | 'act' | 'learn';

/**
 * Agent State - tracks the current state of the agent
 */
export interface AgentState {
  phase: AgentPhase;
  iteration: number;
  context: Record<string, any>;
  memory: Memory[];
  goal: string;
}

/**
 * Memory entry for the agent's learning
 */
export interface Memory {
  id: string;
  timestamp: Date;
  phase: AgentPhase;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Observation - what the agent perceives
 */
export interface Observation {
  type: 'user_input' | 'tool_result' | 'subagent_result' | 'environment';
  content: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Thought - the agent's reasoning
 */
export interface Thought {
  reasoning: string;
  nextAction: string;
  confidence: number;
  alternatives?: string[];
}

/**
 * Action - what the agent does
 */
export interface Action {
  type: 'tool_use' | 'skill_invoke' | 'subagent_spawn' | 'respond';
  target: string;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Learning - what the agent learns from the action
 */
export interface Learning {
  success: boolean;
  insights: string[];
  adjustments: string[];
  newKnowledge?: Record<string, any>;
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: any) => Promise<any>;
  category: 'builtin' | 'mcp' | 'custom';
}

/**
 * Skill definition
 */
export interface Skill {
  name: string;
  description: string;
  domain: string;
  autoInvoke: boolean;
  triggers?: string[];
  execute: (context: AgentState) => Promise<any>;
}

/**
 * Subagent definition
 */
export interface Subagent {
  name: string;
  description: string;
  type: 'code-reviewer' | 'test-runner' | 'researcher' | 'custom';
  isolated: boolean;
  execute: (task: string, context: Record<string, any>) => Promise<any>;
}

/**
 * Hook definition for guard rails and logging
 */
export interface Hook {
  name: string;
  type: 'pre-action' | 'post-action' | 'error' | 'logging' | 'guard-rail' | 'human-in-loop';
  execute: (context: HookContext) => Promise<HookResult>;
}

export interface HookContext {
  phase: AgentPhase;
  state: AgentState;
  action?: Action;
  result?: any;
  error?: Error;
}

export interface HookResult {
  allowed: boolean;
  modified?: any;
  message?: string;
  requireHumanApproval?: boolean;
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  model: string;
  apiKey: string;
  maxIterations: number;
  tools: Tool[];
  skills: Skill[];
  subagents: Subagent[];
  hooks: Hook[];
  enableLogging: boolean;
  enableGuardRails: boolean;
  enableHumanInLoop: boolean;
}

/**
 * Agent Response
 */
export interface AgentResponse {
  success: boolean;
  result: any;
  iterations: number;
  logs: string[];
  memory: Memory[];
}
