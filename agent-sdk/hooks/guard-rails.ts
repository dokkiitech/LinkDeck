/**
 * Guard Rails Hooks
 * Prevent unsafe or unwanted actions
 */

import { Hook, HookContext, HookResult } from '../core/types';

/**
 * Content Safety Hook
 * Prevents sending inappropriate content
 */
export const contentSafetyHook: Hook = {
  name: 'content-safety',
  type: 'guard-rail',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { action } = context;

    if (!action) {
      return { allowed: true };
    }

    // Check for inappropriate content in email sending
    if (action.type === 'tool_use' && action.target === 'send_email') {
      const body = action.parameters.body || '';
      const subject = action.parameters.subject || '';
      const content = `${subject} ${body}`.toLowerCase();

      // List of inappropriate keywords (simplified)
      const inappropriateKeywords = [
        'spam',
        'guaranteed',
        'click here now',
        'limited time',
        'act now',
      ];

      const foundInappropriate = inappropriateKeywords.some(keyword =>
        content.includes(keyword)
      );

      if (foundInappropriate) {
        return {
          allowed: false,
          message: 'Email content flagged as potentially spam-like',
          requireHumanApproval: true,
        };
      }
    }

    return { allowed: true };
  },
};

/**
 * Rate Limiting Hook
 * Prevents too many actions in a short time
 */
const actionCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimitingHook: Hook = {
  name: 'rate-limiting',
  type: 'guard-rail',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { action } = context;

    if (!action) {
      return { allowed: true };
    }

    // Rate limit email sending (max 10 per hour)
    if (action.type === 'tool_use' && action.target === 'send_email') {
      const now = Date.now();
      const key = 'send_email';
      const limit = 10;
      const windowMs = 60 * 60 * 1000; // 1 hour

      let counter = actionCounts.get(key);

      if (!counter || counter.resetAt < now) {
        counter = { count: 0, resetAt: now + windowMs };
        actionCounts.set(key, counter);
      }

      counter.count++;

      if (counter.count > limit) {
        return {
          allowed: false,
          message: `Rate limit exceeded: Maximum ${limit} emails per hour`,
        };
      }
    }

    return { allowed: true };
  },
};

/**
 * Data Privacy Hook
 * Prevents leaking sensitive information
 */
export const dataPrivacyHook: Hook = {
  name: 'data-privacy',
  type: 'guard-rail',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { action } = context;

    if (!action) {
      return { allowed: true };
    }

    // Check for sensitive data patterns
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\bsk_live_\w+\b/, // API keys
      /password\s*[:=]\s*\S+/i,
    ];

    const paramsString = JSON.stringify(action.parameters);

    for (const pattern of sensitivePatterns) {
      if (pattern.test(paramsString)) {
        return {
          allowed: false,
          message: 'Action contains potentially sensitive data',
          requireHumanApproval: true,
        };
      }
    }

    return { allowed: true };
  },
};

/**
 * Human Approval Hook
 * Requires human approval for critical actions
 */
export const humanApprovalHook: Hook = {
  name: 'human-approval',
  type: 'human-in-loop',

  execute: async (context: HookContext): Promise<HookResult> => {
    const { action, state } = context;

    if (!action) {
      return { allowed: true };
    }

    // Require approval for certain critical actions
    const criticalActions = ['send_email', 'create_lead', 'write_file'];

    if (action.type === 'tool_use' && criticalActions.includes(action.target)) {
      // In a real implementation, this would pause and request human approval
      console.log('⏸️  Requesting human approval for:', action.target);

      return {
        allowed: true, // For demo purposes, auto-approve
        message: `Human approval required for ${action.target}`,
        requireHumanApproval: true,
      };
    }

    return { allowed: true };
  },
};

/**
 * Get all guard rail hooks
 */
export function getGuardRailHooks(): Hook[] {
  return [
    contentSafetyHook,
    rateLimitingHook,
    dataPrivacyHook,
    humanApprovalHook,
  ];
}
