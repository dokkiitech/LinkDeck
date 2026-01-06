# Claude Agent SDK - Implementation Guide

This document provides a comprehensive guide to the Claude Agent SDK implementation in LinksDeck.

## Overview

The Claude Agent SDK has been successfully integrated into LinksDeck following the architecture diagram:

```
GOAL: "handle this lead"
         ↓
AGENT LOOP: observe → think → act → learn → repeat
         ↓
    ┌────────┬─────────┬─────────┐
    │        │         │         │
SUBAGENTS  SKILLS    TOOLS
         │         │         │
    └────────┴─────────┴─────────┘
         ↓
      HOOKS
         ↓
STRUCTURED OUTPUT
```

## What Has Been Implemented

### ✅ Core Components

1. **Agent Loop** (`agent-sdk/core/`)
   - Main agent class with observe-think-act-learn loop
   - State management and memory system
   - Integration with Claude API
   - Iteration control and goal tracking

2. **Tools** (`agent-sdk/tools/`)
   - **Built-in Tools**: File operations (read, write, list, search), HTTP requests
   - **Custom Tools**: LinksDeck-specific (search links, create link, add note)
   - **Business Tools**: Lead management (create lead, send email)

3. **Skills** (`agent-sdk/skills/`)
   - **Lead Research**: Automatic lead/company research
   - **Email Drafting**: Personalized email generation with Claude

4. **Subagents** (`agent-sdk/subagents/`)
   - **Code Reviewer**: Analyzes code for quality and security
   - **Test Runner**: Executes tests and reports results
   - **Researcher**: Conducts topic research

5. **Hooks** (`agent-sdk/hooks/`)
   - **Guard Rails**: Content safety, rate limiting, data privacy
   - **Logging**: Action logs, performance metrics, audit trails
   - **Human-in-Loop**: Approval requirements for critical actions

6. **Schemas** (`agent-sdk/schemas/`)
   - Zod-based validation for structured outputs
   - Lead, email, and result schemas
   - Type-safe data handling

7. **Examples** (`agent-sdk/examples/`)
   - Complete lead handling workflow
   - Demonstrates all components working together

8. **Integration** (`agent-sdk/integration/`)
   - React Native service bridge
   - LinksDeck-specific agent service

## File Structure

```
agent-sdk/
├── core/
│   ├── agent.ts              # Main agent implementation
│   └── types.ts              # TypeScript type definitions
├── tools/
│   ├── builtin.ts            # Built-in tools (file ops, HTTP)
│   └── custom.ts             # Custom tools (LinksDeck-specific)
├── skills/
│   ├── lead-research.ts      # Lead research skill
│   └── email-drafting.ts     # Email drafting skill
├── subagents/
│   ├── code-reviewer.ts      # Code review subagent
│   ├── test-runner.ts        # Test execution subagent
│   └── researcher.ts         # Research subagent
├── hooks/
│   ├── guard-rails.ts        # Safety and privacy hooks
│   └── logging.ts            # Logging and monitoring hooks
├── schemas/
│   └── lead.ts               # Zod schemas for validation
├── examples/
│   └── lead-handling.ts      # Complete example workflow
├── integration/
│   └── react-native-service.ts # React Native integration
├── index.ts                  # Main entry point
├── README.md                 # Documentation
├── tsconfig.json             # TypeScript configuration
└── .env.example              # Environment variables template
```

## How to Use

### 1. Setup

```bash
# Install dependencies (already done)
pnpm install

# Set up environment variables
cp agent-sdk/.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Run the Example

```bash
# Set your API key
export ANTHROPIC_API_KEY=your_api_key_here

# Run the lead handling example
pnpm agent:example
```

### 3. Use in Your Code

#### Basic Agent Usage

```typescript
import { Agent, getBuiltinTools } from './agent-sdk';

const agent = new Agent({
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxIterations: 10,
  tools: getBuiltinTools(),
  skills: [],
  subagents: [],
  hooks: [],
  enableLogging: true,
  enableGuardRails: true,
  enableHumanInLoop: false,
});

const result = await agent.run(
  'Find all React documentation links',
  { userId: 'user123' }
);
```

#### Lead Handling

```typescript
import { handleLead } from './agent-sdk/examples/lead-handling';

const result = await handleLead(
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Tech Corp',
  },
  apiKey
);
```

#### React Native Integration

```typescript
import { createAgentService } from './agent-sdk/integration/react-native-service';

const agentService = createAgentService(apiKey);

// Search links
const searchResult = await agentService.searchLinks(
  '最近保存したReactの記事',
  userId
);

