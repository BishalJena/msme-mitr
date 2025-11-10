"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  language?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
}

export function ChatSidebar({
  language = "en",
  onNewChat,
  onSelectChat,
  currentChatId,
}: ChatSidebarProps) {
  const isHindi = language === "hi";

  // Mock chat history - replace with actual data
  const [chatHistory] = useState<ChatHistory[]>([
    {
      id: "1",
      title: isHindi ? "PMEGP योजना के बारे में" : "About PMEGP Scheme",
      lastMessage: isHindi
        ? "मुझे PMEGP के लिए आवेदन करने में मदद करें"
        : "Help me apply for PMEGP",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
      id: "2",
      title: isHindi ? "व्यवसाय ऋण पात्रता" : "Business Loan Eligibility",
      lastMessage: isHindi
        ? "मैं किन योजनाओं के लिए पात्र हूं?"
        : "What schemes am I eligible for?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      title: isHindi ? "स्टार्टअप सब्सिडी" : "Startup Subsidy",
      lastMessage: isHindi
        ? "महिला उद्यमी योजनाएं बताएं"
        : "Tell me about women entrepreneur schemes",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ]);

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return isHindi ? `${minutes} मिनट पहले` : `${minutes}m ago`;
    } else if (hours < 24) {
      return isHindi ? `${hours} घंटे पहले` : `${hours}h ago`;
    } else if (days === 1) {
      return isHindi ? "कल" : "Yesterday";
    } else {
      return isHindi ? `${days} दिन पहले` : `${days}d ago`;
    }
  };

  const handleDeleteChat = (chatId: string) => {
    // Implement delete logic
    console.log("Delete chat:", chatId);
  };

  return (
    <aside className="flex flex-col h-full bg-muted/30 border-r">
      {/* Sidebar Header */}
      <div className="p-4 space-y-3">
        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 btn-touch"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          <span>{isHindi ? "नया चैट" : "New Chat"}</span>
        </Button>

        {/* Schemes Button */}
        <Link href="/schemes" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 btn-touch"
            size="lg"
          >
            <Search className="w-5 h-5" />
            <span>{isHindi ? "योजनाएं खोजें" : "Browse Schemes"}</span>
          </Button>
        </Link>
      </div>

      <div className="border-t" />

      {/* Chat History Section */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {isHindi ? "चैट इतिहास" : "Chat History"}
        </h3>
      </div>

      {/* Chat History List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`
                group relative rounded-lg transition-colors cursor-pointer
                ${
                  currentChatId === chat.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                }
              `}
              onClick={() => onSelectChat?.(chat.id)}
            >
              <div className="flex items-start gap-3 p-3">
                <MessageSquare
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    currentChatId === chat.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium truncate ${
                      currentChatId === chat.id ? "text-primary" : ""
                    }`}
                  >
                    {chat.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {chat.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(chat.timestamp)}
                  </p>
                </div>

                {/* More Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isHindi ? "हटाएं" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          {isHindi
            ? `${chatHistory.length} चैट • आज`
            : `${chatHistory.length} chats • Today`}
        </p>
      </div>
    </aside>
  );
}
