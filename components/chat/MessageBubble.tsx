"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming = false }: MessageBubbleProps) {
  const isUser = role === "user";

  // Define custom components with proper typing for react-markdown v10
  const markdownComponents: Components = {
    // Customize markdown rendering
    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
    ul: ({ node, ...props }) => <ul className="mb-2 ml-4 list-disc space-y-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="mb-2 ml-4 list-decimal space-y-1" {...props} />,
    li: ({ node, ...props }) => <li className="text-sm" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    code: (props) => {
      const { inline, className, children, ...rest } = props as any;
      if (inline) {
        return (
          <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono" {...rest}>
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-muted-foreground/10 p-3 rounded-lg overflow-x-auto">
          <code className={`text-xs font-mono ${className || ''}`}>{children}</code>
        </pre>
      );
    },
    a: ({ node, children, href, ...props }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:no-underline"
        {...props}
      >
        {children}
      </a>
    ),
    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-0" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-0" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-base font-semibold mb-2 mt-0" {...props} />,
  };

  return (
    <div
      className={cn(
        "flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isUser && "items-end")}>
        <Card
          className={cn(
            "p-3 sm:p-4",
            isUser
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted border-muted",
            isStreaming && "animate-pulse"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base">
            {isUser ? (
              <p className="whitespace-pre-wrap m-0">{content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </Card>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
