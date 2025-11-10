"use client";

import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  };
  showAvatar?: boolean;
  language?: string;
}

export function MessageBubble({ message, showAvatar = true, language = 'en' }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const isHindi = language === 'hi';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success(isHindi ? 'कॉपी किया गया' : 'Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(isHindi ? 'कॉपी नहीं हो सका' : 'Failed to copy');
    }
  };

  return (
    <div
      className={`flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      {isAssistant && showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[85%] relative ${isAssistant ? "order-2" : "order-1"}`}>
        <Card
          className={`p-3 ${
            isAssistant
              ? "bg-muted/50 dark:bg-muted/30 border-muted dark:border-muted/50"
              : "bg-primary text-primary-foreground border-primary shadow-sm"
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize link styling
                  a: ({ node, ...props }) => (
                    <a {...props} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" />
                  ),
                  // Customize code blocks
                  code: ({ node, inline, className, children, ...props }: any) => (
                    inline
                      ? <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                      : <code className="block bg-muted/50 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props}>{children}</code>
                  ),
                  // Customize lists
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc list-inside space-y-1" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal list-inside space-y-1" />
                  ),
                  // Customize headings
                  h1: ({ node, ...props }) => (
                    <h1 {...props} className="text-lg font-bold mb-2" />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 {...props} className="text-base font-semibold mb-2" />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 {...props} className="text-sm font-medium mb-1" />
                  ),
                  // Customize paragraphs
                  p: ({ node, ...props }) => (
                    <p {...props} className="text-sm leading-relaxed" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          )}
        </Card>

        {/* Copy button for assistant messages */}
        {isAssistant && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -bottom-2 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border"
            onClick={handleCopy}
            aria-label={isHindi ? "संदेश कॉपी करें" : "Copy message"}
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {!isAssistant && showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
