import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { conversationManager } from '@/services/chat/conversationManager';
import { schemeDataService } from '@/services/schemes/schemeDataService';

// Edge runtime for streaming
export const runtime = 'edge';

// Configure OpenRouter using OpenAI provider
// OpenRouter's API is fully compatible with OpenAI's Chat Completions format
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
});

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract text content from various message formats
 * Handles AI SDK v5 formats, parts array, content array, and plain text
 */
function extractMessageContent(message: any): string {
  if (!message) return '';

  // Format 1: Direct string content
  if (typeof message.content === 'string') {
    return message.content;
  }

  // Format 2: Text field (fallback)
  if (typeof message.text === 'string') {
    return message.text;
  }

  // Format 3: AI SDK v5 parts array format (useChat sends this)
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p && (p.type === 'text' || p.text))
      .map((p: any) => p.text || '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // Format 4: Content array format (AI SDK response format)
  if (message.content && Array.isArray(message.content)) {
    return message.content
      .filter((c: any) => c && (c.type === 'text' || c.type === 'output_text' || c.type === 'input_text'))
      .map((c: any) => c.text || c.content || '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return '';
}

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
      const lastMessage = messages.length > 0 ? extractMessageContent(messages[messages.length - 1]) : '';
      return handleFallbackResponse(lastMessage, sessionId);
    }

    // Get the last user message using utility function
    const lastMsg = messages[messages.length - 1];
    const lastUserMessage = extractMessageContent(lastMsg);

    // Process chat with context from our data layer
    const { systemPrompt, context, session } = await conversationManager.processChat({
      message: lastUserMessage,
      sessionId,
      language,
      userProfile
    });

    // Convert messages to core format for AI SDK v5
    // Filter out any invalid messages and ensure proper string content format
    const validMessages = messages
      .filter((m: any) => {
        // Skip the welcome message from the client
        if (m.id === 'welcome' && m.role === 'assistant') {
          return false;
        }
        return m && (m.role === 'user' || m.role === 'assistant');
      })
      .map((m: any) => {
        // Extract text content using utility function
        const content = extractMessageContent(m);

        return {
          role: m.role as 'user' | 'assistant',
          content: content || 'Hello'  // Fallback if content extraction fails
        };
      })
      .filter((m: any) => m.content && m.content.trim().length > 0);

    // Log processed messages for debugging
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
      console.log('Processed messages for OpenRouter:', JSON.stringify(validMessages, null, 2));
    }

    // Validate that all messages have string content
    for (const msg of validMessages) {
      if (typeof msg.content !== 'string') {
        console.error('Invalid message format detected:', msg);
        throw new Error('All messages must have string content');
      }
    }

    // Use AI SDK v5 streamText with system parameter
    // Using OpenAI provider with OpenRouter's baseURL for better compatibility
    const result = streamText({
      model: openrouter(model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'),
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
        'X-Model-Used': model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    // Log additional error details for debugging
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }

    // Determine appropriate error message and status
    let errorMessage = 'Failed to process chat request';
    let statusCode = 500;

    if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.message?.includes('API key')) {
      errorMessage = 'API configuration error. Please contact support.';
      statusCode = 503;
    } else if (error.message?.includes('Invalid message')) {
      errorMessage = 'Invalid message format. Please try rephrasing your question.';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: errorMessage,
        fallback: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: error.status || statusCode,
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