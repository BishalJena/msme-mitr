/**
 * Voice Recording Hook
 * Handles browser audio recording and Deepgram transcription
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isTranscribing: boolean;
  error: string | null;
  transcript: string | null;
  confidence: number | null;
  detectedLanguage: string | null;
}

export interface VoiceRecordingOptions {
  language?: string;
  detectLanguage?: boolean;
  maxDuration?: number; // seconds
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  audioFormat?: 'webm' | 'wav';
}

export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const {
    language = 'en-IN',
    detectLanguage = false,
    maxDuration = 60,
    onTranscript,
    onError,
    audioFormat = 'webm'
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isTranscribing: false,
    error: null,
    transcript: null,
    confidence: null,
    detectedLanguage: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support
  const checkBrowserSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = 'Your browser does not support audio recording';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return false;
    }
    return true;
  }, [onError]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      let errorMessage = 'Microphone access denied';

      if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please enable it in browser settings.';
      }

      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!checkBrowserSupport()) return;

    // Reset state
    setState(prev => ({
      ...prev,
      isRecording: false,
      isTranscribing: false,
      error: null,
      transcript: null,
      confidence: null,
      duration: 0
    }));

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Determine MIME type
      const mimeType = audioFormat === 'wav'
        ? 'audio/wav'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Transcribe if there's audio
        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event: any) => {
        const error = 'Recording error: ' + event.error;
        setState(prev => ({ ...prev, error, isRecording: false }));
        onError?.(error);
        toast.error(error);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();

      // Update duration
      durationIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration }));

        // Auto-stop at max duration
        if (duration >= maxDuration) {
          stopRecording();
          toast.info(`Recording stopped (max ${maxDuration}s reached)`);
        }
      }, 100);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null
      }));

      toast.success('Recording started');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [checkBrowserSupport, audioFormat, maxDuration, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false, isPaused: false }));
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      toast.info('Recording paused');
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      toast.info('Recording resumed');
    }
  }, []);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    stopRecording();
    audioChunksRef.current = [];
    setState(prev => ({
      ...prev,
      duration: 0,
      transcript: null,
      confidence: null
    }));
    toast.info('Recording cancelled');
  }, [stopRecording]);

  // Transcribe audio
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState(prev => ({ ...prev, isTranscribing: true }));

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const base64Audio = await base64Promise;

      // Send to API
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: base64Audio,
          language,
          detectLanguage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Transcription failed');
      }

      setState(prev => ({
        ...prev,
        isTranscribing: false,
        transcript: result.transcript,
        confidence: result.confidence,
        detectedLanguage: result.language,
        error: null
      }));

      // Call callback with transcript
      if (result.transcript && onTranscript) {
        onTranscript(result.transcript);
      }

      // Show confidence warning if low
      if (result.confidence < 0.7) {
        toast.warning('Low confidence transcription. Please speak clearly.');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to transcribe audio';
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [language, detectLanguage, onTranscript, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Format duration for display
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    ...state,
    formattedDuration: formatDuration(state.duration),

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    requestPermission,

    // Capabilities
    isSupported: typeof window !== 'undefined' &&
                 !!navigator.mediaDevices?.getUserMedia &&
                 !!window.MediaRecorder
  };
}

/**
 * Hook for managing voice input in chat interface
 */
export function useChatVoiceInput(onTranscript: (text: string) => void) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const voice = useVoiceRecording({
    onTranscript: (transcript) => {
      onTranscript(transcript);
      setIsVoiceMode(false);
    },
    onError: (error) => {
      console.error('Voice error:', error);
      setIsVoiceMode(false);
    },
    maxDuration: 30,
    detectLanguage: true
  });

  const toggleVoiceMode = useCallback(async () => {
    if (!voice.isSupported) {
      toast.error('Voice recording is not supported in your browser');
      return;
    }

    if (!isVoiceMode) {
      // Start recording
      if (!permissionGranted) {
        const granted = await voice.requestPermission();
        setPermissionGranted(granted);
        if (!granted) return;
      }

      await voice.startRecording();
      setIsVoiceMode(true);
    } else {
      // Stop recording
      voice.stopRecording();
      setIsVoiceMode(false);
    }
  }, [isVoiceMode, permissionGranted, voice]);

  return {
    isVoiceMode,
    isRecording: voice.isRecording,
    isTranscribing: voice.isTranscribing,
    duration: voice.formattedDuration,
    toggleVoiceMode,
    cancelRecording: () => {
      voice.cancelRecording();
      setIsVoiceMode(false);
    }
  };
}