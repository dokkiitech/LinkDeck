/**
 * Email Drafting Skill
 * Automatically drafts personalized emails based on context
 */

import Anthropic from '@anthropic-ai/sdk';
import { Skill, AgentState } from '../core/types';

export const emailDraftingSkill: Skill = {
  name: 'email-drafting',
  description: 'Draft personalized emails for leads and contacts',
  domain: 'communication',
  autoInvoke: true,
  triggers: ['draft_email', 'send_email', 'follow_up'],

  execute: async (state: AgentState): Promise<any> => {
    const { context } = state;
    const lead = context.lead;
    const research = context.research;
    const purpose = context.emailPurpose || 'introduction';

    console.log('✍️  Drafting email for:', lead?.name || 'recipient');

    // In a real implementation, we would use Claude to generate personalized emails
    // For now, we'll use template-based generation

    const templates: Record<string, (lead: any, research: any) => string> = {
      introduction: (lead, research) => `Subject: Quick question about ${lead.company}'s workflow

Hi ${lead.name?.split(' ')[0]},

I noticed ${lead.company} recently ${research?.insights?.[0] || 'has been growing'}, congratulations!

I'm reaching out because many companies in your space are looking for better ways to ${context.pain_point || 'manage their workflows'}.

Would you be open to a quick 15-minute call to discuss how ${context.product_name || 'our solution'} might help ${lead.company} ${context.benefit || 'streamline operations'}?

Best regards,
${context.sender_name || 'Sales Team'}`,

      follow_up: (lead, research) => `Subject: Following up - ${lead.company}

Hi ${lead.name?.split(' ')[0]},

I wanted to follow up on my previous email about ${context.topic || 'our conversation'}.

${research?.insights?.[0] ? `I saw that ${research.insights[0]}, which makes this particularly relevant.` : ''}

Are you available for a brief call this week?

Best,
${context.sender_name || 'Sales Team'}`,

      demo: (lead, research) => `Subject: Demo invitation for ${lead.company}

Hi ${lead.name?.split(' ')[0]},

Thanks for your interest in ${context.product_name || 'our product'}.

Based on your needs around ${context.use_case || 'workflow management'}, I'd like to show you:

${(research?.recommendedApproach || ['Feature 1', 'Feature 2']).map((feature: string) => `• ${feature}`).join('\n')}

When works best for you this week for a 20-minute demo?

Looking forward to it,
${context.sender_name || 'Sales Team'}`,
    };

    const template = templates[purpose] || templates.introduction;
    const emailContent = template(lead, research);

    return {
      success: true,
      email: {
        to: lead?.email,
        subject: emailContent.split('\n')[0].replace('Subject: ', ''),
        body: emailContent.split('\n').slice(2).join('\n').trim(),
        draft: emailContent,
      },
      requiresApproval: true, // Always require human approval before sending
    };
  },
};

/**
 * Advanced Email Drafting with Claude
 */
export async function draftEmailWithClaude(
  apiKey: string,
  lead: any,
  research: any,
  purpose: string,
  context: any
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const prompt = `Draft a professional, personalized email for the following context:

Lead Information:
- Name: ${lead.name}
- Company: ${lead.company}
- Email: ${lead.email}

Research Insights:
${research?.insights?.map((insight: string) => `- ${insight}`).join('\n') || 'No research available'}

Purpose: ${purpose}

The email should:
1. Be concise and professional
2. Personalize based on the research insights
3. Have a clear call-to-action
4. Be no longer than 150 words
5. Sound natural and conversational

Generate only the email content (including subject line).`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const emailContent = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  return emailContent;
}
