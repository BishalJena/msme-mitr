"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineModeMessage, NetworkStatusBadge } from "@/components/ui/network-status";
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SchemeCard } from "@/components/chat/SchemeCard";
import {
  Send,
  Mic,
  Sparkles,
  Paperclip,
  Bot,
  Loader2,
  Square,
  HelpCircle,
  IndianRupee,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface QuickPrompt {
  text: string;
  textHi?: string;
  icon: React.ReactNode;
  category: string;
}

const quickPrompts: QuickPrompt[] = [
  {
    text: "What schemes am I eligible for?",
    textHi: "मैं किन योजनाओं के लिए पात्र हूं?",
    icon: <HelpCircle className="w-4 h-4" />,
    category: "eligibility",
  },
  {
    text: "I need a business loan",
    textHi: "मुझे व्यावसायिक ऋण चाहिए",
    icon: <IndianRupee className="w-4 h-4" />,
    category: "loan",
  },
  {
    text: "How to apply for PMEGP scheme?",
    textHi: "PMEGP योजना के लिए आवेदन कैसे करें?",
    icon: <FileText className="w-4 h-4" />,
    category: "application",
  },
  {
    text: "Women entrepreneur schemes",
    textHi: "महिला उद्यमी योजनाएं",
    icon: <TrendingUp className="w-4 h-4" />,
    category: "women",
  },
];

// Available models from OpenRouter
const availableModels = [
  { id: 'anthropic/claude-3-haiku', name: 'Claude Haiku (Fast)', category: 'Efficient' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude Sonnet', category: 'Balanced' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', category: 'Fast' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', category: 'Open' },
];

export function ChatInterfaceStream({
  language = "en",
  userProfile = {}
}: {
  language?: string;
  userProfile?: any;
}) {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-haiku');
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isOfflineMode, getOfflineResponse, status } = useOfflineMode();
  const isHindi = language === "hi";

  // Helper to extract text from AI SDK v5 message parts
  const getMessageText = (message: any): string => {
    if (message.content) return message.content; // Fallback for old format
    if (message.parts) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    return '';
  };

  // Voice recording hook
  const voice = useChatVoiceInput((transcript) => {
    setInput(transcript);
    // Optionally auto-send after transcription
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form && transcript.trim()) {
        form.requestSubmit();
      }
    }, 100);
  });

  // AI SDK v5: Manual input management
  const [input, setInput] = useState('');

  // Use the AI SDK's useChat hook for streaming
  const {
    messages,
    status: chatStatus,
    error,
    stop,
    setMessages,
    sendMessage,
  } = useChat({
    api: '/api/chat',
    body: {
      sessionId,
      language,
      userProfile,
      model: selectedModel,
    },
  });

  // AI SDK v5 uses 'status' with values: 'ready', 'submitted', 'error'
  const isLoading = chatStatus === 'submitted';

  // Load session ID and fetch AI-generated welcome message on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      // Generate new session ID for new conversations
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }

    // Fetch AI-generated welcome message if no messages exist
    if (messages.length === 0) {
      // Check cache first (cache for 24 hours)
      const cachedWelcome = localStorage.getItem(`welcomeMessage_${language}`);
      const cacheTimestamp = localStorage.getItem(`welcomeMessageTime_${language}`);
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

      if (cachedWelcome && cacheAge < CACHE_DURATION) {
        // Use cached welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: cachedWelcome,
          },
        ]);
      } else {
        // Fetch new AI-generated welcome message
        fetch('/api/chat/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        })
          .then(res => res.json())
          .then(data => {
            const welcomeMessage = data.message;
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: welcomeMessage,
              },
            ]);

            // Cache the welcome message
            if (!data.fallback) {
              localStorage.setItem(`welcomeMessage_${language}`, welcomeMessage);
              localStorage.setItem(`welcomeMessageTime_${language}`, Date.now().toString());
            }
          })
          .catch(err => {
            console.error('Failed to fetch welcome message:', err);
            // Fallback message
            const fallbackMessage = isHindi
              ? "नमस्ते! मैं MSME Mitr AI हूं, आपका व्यावसायिक सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?"
              : "Hello! I'm MSME Mitr AI, your business assistant. How can I help you today?";

            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: fallbackMessage,
              },
            ]);
          });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle submit with offline mode support (AI SDK v5)
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    // If offline, show warning but still try to send
    if (isOfflineMode) {
      toast.info('You appear to be offline. Message may not send.');
    }

    // Always use AI SDK v5 sendMessage
    // TODO: Pass sessionId, language, userProfile, model via headers or cookies
    sendMessage({ text: input });
    setInput('');
  }, [input, isOfflineMode, messages, setMessages, getOfflineResponse, sendMessage, sessionId, language, userProfile, selectedModel]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    // Trigger form submission programmatically
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  }, [setInput]);


  // Handle model change
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    toast.success(`Switched to ${model.split('/')[1]}`);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-4">
            {/* Offline Mode Message */}
            <OfflineModeMessage />

            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role as "user" | "assistant"}
                  content={getMessageText(message)}
                  isStreaming={false}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <MessageBubble
                  role="assistant"
                  content={isHindi ? "सोच रहा हूं..." : "Thinking..."}
                  isStreaming={true}
                />
              )}

              {/* Error display */}
              {error && (
                <Card className="bg-destructive/10 border-destructive/20 p-3">
                  <p className="text-sm text-destructive">
                    {error.message || 'Something went wrong. Please try again.'}
                  </p>
                </Card>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-2">
            {isHindi ? "त्वरित प्रश्न" : "Quick questions"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto py-3 px-3 justify-start text-left"
                onClick={() =>
                  handleQuickPrompt(
                    isHindi && prompt.textHi ? prompt.textHi : prompt.text
                  )
                }
                disabled={isLoading}
              >
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">{prompt.icon}</span>
                  <span className="text-xs line-clamp-2">
                    {isHindi && prompt.textHi ? prompt.textHi : prompt.text}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t bg-background p-4 safe-bottom">
        <div className="flex gap-2 items-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => toast.info('File attachment coming soon!')}
            aria-label="Attach file"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isHindi
                  ? "अपना प्रश्न टाइप करें या बोलें..."
                  : "Type your question or speak..."
              }
              className="pr-10 min-h-[48px] text-base"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 ${
                voice.isRecording ? 'bg-red-500/10' : ''
              }`}
              onClick={voice.toggleVoiceMode}
              aria-label={voice.isRecording ? "Stop recording" : "Start recording"}
              disabled={isLoading || voice.isTranscribing}
            >
              {voice.isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : voice.isRecording ? (
                <Square className="w-3 h-3 text-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            {/* Voice recording indicator */}
            {voice.isRecording && (
              <div className="absolute -top-8 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                Recording {voice.duration}
              </div>
            )}
          </div>

          {isLoading ? (
            <Button
              type="button"
              onClick={() => stop()}
              className="flex-shrink-0 btn-touch px-4"
              variant="destructive"
            >
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 btn-touch px-4"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Language Hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          <Sparkles className="w-3 h-3 inline mr-1" />
          {isHindi
            ? "12 भाषाओं में बात करें • तत्काल सहायता"
            : "Chat in 12 languages • Instant assistance"}
          {selectedModel.includes('haiku') && (
            <span className="ml-2 text-green-600">• Fast mode</span>
          )}
        </p>
      </form>
    </div>
  );
}