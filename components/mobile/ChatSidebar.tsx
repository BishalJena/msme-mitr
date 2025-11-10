"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  Trash2,
  MoreVertical,
  Pin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import type { ConversationMetadata } from "@/types/conversation";
import {
  getConversationMetadata,
  deleteConversation,
  updateConversation,
} from "@/lib/conversationStorage";
import { toast } from "sonner";

interface ChatSidebarProps {
  language?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

export function ChatSidebar({
  language = "en",
  onNewChat,
  onSelectChat,
  currentChatId,
  refreshTrigger,
}: ChatSidebarProps) {
  const isHindi = language === "hi";
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Load conversations from storage
  const loadConversations = () => {
    const result = getConversationMetadata();
    if (result.success) {
      setConversations(result.data);
    } else {
      console.error('Failed to load conversations:', result.error);
    }
  };

  // Load on mount and when refreshTrigger changes
  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]);

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return isHindi ? "अभी" : "Now";
    } else if (minutes < 60) {
      return isHindi ? `${minutes} मिनट पहले` : `${minutes}m ago`;
    } else if (hours < 24) {
      return isHindi ? `${hours} घंटे पहले` : `${hours}h ago`;
    } else if (days === 1) {
      return isHindi ? "कल" : "Yesterday";
    } else {
      return isHindi ? `${days} दिन पहले` : `${days}d ago`;
    }
  };

  const handleDeleteClick = (chatId: string) => {
    setConversationToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    const result = deleteConversation(conversationToDelete);
    if (result.success) {
      toast.success(isHindi ? 'चैट हटाई गई' : 'Chat deleted');
      loadConversations();

      // If deleting current chat, trigger new chat
      if (conversationToDelete === currentChatId) {
        onNewChat?.();
      }
    } else {
      toast.error(result.error);
    }

    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleTogglePin = async (chatId: string, currentPinned: boolean) => {
    const result = updateConversation(chatId, { isPinned: !currentPinned });
    if (result.success) {
      toast.success(currentPinned
        ? (isHindi ? 'अनपिन किया गया' : 'Unpinned')
        : (isHindi ? 'पिन किया गया' : 'Pinned')
      );
      loadConversations();
    } else {
      toast.error(result.error);
    }
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
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {isHindi ? "कोई चैट नहीं" : "No conversations yet"}
              </p>
              <p className="text-xs mt-1">
                {isHindi ? "नया चैट शुरू करें" : "Start a new chat to begin"}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`
                  group relative rounded-lg transition-colors cursor-pointer
                  ${
                    currentChatId === conv.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }
                `}
                onClick={() => onSelectChat?.(conv.id)}
              >
                <div className="flex items-start gap-3 p-3">
                  {conv.isPinned ? (
                    <Pin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary fill-current" />
                  ) : (
                    <MessageSquare
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        currentChatId === conv.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium truncate ${
                        currentChatId === conv.id ? "text-primary" : ""
                      }`}
                    >
                      {conv.title}
                    </h4>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(conv.lastActive)}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {conv.messageCount} {conv.messageCount === 1 ? 'msg' : 'msgs'}
                      </p>
                    </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(conv.id, !!conv.isPinned);
                        }}
                      >
                        <Pin className="w-4 h-4 mr-2" />
                        {conv.isPinned
                          ? (isHindi ? "अनपिन करें" : "Unpin")
                          : (isHindi ? "पिन करें" : "Pin")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conv.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isHindi ? "हटाएं" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          {isHindi
            ? `${conversations.length} चैट`
            : `${conversations.length} ${conversations.length === 1 ? 'chat' : 'chats'}`}
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isHindi ? "चैट हटाएं?" : "Delete chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isHindi
                ? "यह चैट और सभी संदेश स्थायी रूप से हटा दिए जाएंगे। इसे पूर्ववत नहीं किया जा सकता।"
                : "This chat and all its messages will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isHindi ? "रद्द करें" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isHindi ? "हटाएं" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
