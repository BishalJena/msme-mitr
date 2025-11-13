"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useConversationStoreDb } from "@/hooks/useConversationStoreDb";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";
import { toast } from "sonner";
import {
  Send,
  Mic,
  Paperclip,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  FileText,
  HelpCircle,
  TrendingUp,
  IndianRupee,
  Loader2,
  Square,
} from "lucide-react";

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

export function ChatInterface({ 
  language = "en",
  userProfile = {},
  onConversationChange,
}: { 
  language?: string;
  userProfile?: any;
  onConversationChange?: (conversationId: string | null) => void;
}) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isOfflineMode } = useOfflineMode();
  const isHindi = language === "hi";

  // Use database-backed conversation store
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    stop,
  } = useConversationStoreDb({
    language,
    userProfile,
    onConversationChange,
  });

  // Voice recording hook
  const voice = useChatVoiceInput((transcript) => {
    setInput(transcript);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  });

  // Helper to extract text from AI SDK v5 message parts
  const getMessageText = (message: any): string => {
    if (typeof message.content === 'string' && message.content) {
      return message.content;
    }
    if (typeof message.text === 'string' && message.text) {
      return message.text;
    }
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part && (part.type === 'text' || part.text))
        .map((part: any) => part.text || '')
        .filter(Boolean)
        .join('');
    }
    return '';
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;

    // If offline, show warning but still try to send
    if (isOfflineMode) {
      toast.info(isHindi ? 'आप ऑफ़लाइन हैं' : 'You appear to be offline');
    }

    // Send via conversation store (handles persistence)
    sendMessage(input);
  }, [input, isOfflineMode, sendMessage, isHindi]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      handleSendMessage();
    }, 0);
  }, [setInput, handleSendMessage]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Messages Area */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 px-4 py-4"
      >
        <div className="space-y-4">
          {messages.map((message) => {
            const content = getMessageText(message);
            const isBot = message.role === 'assistant';
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isBot ? "justify-start" : "justify-end"
                }`}
              >
                {isBot && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[85%] ${
                    isBot ? "order-2" : "order-1"
                  }`}
                >
                  <Card
                    className={`p-3 ${
                      isBot
                        ? "bg-muted border-muted"
                        : "bg-primary text-primary-foreground border-primary"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {content}
                    </p>
                  </Card>
                </div>

                {!isBot && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted border-muted p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </Card>
            </div>
          )}

          {/* Error display */}
          {error && (
            <Card className="bg-destructive/10 border-destructive/20 p-3">
              <p className="text-sm text-destructive">
                {error.message || (isHindi ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.')}
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length === 0 && !isLoading && (
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
      <div className="border-t bg-background p-4 safe-bottom">
        <div className="flex gap-2 items-end">
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => toast.info(isHindi ? 'फ़ाइल अटैच करना जल्द आ रहा है!' : 'File attachment coming soon!')}
            aria-label={isHindi ? 'फ़ाइल संलग्न करें' : 'Attach file'}
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder={
                isHindi
                  ? "अपना प्रश्न टाइप करें या बोलें..."
                  : "Type your question or speak..."
              }
              className="pr-10 min-h-[48px] text-base"
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 ${
                voice.isRecording ? 'bg-red-500/10' : ''
              }`}
              onClick={voice.toggleVoiceMode}
              aria-label={voice.isRecording ? (isHindi ? "रिकॉर्डिंग बंद करें" : "Stop recording") : (isHindi ? "रिकॉर्डिंग शुरू करें" : "Start recording")}
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
                {isHindi ? 'रिकॉर्ड कर रहे हैं' : 'Recording'} {voice.duration}
              </div>
            )}
          </div>

          {isLoading ? (
            <Button
              onClick={() => stop()}
              className="flex-shrink-0 btn-touch px-4"
              variant="destructive"
              aria-label={isHindi ? 'रोकें' : 'Stop'}
            >
              <Square className="w-4 h-4 mr-2" />
              {isHindi ? 'रोकें' : 'Stop'}
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 btn-touch px-4"
              aria-label={isHindi ? 'भेजें' : 'Send message'}
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
      </div>
    </div>
  );
}