import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Edge runtime for faster responses
export const runtime = 'edge';

// Configure OpenRouter using official provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { language = 'en' } = await request.json();

    const isHindi = language === 'hi';

    // Generate a personalized welcome message
    const { text } = await generateText({
      model: openrouter.chat(process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'),
      prompt: isHindi
        ? `आप MSME Mitr AI हैं, भारतीय सूक्ष्म, लघु और मध्यम उद्यमों (MSMEs) के लिए एक AI सहायक। एक छोटा, स्वागत योग्य संदेश (2-3 वाक्य) हिंदी में लिखें जो:
1. अपना परिचय दें
2. बताएं कि आप सरकारी योजनाओं, ऋण, और व्यावसायिक मार्गदर्शन में कैसे मदद कर सकते हैं
3. उपयोगकर्ता को 12 भारतीय भाषाओं में बात करने के लिए आमंत्रित करें
स्वाभाविक, मैत्रीपूर्ण और संक्षिप्त रहें।`
        : `You are MSME Mitr AI, an AI assistant for Indian Micro, Small, and Medium Enterprises (MSMEs). Write a short, welcoming message (2-3 sentences) in English that:
1. Introduces yourself
2. Explains how you can help with government schemes, loans, and business guidance
3. Invites the user to chat in English, Hindi, or any of 12 Indian languages
Be natural, friendly, and concise.`,
      temperature: 0.8,
    });

    return Response.json({
      message: text.trim(),
      language
    });

  } catch (error: any) {
    console.error('Welcome message generation error:', error);

    // Fallback to static message if API fails
    const fallbackMessage = language === 'hi'
      ? "नमस्ते! मैं MSME Mitr AI हूं, आपका व्यावसायिक सहायक। मैं सरकारी योजनाओं, ऋण आवेदन, और व्यवसाय मार्गदर्शन में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
      : "Hello! I'm MSME Mitr AI, your business assistant. I can help you discover government schemes, assist with loan applications, and provide business guidance. How can I help you today?";

    return Response.json({
      message: fallbackMessage,
      language,
      fallback: true
    });
  }
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
