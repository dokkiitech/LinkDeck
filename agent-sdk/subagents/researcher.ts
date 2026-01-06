/**
 * Researcher Subagent
 * Conducts research on topics using available data sources
 */

import Anthropic from '@anthropic-ai/sdk';
import { Subagent } from '../core/types';

export const researcherSubagent: Subagent = {
  name: 'researcher',
  description: 'Conducts research on topics and gathers information',
  type: 'researcher',
  isolated: true,

  execute: async (task: string, context: Record<string, any>): Promise<any> => {
    const { topic, depth, sources, apiKey } = context;

    if (!topic) {
      return {
        success: false,
        error: 'No research topic provided',
      };
    }

    console.log('📚 Researcher analyzing topic:', topic);

    // Use Claude for research
    if (apiKey) {
      const client = new Anthropic({ apiKey });

      const researchDepth = depth || 'comprehensive';
      const sourcesInfo = sources?.length
        ? `Available sources:\n${sources.join('\n')}`
        : 'Use general knowledge';

      const prompt = `Conduct ${researchDepth} research on: ${topic}

${sourcesInfo}

Provide:
1. Executive Summary
2. Key Findings (bullet points)
3. Detailed Analysis
4. Recommendations
5. Sources/References

Format the response in a structured way.`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const researchText = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Parse the research into structured format
      const research = parseResearch(researchText);

      return {
        success: true,
        topic,
        research,
        rawResearch: researchText,
        timestamp: new Date(),
        researcher: 'researcher-subagent',
      };
    }

    // Fallback: basic research without Claude
    return {
      success: false,
      error: 'Research requires API key for comprehensive analysis',
      topic,
    };
  },
};

/**
 * Parse research text into structured format
 */
function parseResearch(text: string) {
  // Simple parsing - in production, use more robust parsing
  const sections = text.split(/\n(?=\d+\.|\#)/);

  return {
    summary: sections[0] || text.substring(0, 500),
    keyFindings: extractBulletPoints(text, 'Key Findings'),
    analysis: extractSection(text, 'Analysis') || extractSection(text, 'Detailed Analysis'),
    recommendations: extractBulletPoints(text, 'Recommendations'),
    fullText: text,
  };
}

function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(`${sectionName}:?\\s*\\n([\\s\\S]*?)(?=\\n\\d+\\.|\\n#|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractBulletPoints(text: string, sectionName: string): string[] {
  const section = extractSection(text, sectionName);
  if (!section) return [];

  return section
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, '').trim());
}
