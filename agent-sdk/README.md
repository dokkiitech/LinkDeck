# Claude Agent SDK

A comprehensive Agent SDK implementation for building intelligent agents powered by Claude AI.

## Architecture

This SDK implements the **observe → think → act → learn → repeat** agent loop:

```
┌─────────────────────────────────────────┐
│              GOAL                       │
│         "handle this lead"              │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           AGENT LOOP                    │
│  observe → think → act → learn → repeat │
└─────────────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│SUBAGENTS│ │ SKILLS  │ │  TOOLS  │
├─────────┤ ├─────────┤ ├─────────┤
│code-    │ │lead-    │ │Built-in:│
│reviewer │ │research │ │Read,    │
│         │ │         │ │Write,   │
│test-    │ │email-   │ │Bash,    │
│runner   │ │drafting │ │Grep...  │
│         │ │         │ │         │
│research │ │(domain  │ │MCP:     │
│er       │ │expertise│ │Zapier,  │
│         │ │auto-    │ │DBs,     │
│(parallel│ │invoked) │ │APIs...  │
│isolated)│ │         │ │         │
│         │ │         │ │Custom:  │
│         │ │         │ │your fns │
└─────────┘ └─────────┘ └─────────┘
         │         │         │
         └─────────┴─────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│              HOOKS                      │
│  guard rails, logging, human-in-loop    │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        STRUCTURED OUTPUT                │
│  validated JSON matching your schema    │
└─────────────────────────────────────────┘
```

## Components

### 1. Agent Loop
The core reasoning loop that drives the agent:

- **OBSERVE**: Gather information from the environment
- **THINK**: Reason about what to do next using Claude
- **ACT**: Execute tools, skills, or spawn subagents
- **LEARN**: Extract insights and update memory

### 2. Tools
Three categories of tools:

- **Built-in**: File operations, HTTP requests, search
- **MCP**: Integration with external services (future)
- **Custom**: Application-specific tools

### 3. Skills
Domain expertise that can auto-invoke:

- **lead-research**: Automatically research leads
- **email-drafting**: Draft personalized emails

### 4. Subagents
Parallel, isolated task executors:

- **code-reviewer**: Reviews code for quality and security
- **test-runner**: Runs tests and reports results
- **researcher**: Conducts research on topics

### 5. Hooks
Guard rails and monitoring:

- **Guard Rails**: Content safety, rate limiting, data privacy
- **Logging**: Action logs, performance metrics, audit trail
- **Human-in-Loop**: Require approval for critical actions

### 6. Structured Output
Validated using Zod schemas:

- Type-safe data structures
- Runtime validation
- Clear error messages

## Installation

```bash
pnpm install @anthropic-ai/sdk zod @types/node
```

## Quick Start

```typescript
import { Agent, getBuiltinTools, getCustomTools } from './agent-sdk';

// Create an agent
const agent = new Agent({
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxIterations: 10,
  tools: [...getBuiltinTools(), ...getCustomTools()],
  skills: [],
  subagents: [],
  hooks: [],
  enableLogging: true,
  enableGuardRails: true,
  enableHumanInLoop: false,
});

// Run the agent
const result = await agent.run(
  'Search for React documentation links',
  { userId: 'user123' }
);

console.log(result);
```

## Lead Handling Example

Complete workflow for handling a lead:

```typescript
import { handleLead } from './agent-sdk/examples/lead-handling';

const leadData = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  company: 'Tech Innovations Inc',
  phone: '+1-555-0123',
  source: 'website_form',
};

const result = await handleLead(leadData, apiKey);

// Result includes:
// - Validated lead data
// - Research about the lead/company
// - Drafted personalized email
// - Next steps
// - Full audit logs
```

## Project Structure

```
agent-sdk/
├── core/              # Core agent implementation
│   ├── agent.ts       # Main agent loop
│   └── types.ts       # TypeScript types
├── tools/             # Tool implementations
│   ├── builtin.ts     # Built-in tools (read, write, etc.)
│   └── custom.ts      # Custom tools (LinksDeck-specific)
├── skills/            # Domain expertise
│   ├── lead-research.ts
│   └── email-drafting.ts
├── subagents/         # Parallel task executors
│   ├── code-reviewer.ts
│   ├── test-runner.ts
│   └── researcher.ts
├── hooks/             # Guard rails and logging
│   ├── guard-rails.ts
│   └── logging.ts
├── schemas/           # Zod schemas for validation
│   └── lead.ts
├── examples/          # Example implementations
│   └── lead-handling.ts
├── index.ts           # Main entry point
└── README.md          # This file
```

## API Reference

### Agent

```typescript
class Agent {
  constructor(config: AgentConfig)
  async run(goal: string, initialContext?: Record<string, any>): Promise<AgentResponse>
}
```

### Tool

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: any) => Promise<any>;
  category: 'builtin' | 'mcp' | 'custom';
}
```

### Skill

```typescript
interface Skill {
  name: string;
  description: string;
  domain: string;
  autoInvoke: boolean;
  triggers?: string[];
  execute: (context: AgentState) => Promise<any>;
}
```

### Subagent

```typescript
interface Subagent {
  name: string;
  description: string;
  type: 'code-reviewer' | 'test-runner' | 'researcher' | 'custom';
  isolated: boolean;
  execute: (task: string, context: Record<string, any>) => Promise<any>;
}
```

### Hook

```typescript
interface Hook {
  name: string;
  type: 'pre-action' | 'post-action' | 'error' | 'logging' | 'guard-rail' | 'human-in-loop';
  execute: (context: HookContext) => Promise<HookResult>;
}
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional
AGENT_MAX_ITERATIONS=10
AGENT_ENABLE_LOGGING=true
AGENT_ENABLE_GUARD_RAILS=true
```

## Running Examples

```bash
# Set your API key
export ANTHROPIC_API_KEY=your_api_key_here

# Run the lead handling example
npx ts-node agent-sdk/examples/lead-handling.ts
```

## Integration with React Native

The agent SDK runs on the server side. To integrate with your React Native app:

1. Create API endpoints that use the agent SDK
2. Call these endpoints from your React Native app
3. Display results in your UI

Example integration coming soon!

## Testing

```bash
# Run tests (when implemented)
npm test

# Run specific test
npm test -- lead-handling
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## Support

For issues and questions:
- GitHub Issues: [Your repo URL]
- Documentation: [Your docs URL]
- Email: support@example.com
