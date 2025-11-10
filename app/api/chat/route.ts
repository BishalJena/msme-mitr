import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { conversationManager } from '@/services/chat/conversationManager';
import { schemeDataService } from '@/services/schemes/schemeDataService';

// Edge runtime for streaming
export const runtime = 'edge';

// Configure OpenRouter using official provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    // AI SDK v5 sends messages array directly
    const messages = body.messages || [];
    const { sessionId, language = 'en', userProfile, model } = body;

    // Validate messages array
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages must be an array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Apply rate limiting
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback to mock response if not configured
      const lastMessage = messages.length > 0 ? (messages[messages.length - 1]?.content || messages[messages.length - 1]?.text || '') : '';
      return handleFallbackResponse(lastMessage, sessionId);
    }

    // Get the last user message - handle both content and text fields
    const lastMsg = messages[messages.length - 1];
    const lastUserMessage = lastMsg?.content || lastMsg?.text || '';

    // Process chat with context from our data layer
    const { systemPrompt, context, session } = await conversationManager.processChat({
      message: lastUserMessage,
      sessionId,
      language,
      userProfile
    });

    // Convert messages to core format for AI SDK v5
    // Filter out any invalid messages and ensure proper format (exclude system messages)
    const validMessages = messages
      .filter((m: any) => {
        // Skip the welcome message from the client
        if (m.id === 'welcome' && m.role === 'assistant') {
          return false;
        }
        return m && (m.role === 'user' || m.role === 'assistant');
      })
      .map((m: any) => {
        // Extract text content from various possible formats
        let content = '';
        if (typeof m.content === 'string') {
          content = m.content;
        } else if (m.text) {
          content = m.text;
        } else if (m.parts && Array.isArray(m.parts)) {
          content = m.parts
            .filter((p: any) => p.type === 'text' || p.text)
            .map((p: any) => p.text)
            .join('');
        } else if (m.content && Array.isArray(m.content)) {
          // Handle AI SDK response format
          content = m.content
            .filter((c: any) => c.type === 'text' || c.type === 'output_text')
            .map((c: any) => c.text)
            .join('');
        }

        return {
          role: m.role,
          content: content || 'Hello'
        };
      })
      .filter((m: any) => m.content.trim().length > 0);

    // Use AI SDK v5 streamText with system parameter
    const result = streamText({
      model: openrouter.chat(model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'),
      system: systemPrompt,
      messages: validMessages,
      temperature: 0.7,
      async onFinish({ text, finishReason }) {
        // Update session with the conversation
        const mentionedSchemes = extractMentionedSchemes(text, context.relevantSchemes);

        conversationManager.updateSession(
          session.id,
          lastUserMessage,
          text,
          mentionedSchemes
        );

        // Log token usage and cost estimation
        if (process.env.ENABLE_DEBUG_LOGS === 'true') {
          console.log(`Session: ${session.id}, Finish reason: ${finishReason}`);
        }
      }
    });

    // Return streaming response with custom headers in UI message format
    return result.toUIMessageStreamResponse({
      headers: {
        'X-Session-Id': session.id,
        'X-Model-Used': model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process chat request',
        fallback: true
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Extract mentioned schemes from AI response
 */
function extractMentionedSchemes(text: string, relevantSchemes: any[]): any[] {
  const mentioned: any[] = [];

  for (const scheme of relevantSchemes) {
    const schemeName = scheme.scheme_name?.toLowerCase() || '';
    const textLower = text.toLowerCase();

    if (textLower.includes(schemeName)) {
      mentioned.push(scheme);
    }
  }

  return mentioned;
}

/**
 * Rate limiting check
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const maxRequestsPerMinute = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '20');

  const clientData = rateLimitStore.get(clientId);

  if (!clientData || clientData.resetAt < now) {
    // Create new rate limit window
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + 60000 // 1 minute window
    });
    return true;
  }

  if (clientData.count >= maxRequestsPerMinute) {
    return false;
  }

  // Increment count
  clientData.count++;
  return true;
}

/**
 * Handle fallback response when OpenRouter is not configured
 */
async function handleFallbackResponse(message: string, sessionId?: string) {
  const schemes = schemeDataService.getAllSchemes();

  // Generate simple fallback response
  const fallbackResponse = `I apologize, but the AI service is not currently configured. However, I can tell you that we have ${schemes.length} government schemes available. To enable full AI capabilities, please configure your OPENROUTER_API_KEY environment variable.`;

  // Create a simple data stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = fallbackResponse.split(' ');
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk + ' ')}\n`));
        await new Promise(resolve => setTimeout(resolve, 30)); // Simulate streaming
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Session-Id': sessionId || 'fallback',
      'X-Fallback-Mode': 'true',
      'Cache-Control': 'no-cache',
    }
  });
}

/**
 * OPTIONS request for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}