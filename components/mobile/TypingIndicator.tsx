"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  message?: string;
}

export function TypingIndicator({ message = "Thinking..." }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="w-5 h-5" />
        </AvatarFallback>
      </Avatar>
      <Card className="bg-muted border-muted p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
          </div>
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </Card>
    </div>
  );
}
