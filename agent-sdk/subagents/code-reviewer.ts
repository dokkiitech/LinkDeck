/**
 * Code Reviewer Subagent
 * Reviews code for quality, security, and best practices
 */

import Anthropic from '@anthropic-ai/sdk';
import { Subagent } from '../core/types';

export const codeReviewerSubagent: Subagent = {
  name: 'code-reviewer',
  description: 'Reviews code for quality, security, and best practices',
  type: 'code-reviewer',
  isolated: true,

  execute: async (task: string, context: Record<string, any>): Promise<any> => {
    const { code, language, apiKey } = context;

    if (!code) {
      return {
        success: false,
        error: 'No code provided for review',
      };
    }

    console.log('🔍 Code Reviewer analyzing code...');

    // Use Claude for code review
    if (apiKey) {
      const client = new Anthropic({ apiKey });

      const prompt = `Review the following ${language || 'code'} for:
1. Code quality and best practices
2. Potential bugs or errors
3. Security vulnerabilities
4. Performance issues
5. Suggestions for improvement

Code:
\`\`\`${language || ''}
${code}
\`\`\`

Provide a structured review with:
- Overall assessment (good/needs_improvement/critical_issues)
- List of issues found (with severity: low/medium/high)
- Specific recommendations
- Security concerns (if any)`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const reviewText = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      return {
        success: true,
        review: reviewText,
        timestamp: new Date(),
        reviewer: 'code-reviewer-subagent',
      };
    }

    // Fallback: basic review without Claude
    const basicReview = {
      assessment: 'needs_review',
      issues: [
        {
          severity: 'info',
          message: 'Code review requires API key for detailed analysis',
        },
      ],
      recommendations: [
        'Configure Claude API key for comprehensive code review',
      ],
    };

    return {
      success: true,
      review: basicReview,
      timestamp: new Date(),
      reviewer: 'code-reviewer-subagent',
    };
  },
};
