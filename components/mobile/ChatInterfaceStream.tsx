"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineModeMessage } from "@/components/ui/network-status";
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SchemeCard } from "@/components/chat/SchemeCard";
import { useConversationStoreDb } from "@/hooks/useConversationStoreDb";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import { useConversationTransition } from "@/hooks/useConversationTransition";
import { announceToScreenReader } from "@/lib/utils";
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
  AlertCircle,
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
  const { isOfflineMode } = useOfflineMode();
  const isHindi = language === "hi";

  // Use database-backed conversation store
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
  } = useConversationStoreDb({
    language,
    userProfile,
    onConversationChange,
  });

  // Helper to extract text from AI SDK v5 message parts - memoized to prevent re-creation
  const getMessageText = React.useCallback((message: any): string => {
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
  }, []);

  // Track if we're in the middle of creating a new conversation
  const isCreatingNewRef = useRef(false);
  const lastProcessedTriggerRef = useRef(0);

  // Conversation transition hook for smooth switching
  const {
    transitionState,
    targetConversationId,
    error: transitionError,
    switchConversation: transitionSwitchConversation,
    retry: retryTransition,
  } = useConversationTransition({
    minLoadingTime: 100,
    transitionDelay: 200,
    onTransitionStart: () => {
      announceToScreenReader(
        isHindi ? 'बातचीत लोड हो रही है' : 'Loading conversation',
        'polite'
      );
    },
    onTransitionComplete: () => {
      announceToScreenReader(
        isHindi ? 'बातचीत लोड हो गई' : 'Conversation loaded',
        'polite'
      );
    },
  });

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

  // Smart auto-scroll with user scroll detection
  const { scrollAreaRef, messagesEndRef } = useSmartScroll(messages);

  // Handle new chat trigger from parent component
  useEffect(() => {
    // Only process if trigger value changed and we're not already creating
    if (
      newChatTrigger > 0 &&
      newChatTrigger !== lastProcessedTriggerRef.current &&
      !isCreatingNewRef.current
    ) {
      console.log('[ChatInterfaceStream] New chat trigger detected:', newChatTrigger);
      lastProcessedTriggerRef.current = newChatTrigger;
      isCreatingNewRef.current = true;
      
      createNewConversation().then((conversationId) => {
        console.log('[ChatInterfaceStream] New conversation created:', conversationId);
        // The onConversationChange callback will be called by createNewConversation
        // which will update the parent's currentChatId and close the sidebar
      }).finally(() => {
        isCreatingNewRef.current = false;
      });
    }
  }, [newChatTrigger, createNewConversation]);

  // Track the last selected chat ID to prevent duplicate switches
  const lastSelectedChatIdRef = useRef<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  // Update ref when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      currentConversationIdRef.current = conversation.id;
      lastSelectedChatIdRef.current = conversation.id;
    }
  }, [conversation?.id]);

  // Handle conversation selection from sidebar with smooth transition
  useEffect(() => {
    // Don't switch if we're creating a new conversation
    // Don't switch if the selected chat is already active (check both state and ref)
    // Don't switch if already transitioning
    // Don't switch if we already processed this selection
    if (
      selectedChatId &&
      selectedChatId !== conversation?.id &&
      selectedChatId !== currentConversationIdRef.current &&
      selectedChatId !== lastSelectedChatIdRef.current &&
      !isCreatingNewRef.current &&
      transitionState === 'idle'
    ) {
      console.log('[ChatInterfaceStream] Switching to conversation:', selectedChatId);
      lastSelectedChatIdRef.current = selectedChatId;
      
      // Use transition hook for smooth switching
      transitionSwitchConversation(selectedChatId, async () => {
        await switchConversation(selectedChatId);
        console.log('[ChatInterfaceStream] Conversation switched successfully');
        
        // Reset scroll position to bottom after switching
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          }
        }, 50);
      });
    }
  }, [selectedChatId, conversation?.id, switchConversation, transitionState, transitionSwitchConversation, messagesEndRef]);

  // Ref for textarea to manage focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content - debounced to prevent jitter
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Use requestAnimationFrame to batch DOM updates
    const resizeHandle = requestAnimationFrame(() => {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height with max of 120px
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    });

    return () => cancelAnimationFrame(resizeHandle);
  }, [input]);

  // Handle submit with offline mode support
  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    // If offline, show warning but still try to send
    if (isOfflineMode) {
      toast.info('You appear to be offline. Message may not send.');
    }

    // Announce to screen readers
    announceToScreenReader(
      isHindi ? 'संदेश भेजा जा रहा है' : 'Sending message',
      'polite'
    );

    // Send via conversation store (handles persistence)
    sendMessage(input);

    // Keep focus on textarea for next message
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [input, isOfflineMode, sendMessage, isHindi, isLoading]);

  // Handle Enter key for sending messages
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift: Submit message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit();
      }
    }
    // Shift+Enter: New line (default textarea behavior)
  }, [input, handleSubmit]);

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
    <div className="flex flex-col h-full bg-background relative">
      {/* Loading Overlay - shown during conversation transitions */}
      {(transitionState === 'loading' || transitionState === 'transitioning') && (
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          role="status"
          aria-live="polite"
          aria-label={isHindi ? 'बातचीत लोड हो रही है' : 'Loading conversation'}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {isHindi ? 'बातचीत लोड हो रही है...' : 'Loading conversation...'}
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay - shown when transition fails */}
      {transitionState === 'error' && transitionError && (
        <div 
          className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50"
          role="alert"
          aria-live="assertive"
        >
          <Card className="max-w-md mx-4 border-destructive/20">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-destructive">
                    {isHindi ? 'बातचीत लोड नहीं हो सकी' : 'Failed to load conversation'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {transitionError.message || (isHindi ? 'कुछ गलत हो गया' : 'Something went wrong')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={retryTransition}
                  className="flex-1"
                  aria-label={isHindi ? 'पुनः प्रयास करें' : 'Retry loading conversation'}
                >
                  {isHindi ? 'पुनः प्रयास करें' : 'Retry'}
                </Button>
                <Button
                  onClick={() => {
                    // Reset transition state and stay on current conversation
                    window.location.reload();
                  }}
                  variant="outline"
                  className="flex-1"
                  aria-label={isHindi ? 'रद्द करें' : 'Cancel'}
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scrollable Messages Area - grows to fill space */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="px-4 py-4">
            {/* Offline Mode Message */}
            <OfflineModeMessage />

            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  role={message.role as "user" | "assistant"}
                  content={getMessageText(message)}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                />
              ))}

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

      {/* Quick Prompts - fixed position when visible */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 px-4 pb-4" role="region" aria-label={isHindi ? "त्वरित प्रश्न" : "Quick questions"}>
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
                aria-label={`${isHindi ? "त्वरित प्रश्न" : "Quick question"}: ${isHindi && prompt.textHi ? prompt.textHi : prompt.text}`}
                tabIndex={0}
              >
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5" aria-hidden="true">{prompt.icon}</span>
                  <span className="text-xs line-clamp-2">
                    {isHindi && prompt.textHi ? prompt.textHi : prompt.text}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Input Area - stays at bottom */}
      <form 
        onSubmit={handleSubmit} 
        className="flex-shrink-0 border-t bg-background p-4 safe-bottom"
        aria-label={isHindi ? "संदेश फॉर्म" : "Message form"}
      >
        <div className="flex gap-2 items-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => toast.info('File attachment coming soon!')}
            aria-label={isHindi ? "फ़ाइल संलग्न करें" : "Attach file"}
            disabled={isLoading}
            tabIndex={0}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isHindi
                  ? "अपना प्रश्न टाइप करें या बोलें... (Enter से भेजें, Shift+Enter से नई लाइन)"
                  : "Type your question or speak... (Enter to send, Shift+Enter for new line)"
              }
              className="pr-10 min-h-[48px] max-h-[120px] text-base resize-none overflow-y-auto transition-[height] duration-100"
              style={{ height: '48px' }}
              disabled={isLoading}
              aria-label={isHindi ? "संदेश इनपुट" : "Message input"}
              aria-describedby="message-hint"
              rows={1}
              tabIndex={0}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 ${
                voice.isRecording ? 'bg-red-500/10' : ''
              }`}
              onClick={voice.toggleVoiceMode}
              aria-label={
                voice.isRecording 
                  ? (isHindi ? "रिकॉर्डिंग बंद करें" : "Stop recording")
                  : (isHindi ? "रिकॉर्डिंग शुरू करें" : "Start recording")
              }
              aria-pressed={voice.isRecording}
              disabled={isLoading || voice.isTranscribing}
              tabIndex={0}
            >
              {voice.isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : voice.isRecording ? (
                <Square className="w-3 h-3 text-red-500" aria-hidden="true" />
              ) : (
                <Mic className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
            {/* Voice recording indicator */}
            {voice.isRecording && (
              <div 
                className="absolute -top-8 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse"
                role="status"
                aria-live="polite"
              >
                {isHindi ? `रिकॉर्डिंग ${voice.duration}` : `Recording ${voice.duration}`}
              </div>
            )}
          </div>

          {isLoading ? (
            <Button
              type="button"
              onClick={() => {
                stop();
                announceToScreenReader(
                  isHindi ? 'संदेश रोका गया' : 'Message stopped',
                  'polite'
                );
              }}
              className="flex-shrink-0 btn-touch px-4"
              variant="destructive"
              aria-label={isHindi ? "संदेश रोकें" : "Stop message"}
              tabIndex={0}
            >
              {isHindi ? "रोकें" : "Stop"}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 btn-touch px-4"
              aria-label={isHindi ? "संदेश भेजें" : "Send message"}
              aria-disabled={!input.trim() || isLoading}
              tabIndex={0}
            >
              <Send className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">
                {isHindi ? "संदेश भेजें" : "Send message"}
              </span>
            </Button>
          )}
        </div>

        {/* Language Hint */}
        <p 
          id="message-hint" 
          className="text-xs text-muted-foreground text-center mt-2"
          aria-live="polite"
        >
          <Sparkles className="w-3 h-3 inline mr-1" aria-hidden="true" />
          {isHindi
            ? "12 भाषाओं में बात करें • तत्काल सहायता"
            : "Chat in 12 languages • Instant assistance"}
        </p>
      </form>
    </div>
  );
}