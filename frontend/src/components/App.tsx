import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatInterface } from './ChatInterface';
import { useChat } from '../hooks/useChat';
import { Menu } from 'lucide-react';

export function App() {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    createNewSession,
    deleteSession,
    sendMessage,
    isLoading,
  } = useChat();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#191A1A] font-sans overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`
        fixed md:relative z-50 h-full transition-transform duration-300 ease-in-out bg-[#202222]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          onNewChat={() => {
            createNewSession();
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-gray-800 bg-[#202222] text-white">
            <button onClick={() => setIsMobileMenuOpen(true)} className="mr-4">
                <Menu />
            </button>
            <span className="font-serif italic font-bold">JusQuery</span>
        </div>

        <ChatInterface
          session={currentSession}
          isLoading={isLoading}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  );
}
