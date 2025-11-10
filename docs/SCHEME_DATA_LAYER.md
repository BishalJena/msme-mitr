# MSME Mitr - Scheme Data Layer Documentation

## Overview

The Scheme Data Layer provides optimized context from `schemes.json` to the AI chatbot, enabling intelligent, contextual responses about government schemes for MSMEs.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                        │
│                   (Chat Component)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Chat API Route                         │
│                 (/api/chat/route.ts)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Conversation Manager                         │
│         (services/chat/conversationManager.ts)           │
├───────────────────────────────────────────────────────────┤
│ • Session Management                                      │
│ • User Profile Tracking                                   │
│ • Conversation History                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                LLM Context Builder                        │
│           (services/ai/contextBuilder.ts)                │
├───────────────────────────────────────────────────────────┤
│ • Token Optimization                                      │
│ • Context Formatting (JSON/Markdown/Minimal)             │
│ • Relevance Scoring                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Scheme Data Service                          │
│       (services/schemes/schemeDataService.ts)            │
├───────────────────────────────────────────────────────────┤
│ • Data Processing & Caching                              │
│ • Information Extraction                                  │
│ • Financial Details Parsing                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   schemes.json                           │
│              (11 Government Schemes)                      │
└──────────────────────────────────────────────────────────┘
```

## Key Components

### 1. TypeScript Types (`types/scheme.ts`)
- **ProcessedScheme**: Optimized scheme structure for LLM consumption
- **ConversationContext**: Context passed to LLM with user profile and history
- **UserProfile**: User business information for personalization
- **ContextFormat**: Different formatting options (JSON, Markdown, Minimal)

### 2. Scheme Data Service
- Loads and processes raw scheme data from `schemes.json`
- Extracts structured information:
  - Key benefits (bullet points)
  - Eligibility criteria
  - Financial details (loan amounts, subsidies)
  - Target audience
  - Application steps
- Generates minimal and detailed context versions
- Provides ~50-600 tokens per scheme depending on format

### 3. Context Builder
- Optimizes scheme selection based on:
  - User query intent
  - User profile
  - Conversation history
  - Token budget
- Formats context in multiple ways:
  - **Minimal**: ~50 tokens/scheme (name + key fact)
  - **Compact**: ~150 tokens/scheme (key details)
  - **Standard**: ~300 tokens/scheme (main info)
  - **Detailed**: ~600 tokens/scheme (comprehensive)

### 4. Conversation Manager
- Maintains session state
- Tracks conversation history
- Updates user profile from conversation
- Generates follow-up questions
- Provides scheme recommendations

## Token Optimization Strategies

### 1. Dynamic Context Selection
```typescript
// Only includes relevant schemes based on query
const context = llmContextBuilder.buildConversationContext({
  userQuery: "loan for women entrepreneurs",
  maxTokens: 2500,  // Budget allocation
  includeAllSchemes: false  // Smart filtering
});
```

### 2. Progressive Detail Loading
- Start with minimal context for all schemes
- Add details for specifically requested schemes
- Use conversation history to track mentioned schemes

### 3. Format Optimization
```typescript
// JSON format (most efficient for structured data)
{
  "id": "pmegp",
  "name": "PMEGP",
  "category": "subsidy",
  "maxLoan": 5000000,
  "subsidy": {"urban": 15, "rural": 25}
}

// Minimal format (maximum compression)
"PMEGP (subsidy): Up to ₹50L loan with 15-25% subsidy"
```

## Usage Examples

### Basic Chat Request
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "I need a loan for my business",
    sessionId: "session_123",
    language: "en"
  })
});
```

### With User Profile
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "What schemes am I eligible for?",
    userProfile: {
      businessType: "manufacturing",
      location: { state: "Karnataka", isRural: true },
      category: "women",
      businessStage: "new"
    }
  })
});
```

## LLM Integration

### System Prompt Structure
The system provides a structured prompt to the LLM:

```
You are an AI assistant specializing in Indian MSME government schemes.
You have access to [X] relevant schemes out of 11 total schemes.

User Profile: Business: manufacturing | Stage: new | Location: Karnataka (Rural)

## Available Schemes Context:
[Optimized scheme data based on query and profile]

## Your Role:
1. Provide accurate information about government schemes
2. Help users understand eligibility and benefits
...
```

### Connecting to LLM Providers

#### OpenAI Integration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In your API route
const { systemPrompt, context } = await conversationManager.processChat(request);

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: request.message }
  ],
  temperature: 0.7,
  max_tokens: 500
});
```

#### Anthropic Claude Integration
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  system: systemPrompt,
  messages: [{ role: "user", content: request.message }],
  max_tokens: 500
});
```

## Performance Metrics

- **Schemes Loaded**: 11 government schemes
- **Processing Time**: <100ms for context generation
- **Token Efficiency**:
  - Minimal: ~550 tokens for all schemes
  - Standard: ~3,300 tokens for all schemes
  - Smart Selection: ~500-1,500 tokens per request
- **Cache TTL**: 1 hour (configurable)
- **Session Timeout**: 30 minutes

## Customization

### Adding New Schemes
1. Update `data/schemes.json` with new scheme data
2. The system automatically processes and indexes new schemes
3. No code changes required

### Adjusting Token Limits
```typescript
// In contextBuilder.ts
private readonly TOKEN_LIMITS = {
  MINIMAL: 1000,     // Adjust based on your LLM
  STANDARD: 2500,
  DETAILED: 5000,
  MAXIMUM: 8000
};
```

### Custom Filtering Rules
```typescript
// In schemeUtils.ts
export function customFilter(schemes: ProcessedScheme[]): ProcessedScheme[] {
  return schemes.filter(scheme => {
    // Your custom logic
    return scheme.targetAudience.includes('Your Criteria');
  });
}
```

## Testing

### Run the Demo
```typescript
import { testSchemeDataLayer } from '@/lib/demo/schemeContextDemo';

// Run comprehensive test
const result = await testSchemeDataLayer();
console.log(result);
```

### Check Token Usage
```typescript
const schemes = schemeDataService.getAllSchemes();
const tokens = schemeDataService.getTokenEstimate(schemes, 'minimal');
console.log(`Total tokens: ${tokens}`);
```

## Best Practices

1. **Always provide user context** when available for better personalization
2. **Use conversation history** to maintain context across messages
3. **Monitor token usage** to optimize costs
4. **Cache sessions** to reduce processing overhead
5. **Update scheme data** regularly from government sources

## Troubleshooting

### High Token Usage
- Reduce `maxTokens` parameter
- Use `minimal` format for initial queries
- Implement scheme pagination

### Slow Response Times
- Check cache expiration
- Reduce number of schemes in context
- Use background processing for data updates

### Inaccurate Recommendations
- Verify user profile data
- Check scheme categorization
- Review relevance scoring weights

## Future Enhancements

1. **Vector Embeddings**: Use embeddings for semantic search
2. **Multi-language Support**: Translate scheme data
3. **Real-time Updates**: Connect to government APIs
4. **Analytics Dashboard**: Track popular schemes and queries
5. **A/B Testing**: Optimize context formats

## Support

For issues or questions about the data layer:
1. Check the demo script: `lib/demo/schemeContextDemo.ts`
2. Review type definitions: `types/scheme.ts`
3. Test with mock data in development mode

---

*Built for MSME Mitr - Empowering Indian Entrepreneurs with AI*