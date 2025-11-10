/**
 * Deepgram Speech-to-Text Service
 * Handles audio transcription using Deepgram API
 */

import { createClient, DeepgramClient } from '@deepgram/sdk';

export interface TranscriptionOptions {
  language?: string; // 'en-IN', 'hi-IN', etc.
  model?: 'general' | 'nova-2' | 'whisper';
  smart_format?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
  detect_language?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  language?: string;
  duration?: number;
  words?: Array<{
    word: string;
    confidence: number;
    start: number;
    end: number;
  }>;
}

class DeepgramService {
  private client: DeepgramClient | null = null;
  private apiKey: string | undefined;
  private isInitialized = false;

  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    if (this.apiKey) {
      this.initialize();
    }
  }

  /**
   * Initialize Deepgram client
   */
  private initialize(): void {
    try {
      if (this.apiKey) {
        this.client = createClient(this.apiKey);
        this.isInitialized = true;
        console.log('✅ Deepgram service initialized');
      }
    } catch (error) {
      console.error('Failed to initialize Deepgram:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if service is configured
   */
  public isConfigured(): boolean {
    return this.isInitialized && !!this.client;
  }

  /**
   * Transcribe audio buffer
   */
  public async transcribeAudio(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error('Deepgram service is not configured. Please set DEEPGRAM_API_KEY.');
    }

    try {
      // Default options optimized for Indian languages
      const transcriptionOptions = {
        model: options.model || 'nova-2',
        language: options.language || 'en-IN',
        smart_format: options.smart_format !== false,
        punctuate: options.punctuate !== false,
        diarize: options.diarize || false,
        detect_language: options.detect_language || false,
        // Multi-language support for India
        ...(options.language === 'multi' && {
          detect_language: true,
          language: 'en-IN,hi-IN,ta-IN,te-IN,bn-IN,mr-IN,gu-IN,kn-IN,ml-IN,pa-IN,or-IN,as-IN'
        })
      };

      const { result } = await (this.client!.listen.prerecorded as any).transcribeBuffer(
        audioBuffer,
        transcriptionOptions
      );

      if (!result || !result.results || !result.results.channels[0]) {
        throw new Error('No transcription results received');
      }

      const channel = result.results.channels[0];
      const alternative = channel.alternatives[0];

      if (!alternative) {
        return {
          transcript: '',
          confidence: 0
        };
      }

      return {
        transcript: alternative.transcript || '',
        confidence: alternative.confidence || 0,
        language: result.results.channels[0].detected_language || options.language,
        duration: result.metadata?.duration || 0,
        words: alternative.words?.map((word: any) => ({
          word: word.word || '',
          confidence: word.confidence || 0,
          start: word.start || 0,
          end: word.end || 0
        }))
      };
    } catch (error: any) {
      console.error('Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Transcribe audio from base64 string
   */
  public async transcribeBase64(
    base64Audio: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    // Remove data URL prefix if present
    const base64Data = base64Audio.replace(/^data:audio\/[a-z]+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');
    return this.transcribeAudio(audioBuffer, options);
  }

  /**
   * Transcribe audio from URL
   */
  public async transcribeUrl(
    audioUrl: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error('Deepgram service is not configured');
    }

    try {
      const transcriptionOptions = {
        model: options.model || 'nova-2',
        language: options.language || 'en-IN',
        smart_format: options.smart_format !== false,
        punctuate: options.punctuate !== false,
      };

      const { result } = await this.client!.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        transcriptionOptions
      );

      const channel = result!.results.channels[0];
      const alternative = channel.alternatives[0];

      return {
        transcript: alternative.transcript || '',
        confidence: alternative.confidence || 0,
        language: channel.detected_language || options.language
      };
    } catch (error: any) {
      console.error('URL transcription error:', error);
      throw new Error(`Failed to transcribe from URL: ${error.message}`);
    }
  }

  /**
   * Get supported languages for India
   */
  public getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en-IN', name: 'English (India)', nativeName: 'English' },
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
      { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া' }
    ];
  }

  /**
   * Estimate transcription cost (for monitoring)
   */
  public estimateCost(durationSeconds: number, model: string = 'nova-2'): number {
    // Deepgram pricing per minute (approximate)
    const pricing: Record<string, number> = {
      'nova-2': 0.0043,
      'general': 0.0125,
      'whisper': 0.0048
    };

    const pricePerMinute = pricing[model] || pricing['nova-2'];
    return (durationSeconds / 60) * pricePerMinute;
  }
}

// Export singleton instance
export const deepgramService = new DeepgramService();