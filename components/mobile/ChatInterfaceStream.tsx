"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineModeMessage } from "@/components/ui/network-status";
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SchemeCard } from "@/components/chat/SchemeCard";
import { useConversationStore } from "@/hooks/useConversationStore";
import {
  Send,
  Mic,
  Sparkles,
  Paperclip,
  Loader2,
  Square,
  HelpCircle,
  IndianRupee,
  FileText,
  TrendingUp,
} from "lucide-react";
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

export interface ChatInterfaceStreamProps {
  language?: string;
  userProfile?: any;
  onConversationChange?: (conversationId: string | null) => void;
  newChatTrigger?: number;
  selectedChatId?: string | null;
}

export function ChatInterfaceStream({
  language = "en",
  userProfile = {},
  onConversationChange,
  newChatTrigger = 0,
  selectedChatId,
}: ChatInterfaceStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isOfflineMode } = useOfflineMode();
  const isHindi = language === "hi";

  // Use conversation store instead of direct useChat
  const store = useConversationStore({
    language,
    userProfile,
    onConversationChange,
  });

  const {
    conversation,
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    stop,
    createNewConversation,
    switchConversation,
    messageCount,
    limitWarning,
  } = store;

  // Helper to extract text from AI SDK v5 message parts
  const getMessageText = (message: any): string => {
    // Direct string content (most common)
    if (typeof message.content === 'string' && message.content) {
      return message.content;
    }

    // Text field (fallback)
    if (typeof message.text === 'string' && message.text) {
      return message.text;
    }

    // Parts array (AI SDK v5 format)
    if (message.parts && Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part: any) => part && (part.type === 'text' || part.text))
        .map((part: any) => part.text || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    // Content array format
    if (message.content && Array.isArray(message.content)) {
      const text = message.content
        .filter((c: any) => c && (c.type === 'text' || c.type === 'output_text' || c.type === 'input_text'))
        .map((c: any) => c.text || c.content || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    console.warn('Unable to extract text from message:', message);
    return '';
  };

  // Track if we're in the middle of creating a new conversation
  const isCreatingNewRef = useRef(false);
  const lastProcessedTriggerRef = useRef(0);

  // Handle new chat trigger from parent component
  useEffect(() => {
    // Only process if trigger value changed and we're not already creating
    if (
      newChatTrigger > 0 &&
      newChatTrigger !== lastProcessedTriggerRef.current &&
      !isCreatingNewRef.current
    ) {
      lastProcessedTriggerRef.current = newChatTrigger;
      isCreatingNewRef.current = true;
      createNewConversation().finally(() => {
        isCreatingNewRef.current = false;
      });
    }
  }, [newChatTrigger, createNewConversation]);

  // Handle conversation selection from sidebar
  useEffect(() => {
    // Don't switch if we're creating a new conversation
    // Don't switch if the selected chat is already active
    if (
      selectedChatId &&
      selectedChatId !== conversation?.id &&
      !isCreatingNewRef.current
    ) {
      switchConversation(selectedChatId);
    }
  }, [selectedChatId, conversation?.id, switchConversation]);

  // Voice recording hook
  const voice = useChatVoiceInput((transcript) => {
    setInput(transcript);
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form && transcript.trim()) {
        form.requestSubmit();
      }
    }, 100);
  });

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle submit with offline mode support
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    // If offline, show warning but still try to send
    if (isOfflineMode) {
      toast.info('You appear to be offline. Message may not send.');
    }

    // Send via conversation store (handles persistence)
    sendMessage(input);
  }, [input, isOfflineMode, sendMessage]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    // Trigger form submission programmatically
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  }, [setInput]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Limit warning */}
      {limitWarning && (
        <div className="m-4 p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
          {limitWarning}
        </div>
      )}

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
      {messages.length === 0 && (
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
        </p>
      </form>
    </div>
  );
}