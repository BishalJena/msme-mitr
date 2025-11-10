"use client";

import { useState } from "react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ChatInterfaceStream } from "@/components/mobile/ChatInterfaceStream";
import { ChatSidebar } from "@/components/mobile/ChatSidebar";
// import { EnhancedChatInterface } from "@/components/mobile/EnhancedChatInterface";
// Note: EnhancedChatInterface requires AI SDK v3/v4. See docs/AI_SDK_MIGRATION.md

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default on desktop
  const [currentChatId, setCurrentChatId] = useState<string>("1");

  const handleNewChat = () => {
    // Create new chat logic
    console.log("Creating new chat...");
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setIsSidebarOpen(false);
  };

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
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
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
          <ChatInterfaceStream language="en" />
          {/* <EnhancedChatInterface language="en" /> */}
        </div>
      </div>
    </MobileLayout>
  );
}
