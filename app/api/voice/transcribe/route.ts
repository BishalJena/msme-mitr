import { NextRequest, NextResponse } from 'next/server';
import { deepgramService } from '@/services/voice/deepgramService';

// Maximum audio file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check if Deepgram is configured
    if (!deepgramService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Voice transcription is not configured',
          fallback: true,
          message: 'Please type your message instead'
        },
        { status: 503 }
      );
    }

    // Parse the request
    const contentType = request.headers.get('content-type') || '';

    let audioData: Buffer;
    let language = 'en-IN';
    let detectLanguage = false;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      language = (formData.get('language') as string) || 'en-IN';
      detectLanguage = formData.get('detectLanguage') === 'true';

      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }

      if (audioFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Audio file too large (max 10MB)' },
          { status: 413 }
        );
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      audioData = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      // Handle base64 audio
      const body = await request.json();
      const { audio, language: lang, detectLanguage: detect } = body;

      if (!audio) {
        return NextResponse.json(
          { error: 'No audio data provided' },
          { status: 400 }
        );
      }

      language = lang || 'en-IN';
      detectLanguage = detect || false;

      // Remove data URL prefix if present
      const base64Data = audio.replace(/^data:audio\/[a-z]+;base64,/, '');
      audioData = Buffer.from(base64Data, 'base64');

      if (audioData.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Audio data too large (max 10MB)' },
          { status: 413 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 415 }
      );
    }

    // Transcribe the audio
    const result = await deepgramService.transcribeAudio(audioData, {
      language: detectLanguage ? 'multi' : language,
      detect_language: detectLanguage,
      model: 'nova-2',
      smart_format: true,
      punctuate: true
    });

    // Log for monitoring (in production, use proper logging service)
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
      console.log('Transcription completed:', {
        confidence: result.confidence,
        language: result.language,
        duration: result.duration,
        textLength: result.transcript.length
      });
    }

    // Return the transcription
    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
      // Include word-level data if confidence is low
      ...(result.confidence < 0.8 && result.words && {
        words: result.words.slice(0, 10) // First 10 words for debugging
      })
    });

  } catch (error: any) {
    console.error('Transcription API error:', error);

    // Check for specific error types
    if (error.message?.includes('not configured')) {
      return NextResponse.json(
        {
          error: 'Voice service temporarily unavailable',
          fallback: true
        },
        { status: 503 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to transcribe audio',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
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