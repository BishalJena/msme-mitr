"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  FileText,
  HelpCircle,
  TrendingUp,
  IndianRupee,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
  schemes?: any[];
}

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

export function ChatInterface({ language = "en" }: { language?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        language === "hi"
          ? "नमस्ते! मैं आपका MSME AI सहायक हूं। मैं आपको सरकारी योजनाओं के बारे में जानकारी देने और आवेदन प्रक्रिया में मदद करने के लिए यहां हूं। आप मुझसे हिंदी या अंग्रेजी में बात कर सकते हैं। आप कैसे मदद चाहेंगे?"
          : "Hello! I'm your MSME AI Assistant. I'm here to help you discover government schemes and guide you through the application process. You can chat with me in Hindi or English. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        "Show me all schemes",
        "I want to start a business",
        "Need funding for expansion",
        "Check my eligibility",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isHindi = language === "hi";

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call the API with scheme context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: localStorage.getItem('chatSessionId') || undefined,
          language: language,
          userProfile: {
            // Add user profile if available
          }
        }),
      });

      const data = await response.json();

      // Store session ID
      if (data.sessionId) {
        localStorage.setItem('chatSessionId', data.sessionId);
      }

      // Create bot response with real data
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        isBot: true,
        timestamp: new Date(),
        suggestions: data.suggestedActions,
        schemes: data.relevantSchemes,
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);

      // Log token usage in development
      if (process.env.NODE_ENV === 'development' && data.tokenCount) {
        console.log(`Tokens used: ${data.tokenCount}`);
        if (data.systemPrompt) {
          console.log('System Prompt:', data.systemPrompt);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);

      // Fallback response
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    handleSendMessage();
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Messages Area */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 px-4 py-4"
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.isBot ? "justify-start" : "justify-end"
              }`}
            >
              {message.isBot && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[85%] ${
                  message.isBot ? "order-2" : "order-1"
                }`}
              >
                <Card
                  className={`p-3 ${
                    message.isBot
                      ? "bg-muted border-muted"
                      : "bg-primary text-primary-foreground border-primary"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </Card>

                {/* Relevant Schemes */}
                {message.schemes && message.schemes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.schemes.map((scheme, idx) => (
                      <Card key={idx} className="p-3 bg-background border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{scheme.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {scheme.summary}
                            </p>
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {scheme.category}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs mt-2"
                          onClick={() => window.open(scheme.url, '_blank')}
                        >
                          View Details →
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleQuickPrompt(suggestion)}
                      >
                        {suggestion}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {!message.isBot && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
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
        </div>
      </ScrollArea>

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
            onClick={() => {}}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                isHindi
                  ? "अपना प्रश्न टाइप करें या बोलें..."
                  : "Type your question or speak..."
              }
              className="pr-10 min-h-[48px] text-base"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8"
              onClick={handleVoiceInput}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 text-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="flex-shrink-0 btn-touch px-4"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
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