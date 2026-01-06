/**
 * Lead Handling Example
 * Demonstrates the complete agent SDK workflow for handling a lead
 *
 * This example shows:
 * - Agent Loop (observe → think → act → learn → repeat)
 * - Tools (custom tools for CRM and email)
 * - Skills (lead research and email drafting)
 * - Subagents (researcher)
 * - Hooks (guard rails and logging)
 * - Structured Output (validated with Zod schemas)
 */

import { Agent } from '../core/agent';
import { AgentConfig } from '../core/types';
import { getBuiltinTools } from '../tools/builtin';
import { getCustomTools } from '../tools/custom';
import { leadResearchSkill } from '../skills/lead-research';
import { emailDraftingSkill } from '../skills/email-drafting';
import { researcherSubagent } from '../subagents/researcher';
import { codeReviewerSubagent } from '../subagents/code-reviewer';
import { testRunnerSubagent } from '../subagents/test-runner';
import { getGuardRailHooks } from '../hooks/guard-rails';
import { getLoggingHooks } from '../hooks/logging';
import { validateLead, validateLeadHandlingResult, LeadHandlingResult } from '../schemas/lead';

/**
 * Main function to handle a lead
 */
export async function handleLead(
  leadData: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    source?: string;
    notes?: string;
  },
  apiKey: string
): Promise<LeadHandlingResult> {
  console.log('🎯 Starting Lead Handling Workflow');
  console.log('Lead:', leadData);

  // Validate lead data with Zod schema
  const validatedLead = validateLead(leadData);

  // Configure the agent
  const config: AgentConfig = {
    model: 'claude-3-5-sonnet-20241022',
    apiKey,
    maxIterations: 10,
    tools: [
      ...getBuiltinTools(),
      ...getCustomTools(),
    ],
    skills: [
      leadResearchSkill,
      emailDraftingSkill,
    ],
    subagents: [
      researcherSubagent,
      codeReviewerSubagent,
      testRunnerSubagent,
    ],
    hooks: [
      ...getGuardRailHooks(),
      ...getLoggingHooks(),
    ],
    enableLogging: true,
    enableGuardRails: true,
    enableHumanInLoop: true,
  };

  // Create the agent
  const agent = new Agent(config);

  // Define the goal
  const goal = `Handle this lead: Research the lead, draft a personalized introduction email, and prepare next steps.`;

  // Initial context with lead information
  const initialContext = {
    lead: validatedLead,
    emailPurpose: 'introduction',
    sender_name: 'John Smith',
    product_name: 'LinksDeck',
    pain_point: 'organize and manage important links',
    benefit: 'never lose track of important resources',
  };

  // Run the agent
  const agentResponse = await agent.run(goal, initialContext);

  console.log('\n✅ Lead Handling Complete!');
  console.log('Iterations:', agentResponse.iterations);

  // Structure the result according to our schema
  const result: LeadHandlingResult = {
    success: agentResponse.success,
    leadId: `lead_${Date.now()}`,
    lead: validatedLead,
    research: undefined, // Would be populated by the agent
    emailDraft: undefined, // Would be populated by the agent
    nextSteps: [
      'Review the drafted email',
      'Approve or edit the email',
      'Send the email to the lead',
      'Schedule follow-up in 3 days',
      'Add lead to CRM pipeline',
    ],
    status: 'researched',
    logs: agentResponse.logs,
    timestamp: new Date().toISOString(),
  };

  // Validate the result with Zod schema
  const validatedResult = validateLeadHandlingResult(result);

  return validatedResult;
}

/**
 * Example usage
 */
export async function runExample() {
  // Example lead data
  const leadData = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    company: 'Tech Innovations Inc',
    phone: '+1-555-0123',
    source: 'website_form',
    notes: 'Interested in enterprise plan',
  };

  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
    console.log('Please set your API key:');
    console.log('export ANTHROPIC_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    const result = await handleLead(leadData, apiKey);

    console.log('\n📊 Final Result:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n📝 Next Steps:');
    result.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });

  } catch (error: any) {
    console.error('❌ Error handling lead:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  }
}

// Run the example if executed directly
if (require.main === module) {
  runExample();
}
