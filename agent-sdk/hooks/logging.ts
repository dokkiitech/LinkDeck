/**
 * Logging Hooks
 * Track and log agent activities
 */

import { Hook, HookContext, HookResult } from '../core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Action Logger Hook
 * Logs all actions taken by the agent
 */
export const actionLoggerHook: Hook = {
  name: 'action-logger',
  type: 'logging',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { phase, action, state } = context;

    const logEntry = {
      timestamp: new Date().toISOString(),
      phase,
      iteration: state.iteration,
      action: action ? {
        type: action.type,
        target: action.target,
        parameters: action.parameters,
      } : null,
    };

    console.log('📝 Action Log:', JSON.stringify(logEntry, null, 2));

    // In production, write to a proper logging system
    // await writeToLogFile(logEntry);

    return { allowed: true };
  },
};

/**
 * Performance Logger Hook
 * Tracks performance metrics
 */
const performanceMetrics = new Map<string, number[]>();

export const performanceLoggerHook: Hook = {
  name: 'performance-logger',
  type: 'logging',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { phase, state, action } = context;

    if (action) {
      const key = `${action.type}_${action.target}`;
      const startTime = state.context[`_start_${key}`];

      if (startTime) {
        const duration = Date.now() - startTime;

        if (!performanceMetrics.has(key)) {
          performanceMetrics.set(key, []);
        }

        performanceMetrics.get(key)!.push(duration);

        console.log(`⏱️  Performance: ${key} took ${duration}ms`);

        // Calculate average
        const durations = performanceMetrics.get(key)!;
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        console.log(`   Average: ${avg.toFixed(2)}ms over ${durations.length} calls`);

        delete state.context[`_start_${key}`];
      } else {
        // Start timing
        state.context[`_start_${action.type}_${action.target}`] = Date.now();
      }
    }

    return { allowed: true };
  },
};

/**
 * Audit Trail Hook
 * Maintains a detailed audit trail
 */
const auditTrail: any[] = [];

export const auditTrailHook: Hook = {
  name: 'audit-trail',
  type: 'logging',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { phase, action, state, result, error } = context;

    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      phase,
      iteration: state.iteration,
      goal: state.goal,
      action: action ? {
        type: action.type,
        target: action.target,
        parameters: sanitizeForAudit(action.parameters),
      } : null,
      result: result ? sanitizeForAudit(result) : null,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : null,
    };

    auditTrail.push(auditEntry);

    // Keep only last 1000 entries
    if (auditTrail.length > 1000) {
      auditTrail.shift();
    }

    // In production, persist to database
    // await persistAuditEntry(auditEntry);

    return { allowed: true };
  },
};

/**
 * Sanitize data for audit (remove sensitive info)
 */
function sanitizeForAudit(data: any): any {
  if (!data) return data;

  const sanitized = JSON.parse(JSON.stringify(data));

  // Remove sensitive fields
  const sensitiveFields = ['password', 'apiKey', 'secret', 'token', 'creditCard'];

  function removeSensitive(obj: any) {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        removeSensitive(obj[key]);
      }
    }
  }

  removeSensitive(sanitized);
  return sanitized;
}

/**
 * Get all logging hooks
 */
export function getLoggingHooks(): Hook[] {
  return [
    actionLoggerHook,
    performanceLoggerHook,
    auditTrailHook,
  ];
}

/**
 * Get audit trail
 */
export function getAuditTrail(): any[] {
  return [...auditTrail];
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): Map<string, number[]> {
  return new Map(performanceMetrics);
}
