"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ChatInterfaceStream } from "@/components/mobile/ChatInterfaceStream";
import { ChatSidebar } from "@/components/mobile/ChatSidebar";

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default on desktop
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const prevChatIdRef = useRef<string | null>(null);

  // Trigger sidebar refresh when chat ID actually changes
  useEffect(() => {
    if (currentChatId !== prevChatIdRef.current) {
      prevChatIdRef.current = currentChatId;
      setRefreshTrigger(prev => prev + 1);
    }
  }, [currentChatId]);

  // Handle conversation change from ChatInterfaceStream
  const handleConversationChange = useCallback((conversationId: string | null) => {
    console.log('[ChatPage] Conversation changed to:', conversationId);
    
    // Batch state updates to prevent multiple re-renders
    setCurrentChatId(prev => {
      if (prev === conversationId) return prev; // No change needed
      
      // Close sidebar on mobile when conversation changes
      if (window.innerWidth < 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }
      
      return conversationId;
    });
  }, []);

  // Handle new chat (triggered by user clicking button)
  const handleNewChat = useCallback(() => {
    console.log('[ChatPage] New chat triggered');
    // Trigger new conversation creation in ChatInterfaceStream
    setNewChatTrigger(prev => prev + 1);
    // Sidebar will close automatically when conversation changes via handleConversationChange
  }, []);

  // Handle chat selection from sidebar
  const handleSelectChat = useCallback((chatId: string) => {
    console.log('[ChatPage] Chat selected:', chatId);
    // Only update if different to prevent unnecessary re-renders
    setCurrentChatId(prev => prev === chatId ? prev : chatId);
    // Sidebar will close automatically when conversation changes via handleConversationChange
  }, []);

  return (
    <MobileLayout className="p-0 overflow-hidden" onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}>
      <div className="flex h-full w-full overflow-hidden">
        {/* Chat Sidebar - Collapsible on both mobile and desktop */}
        <aside
          className={`
            h-full flex-shrink-0
            w-[280px] lg:w-[320px]
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "ml-0" : "-ml-[280px] lg:-ml-[320px]"}
          `}
        >
          <ChatSidebar
            language="en"
            currentChatId={currentChatId || undefined}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            refreshTrigger={refreshTrigger}
          />
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <ChatInterfaceStream
            language="en"
            onConversationChange={handleConversationChange}
            newChatTrigger={newChatTrigger}
            selectedChatId={currentChatId}
          />
        </div>
      </div>
    </MobileLayout>
  );
}
