/**
 * Lead Schemas
 * Structured output schemas for lead handling
 */

import { z } from 'zod';

/**
 * Lead Information Schema
 */
export const LeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

/**
 * Lead Research Result Schema
 */
export const LeadResearchSchema = z.object({
  lead: LeadSchema,
  companyInfo: z.object({
    name: z.string(),
    industry: z.string().optional(),
    size: z.string().optional(),
    website: z.string().url().optional(),
    founded: z.string().optional(),
    revenue: z.string().optional(),
  }),
  professionalBackground: z.object({
    position: z.string().optional(),
    yearsOfExperience: z.string().optional(),
    linkedInProfile: z.string().url().optional(),
    education: z.string().optional(),
  }),
  insights: z.array(z.string()),
  recommendedApproach: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export type LeadResearch = z.infer<typeof LeadResearchSchema>;

/**
 * Email Draft Schema
 */
export const EmailDraftSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(10, 'Email body is too short'),
  draft: z.string(),
  requiresApproval: z.boolean().default(true),
  metadata: z.object({
    purpose: z.string().optional(),
    template: z.string().optional(),
    personalizations: z.array(z.string()).optional(),
  }).optional(),
});

export type EmailDraft = z.infer<typeof EmailDraftSchema>;

/**
 * Lead Handling Result Schema
 */
export const LeadHandlingResultSchema = z.object({
  success: z.boolean(),
  leadId: z.string(),
  lead: LeadSchema,
  research: LeadResearchSchema.optional(),
  emailDraft: EmailDraftSchema.optional(),
  nextSteps: z.array(z.string()),
  status: z.enum(['created', 'researched', 'contacted', 'qualified', 'disqualified']),
  logs: z.array(z.string()),
  timestamp: z.string().datetime(),
});

export type LeadHandlingResult = z.infer<typeof LeadHandlingResultSchema>;

/**
 * Validate and parse lead data
 */
export function validateLead(data: unknown): Lead {
  return LeadSchema.parse(data);
}

/**
 * Validate and parse lead research
 */
export function validateLeadResearch(data: unknown): LeadResearch {
  return LeadResearchSchema.parse(data);
}

/**
 * Validate and parse email draft
 */
export function validateEmailDraft(data: unknown): EmailDraft {
  return EmailDraftSchema.parse(data);
}

/**
 * Validate and parse lead handling result
 */
export function validateLeadHandlingResult(data: unknown): LeadHandlingResult {
  return LeadHandlingResultSchema.parse(data);
}
