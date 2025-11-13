"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineModeMessage, NetworkStatusBadge } from "@/components/ui/network-status";
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";
import { useConversationStoreDb } from "@/hooks/useConversationStoreDb";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { QuickReplyChips, QuickReply, commonQuickReplies } from "./QuickReplyChips";
import { SchemeCard } from "./SchemeCard";
import {
  Send,
  Mic,
  Paperclip,
  Bot,
  Sparkles,
  RefreshCw,
  Settings,
  Loader2,
  Square,
  Moon,
  Sun,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface QuickPrompt {
  text: string;
  textHi?: string;
  icon: React.ReactNode;
  category: string;
}

const quickPrompts: QuickPrompt[] = [
  {
    text: "Find schemes for me",
    textHi: "मेरे लिए योजनाएं खोजें",
    icon: <Sparkles className="w-4 h-4" />,
    category: "eligibility",
  },
  {
    text: "I need a business loan",
    textHi: "मुझे व्यावसायिक ऋण चाहिए",
    icon: <Sparkles className="w-4 h-4" />,
    category: "loan",
  },
  {
    text: "How to start a business",
    textHi: "व्यवसाय कैसे शुरू करें",
    icon: <Sparkles className="w-4 h-4" />,
    category: "application",
  },
  {
    text: "Women entrepreneur schemes",
    textHi: "महिला उद्यमी योजनाएं",
    icon: <Sparkles className="w-4 h-4" />,
    category: "women",
  },
];

// Available models from OpenRouter
const availableModels = [
  { id: 'anthropic/claude-3-haiku', name: 'Claude Haiku', description: 'Fast & Efficient' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude Sonnet', description: 'Balanced' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', description: 'Open Source' },
];

export function EnhancedChatInterface({
  language = "en",
  userProfile = {}
}: {
  language?: string;
  userProfile?: any;
}) {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-haiku');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const { isOfflineMode } = useOfflineMode();
  const isHindi = language === "hi";

  // Use database-backed conversation store
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage: sendMessageDb,
    stop,
  } = useConversationStoreDb({
    language,
    userProfile,
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

  // Voice recording hook
  const voice = useChatVoiceInput((transcript) => {
    setInput(transcript);
    // Optionally auto-send after transcription
    setTimeout(() => {
      if (transcript.trim()) {
        sendMessageDb(transcript);
      }
    }, 100);
  });

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages, isLoading]);

  // Generate contextual quick replies based on AI response
  const generateQuickReplies = useCallback((content: string) => {
    const lowerContent = content.toLowerCase();

    // Detect context and suggest relevant quick replies
    if (lowerContent.includes('eligib') || lowerContent.includes('qualify')) {
      setQuickReplies(commonQuickReplies.eligibility);
      setShowQuickReplies(true);
    } else if (lowerContent.includes('scheme') || lowerContent.includes('योजना')) {
      setQuickReplies(commonQuickReplies.scheme);
      setShowQuickReplies(true);
    } else if (lowerContent.includes('loan') || lowerContent.includes('ऋण')) {
      setQuickReplies(commonQuickReplies.loan);
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
    }
  }, []);

  // Announce message for screen readers (accessibility)
  const announceMessage = (content: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = isHindi ? `नया संदेश: ${content.substring(0, 100)}...` : `New message: ${content.substring(0, 100)}...`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  // Handle submit with offline mode support
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Hide quick replies when user sends a message
    setShowQuickReplies(false);

    // If offline, show warning but still try to send
    if (isOfflineMode) {
      toast.info(isHindi ? 'आप ऑफ़लाइन हैं' : 'You appear to be offline');
    }

    // Send via conversation store (handles persistence)
    sendMessageDb(input);
  }, [input, isOfflineMode, sendMessageDb, isHindi]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    setShowQuickReplies(false);
    // Send message directly
    setTimeout(() => {
      sendMessageDb(prompt);
    }, 0);
  }, [setInput, sendMessageDb]);

  // Handle model change
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    const modelName = model.split('/')[1];
    toast.success(isHindi ? `मॉडल बदल गया: ${modelName}` : `Switched to ${modelName}`);
  }, [isHindi]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar with Settings */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">
            {isHindi ? 'AI सहायक' : 'AI Assistant'}
          </span>
          <NetworkStatusBadge />
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8"
            aria-label={isHindi ? 'थीम बदलें' : 'Toggle theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Settings className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline text-xs">
                  {selectedModel.split('/')[1]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {isHindi ? 'AI मॉडल चुनें' : 'Select AI Model'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                  {selectedModel === model.id && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reload Button - removed in AI SDK v5 */}
        </div>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4 chat-scrollbar">
        {/* Offline Mode Message */}
        <OfflineModeMessage />

        <div className="space-y-4" role="log" aria-label={isHindi ? 'चैट संदेश' : 'Chat messages'}>
          {messages
            .filter((m) => m.role === 'user' || m.role === 'assistant') // Filter out system messages
            .map((message, index) => (
              <MessageBubble
                key={message.id}
                message={{
                  ...message,
                  role: message.role as 'user' | 'assistant',
                  content: getMessageText(message)
                }}
                showAvatar={true}
                language={language}
              />
            ))}

          {/* Typing indicator */}
          {isLoading && (
            <TypingIndicator
              message={isHindi ? "सोच रहा हूं..." : "Thinking..."}
            />
          )}

          {/* Error display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm text-destructive">
                {error.message || (isHindi ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.')}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Replies */}
      {showQuickReplies && quickReplies.length > 0 && !isLoading && (
        <QuickReplyChips
          suggestions={quickReplies}
          onSelect={handleQuickPrompt}
          disabled={isLoading}
          language={language}
        />
      )}

      {/* Initial Quick Prompts */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-2">
            {isHindi ? 'त्वरित प्रश्न' : 'Quick questions'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto py-3 px-3 justify-start text-left hover:bg-primary/10 hover:border-primary transition-all"
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
            className="flex-shrink-0 h-12 w-12"
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
              placeholder={
                isHindi
                  ? "अपना प्रश्न टाइप करें या बोलें..."
                  : "Type your question or speak..."
              }
              className="pr-12 min-h-[48px] text-base rounded-full"
              disabled={isLoading}
              aria-label={isHindi ? 'संदेश इनपुट' : 'Message input'}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full ${
                voice.isRecording ? 'bg-red-500/10' : ''
              }`}
              onClick={voice.toggleVoiceMode}
              aria-label={voice.isRecording ? (isHindi ? "रिकॉर्डिंग बंद करें" : "Stop recording") : (isHindi ? "रिकॉर्डिंग शुरू करें" : "Start recording")}
              disabled={isLoading || voice.isTranscribing}
            >
              {voice.isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : voice.isRecording ? (
                <Square className="w-4 h-4 text-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            {/* Voice recording indicator */}
            {voice.isRecording && (
              <div className="absolute -top-10 right-0 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full animate-pulse shadow-lg">
                🔴 {isHindi ? 'रिकॉर्ड कर रहे हैं' : 'Recording'} {voice.duration}
              </div>
            )}
          </div>

          {isLoading ? (
            <Button
              type="button"
              onClick={() => stop()}
              className="flex-shrink-0 btn-touch px-4 rounded-full"
              variant="destructive"
              aria-label={isHindi ? 'रोकें' : 'Stop'}
            >
              <Square className="w-4 h-4 mr-2" />
              {isHindi ? 'रोकें' : 'Stop'}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 btn-touch px-6 rounded-full"
              aria-label={isHindi ? 'भेजें' : 'Send message'}
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Language Hint */}
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" />
          {isHindi
            ? "12 भाषाओं में बात करें • तत्काल सहायता"
            : "Chat in 12 languages • Instant assistance"}
          {selectedModel.includes('haiku') && (
            <Badge variant="secondary" className="text-xs ml-2">
              {isHindi ? 'तेज़ मोड' : 'Fast mode'}
            </Badge>
          )}
        </p>
      </form>
    </div>
  );
}
