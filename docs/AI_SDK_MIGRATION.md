# AI SDK Version Compatibility Issue

## Problem

The project currently has **AI SDK v5.0.90** installed, but the existing code (and new EnhancedChatInterface) was written for **AI SDK v3/v4**. AI SDK v5 has breaking API changes.

## Current Status

- ✅ **ChatInterfaceStream** - Using old API (will fail in build)
- ✅ **EnhancedChatInterface** - Using old API (will fail in build)
- ❌ **Build** - Fails due to missing exports (`OpenAIStream`, `StreamingTextResponse`)

## Errors

```
Module not found: Can't resolve 'ai/react'
Export OpenAIStream doesn't exist in target module
Export StreamingTextResponse doesn't exist in target module
```

## Solution Options

### Option 1: Downgrade to AI SDK v3 (Quick Fix)

**Pros:** Immediate solution, all code works as-is
**Cons:** Not future-proof, misses new features

```bash
npm install ai@3.4.33 --legacy-peer-deps
```

**Issue:** Zod version conflict (project uses v4, SDK v3 needs v3)

### Option 2: Use AI SDK v4 (Recommended)

**Pros:** More stable, compatible with current code
**Cons:** Still not the latest

```bash
npm install ai@4.0.0 --legacy-peer-deps
```

### Option 3: Migrate to AI SDK v5 (Best Long-term)

**Pros:** Latest features, future-proof, better performance
**Cons:** Requires code changes

#### Migration Steps for v5:

1. **Update imports in components:**

**Old (v3/v4):**
```tsx
import { useChat } from 'ai/react';
```

**New (v5):**
```tsx
import { useChat } from 'ai/react'; // Same!
```

2. **Update API route (`/app/api/chat/stream/route.ts`):**

**Old (v3/v4):**
```tsx
import { OpenAIStream, StreamingTextResponse } from 'ai';

const stream = OpenAIStream(response);
return new StreamingTextResponse(stream);
```

**New (v5):**
```tsx
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-3.5-turbo'),
  messages: [...],
});

return result.toTextStreamResponse();
```

3. **Update openRouterService:**

Currently uses fetch + OpenAIStream wrapper. Needs rewrite for v5:

```tsx
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Use with streamText()
const result = await streamText({
  model: openrouter('anthropic/claude-3-haiku'),
  messages,
});
```

## Current Workaround

The original `ChatInterfaceStream` component is active. The new `EnhancedChatInterface` components are built and ready but commented out.

**To use EnhancedChatInterface:**
1. Choose a solution option above
2. Uncomment in `app/page.tsx`:
```tsx
// import { ChatInterfaceStream } from "@/components/mobile/ChatInterfaceStream";
import { EnhancedChatInterface } from "@/components/mobile/EnhancedChatInterface";

export default function Home() {
  return (
    <MobileLayout className="p-0">
      <EnhancedChatInterface language="en" />
    </MobileLayout>
  );
}
```

## Files Affected

- `/app/api/chat/stream/route.ts` - Main streaming endpoint
- `/app/api/chat/route.ts` - Standard endpoint
- `/services/ai/openRouterService.ts` - AI service layer
- `/components/mobile/ChatInterfaceStream.tsx` - Original chat
- `/components/mobile/EnhancedChatInterface.tsx` - New chat (ready)

## Recommendation

**For Production:**
Choose Option 3 (Migrate to v5) for best long-term outcome.

**For Quick Testing:**
Use the dev server with the original ChatInterfaceStream (already works).

**For Demo:**
Use Option 2 (SDK v4) with `--legacy-peer-deps` flag.

## Testing After Fix

```bash
# Test build
npm run build

# Test dev server
npm run dev

# Visit http://localhost:3000
```

## Additional Resources

- [AI SDK v5 Migration Guide](https://sdk.vercel.ai/docs/ai-sdk-core/migration)
- [AI SDK v5 Docs](https://sdk.vercel.ai/)
- [Vercel AI SDK GitHub](https://github.com/vercel/ai)

## Status

- ✅ New chat components created
- ✅ Dark mode enhanced
- ✅ Markdown support added
- ✅ Typing indicators ready
- ✅ Quick replies implemented
- ⚠️ **Needs AI SDK version resolution**
- ⏳ Waiting for SDK migration decision