// Create link with AI
const createResult = await agentService.createLink(
  'https://react.dev',
  userId,
  true // auto-generate metadata
);
```

## Architecture Details

### Agent Loop Flow

1. **OBSERVE** Phase
   - Gather current state information
   - Retrieve available tools, skills, and subagents
   - Access recent memory

2. **THINK** Phase
   - Send observation to Claude
   - Get reasoning and action plan
   - Determine next steps

3. **ACT** Phase
   - Execute planned action (tool, skill, or subagent)
   - Run pre-action hooks (guard rails)
   - Capture result
   - Run post-action hooks (logging)

4. **LEARN** Phase
   - Analyze action result
   - Extract insights
   - Update memory
   - Adjust future behavior

5. **REPEAT**
   - Continue until goal achieved or max iterations reached

### Tools System

- **Built-in Tools**: Generic file and HTTP operations
- **Custom Tools**: Application-specific functionality
- **MCP Tools**: Future integration with external services

Each tool:
- Has a clear name and description
- Defines parameters with Zod schema
- Implements execute function
- Returns structured results

### Skills System

Skills are domain expertise that can auto-invoke:

- Triggered by specific keywords or patterns
- Have access to full agent state
- Can call multiple tools
- Return structured results

Example: `lead-research` skill auto-invokes when handling a new lead.

### Subagents System

Subagents run in parallel and isolated:

- Independent task execution
- No shared state (isolated)
- Specialized expertise
- Report results back to main agent

Example: `researcher` subagent can research a topic while the main agent continues.

### Hooks System

Hooks provide guard rails and monitoring:

- **Pre-action**: Check before executing
- **Post-action**: Log after executing
- **Error**: Handle failures
- **Logging**: Track all activities
- **Guard Rails**: Prevent unsafe actions
- **Human-in-Loop**: Require approval

### Structured Output

All outputs validated with Zod schemas:

- Type safety at runtime
- Clear validation errors
- Consistent data structures
- Auto-completion in IDE

## Integration Points

### With LinksDeck App

The agent SDK can enhance LinksDeck in several ways:

1. **Smart Link Search**: Natural language link search (already implemented in UI)
2. **Auto-tagging**: Automatically suggest tags for new links
3. **Link Summarization**: Generate summaries using AI
4. **Smart Organization**: Suggest link organization strategies
5. **Duplicate Detection**: Find and merge duplicate links

### Future Enhancements

1. **MCP Integration**: Connect to external services (Zapier, databases, etc.)
2. **Voice Interface**: Voice-controlled link management
3. **Chrome Extension**: Save links with AI assistance
4. **Email Integration**: Extract links from emails automatically
5. **Team Collaboration**: Share and collaborate on link collections

## Testing

The implementation includes:
- Type safety with TypeScript
- Runtime validation with Zod
- Comprehensive logging
- Error handling

To test:
```bash
# Run the example
pnpm agent:example

# Build TypeScript
pnpm agent:build
```

## Performance Considerations

1. **Iteration Limits**: Max iterations prevent infinite loops
2. **Rate Limiting**: Prevents API abuse
3. **Caching**: Memory system reduces redundant API calls
4. **Parallel Execution**: Subagents run independently
5. **Streaming**: Future support for real-time responses

## Security & Privacy

1. **Content Safety**: Filters inappropriate content
2. **Data Privacy**: Redacts sensitive information
3. **Rate Limiting**: Prevents abuse
4. **Human Approval**: Critical actions require confirmation
5. **Audit Trail**: Complete logging of all actions

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   ```

2. **TypeScript Errors**
   ```bash
   pnpm agent:build
   ```

3. **Module Not Found**
   ```bash
   pnpm install
   ```

## Next Steps

1. **Deploy Backend**: Set up server to run agent SDK
2. **API Endpoints**: Create REST API for React Native app
3. **Real-time Updates**: Implement WebSocket for live updates
4. **User Interface**: Add agent status to mobile app
5. **Analytics**: Track agent performance and usage

## Resources

- [Claude API Documentation](https://docs.anthropic.com/)
- [Zod Documentation](https://zod.dev/)
- [Agent SDK README](./agent-sdk/README.md)

## Support

For questions or issues with the Agent SDK:
1. Check the README in `agent-sdk/README.md`
2. Review the example in `agent-sdk/examples/lead-handling.ts`
3. Check the integration service in `agent-sdk/integration/react-native-service.ts`

---

**Implementation Status**: ✅ Complete

All core components have been implemented and are ready for integration with the LinksDeck application.
