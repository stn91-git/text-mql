import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, ArrowRight, Plus, Paperclip, Mic, Search, Globe, FileText, Image as ImageIcon } from 'lucide-react';
import type { Message, ChatSession } from '../hooks/useChat';
import { clsx } from 'clsx';

interface ChatInterfaceProps {
  session: ChatSession | null;
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

export function ChatInterface({ session, isLoading, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

  const hasMessages = session && session.messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#191A1A] text-gray-200">
      
      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Empty State / Home Screen */}
        {!hasMessages && (
           <div className="flex flex-col items-center justify-center min-h-full px-4 py-20">
              <div className="w-full max-w-3xl flex flex-col items-center gap-8">
                  {/* Logo / Branding */}
                  <div className="flex items-center gap-3 mb-4">
                     <span className="text-4xl font-serif italic font-bold text-white tracking-tight">jusquery</span>
                     <span className="text-xs font-bold uppercase tracking-widest bg-[#20b8cd] text-[#191A1A] px-1.5 py-0.5 rounded-sm">PRO</span>
                  </div>

                  {/* Search Input Box */}
                  <div className={clsx(
                      "w-full bg-[#202222] border transition-all duration-300 rounded-[32px] p-2 relative shadow-2xl",
                      isFocused ? "border-[#20b8cd]/50 ring-1 ring-[#20b8cd]/20" : "border-gray-700/50 hover:border-gray-600"
                  )}>
                      <div className="flex flex-col">
                          <textarea
                              ref={textareaRef}
                              value={input}
                              onChange={handleInput}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              placeholder="Ask anything..."
                              className="w-full bg-transparent text-lg text-gray-100 placeholder-gray-400 resize-none focus:outline-none p-4 min-h-[60px] max-h-[200px]"
                              rows={1}
                          />
                          <div className="flex items-center justify-between px-2 pb-2">
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#2d2f2f] hover:bg-[#3d3f3f] px-3 py-1.5 rounded-full transition-colors">
                                        <Plus size={14} />
                                        <span>Focus</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#2d2f2f] hover:bg-[#3d3f3f] px-3 py-1.5 rounded-full transition-colors">
                                        <Paperclip size={14} />
                                        <span>Attach</span>
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleSubmit()}
                                    disabled={!input.trim() || isLoading}
                                    className={clsx(
                                        "p-2 rounded-full transition-all duration-200",
                                        input.trim() ? "bg-[#20b8cd] text-[#191A1A]" : "bg-[#2d2f2f] text-gray-500"
                                    )}
                                >
                                    <ArrowRight size={20} />
                                </button>
                          </div>
                      </div>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {[
                          { icon: <UserIcon size={14} />, label: "Parenting" },
                          { icon: <Search size={14} />, label: "JusQuery 101" },
                          { icon: <FileText size={14} />, label: "Fact Check" },
                          { icon: <Globe size={14} />, label: "Summarize" },
                          { icon: <ImageIcon size={14} />, label: "Analyze" },
                      ].map((item, i) => (
                          <button key={i} className="flex items-center gap-2 px-4 py-2 bg-[#202222] border border-gray-700/50 hover:border-gray-600 rounded-full text-sm text-gray-300 transition-colors">
                              {item.icon}
                              <span>{item.label}</span>
                          </button>
                      ))}
                  </div>
              </div>
           </div>
        )}

        {/* Message List */}
        {hasMessages && (
          <div className="w-full max-w-3xl mx-auto py-8 px-4 space-y-8">
            {session.messages.map((message) => (
                <div key={message.id} className="group">
                    {/* User Message */}
                    {message.role === 'user' ? (
                        <div className="flex items-start gap-4 mb-6">
                             <div className="w-8 h-8 rounded-full bg-[#202222] border border-gray-700 flex items-center justify-center flex-shrink-0 text-gray-400">
                                <UserIcon size={16} />
                            </div>
                            <div className="flex-1 pt-1 text-2xl font-medium text-gray-100">
                                {message.content}
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#20b8cd]/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="font-serif italic font-bold text-[#20b8cd]">J</span>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-[#20b8cd] mb-1">
                                    <span>JusQuery</span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-500 font-normal text-xs">Answer</span>
                                </div>
                                <div className="prose prose-invert max-w-none text-gray-300 leading-7">
                                    {message.content}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
             {isLoading && (
                 <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#20b8cd]/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="font-serif italic font-bold text-[#20b8cd]">J</span>
                    </div>
                    <div className="flex items-center h-8">
                        <div className="flex space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Sticky Input for Chat Mode */}
      {hasMessages && (
        <div className="p-4 bg-[#191A1A] sticky bottom-0 z-10">
             <div className="max-w-3xl mx-auto">
                 <div className={clsx(
                      "w-full bg-[#202222] border transition-all duration-300 rounded-full px-4 py-3 relative shadow-lg flex items-center gap-3",
                      isFocused ? "border-[#20b8cd]/50 ring-1 ring-[#20b8cd]/20" : "border-gray-700/50 hover:border-gray-600"
                  )}>
                      <Plus size={20} className="text-gray-400 cursor-pointer hover:text-gray-200" />
                      <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Ask follow-up..."
                            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none max-h-[120px] py-1"
                            rows={1}
                        />
                       <button 
                            onClick={() => handleSubmit()}
                            disabled={!input.trim() || isLoading}
                            className={clsx(
                                "p-1.5 rounded-full transition-all duration-200",
                                input.trim() ? "bg-[#20b8cd] text-[#191A1A]" : "bg-[#2d2f2f] text-gray-500"
                            )}
                        >
                            <ArrowRight size={16} />
                        </button>
                 </div>
                 <div className="text-center mt-2 text-[10px] text-gray-600">
                    JusQuery can make mistakes.
                 </div>
             </div>
        </div>
      )}
    </div>
  );
}
