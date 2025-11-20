import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User as UserIcon,
  ArrowRight,
  Plus,
  Paperclip,
  Search,
  Globe,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import type { Message, ChatSession } from '../hooks/useChat';
import { clsx } from 'clsx';
import { fetchCollections, fetchCollectionSchema } from '../lib/api';
import { SmartRenderer } from './SmartRenderer';

interface ChatInterfaceProps {
  session: ChatSession | null;
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  error: string | null;
  onDismissError: () => void;
  connectionStatus: {
    state: 'loading' | 'healthy' | 'degraded' | 'offline';
    detail: string;
  };
}

export function ChatInterface({
  session,
  isLoading,
  onSendMessage,
  error,
  onDismissError,
  connectionStatus,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isCollectionsPanelOpen, setIsCollectionsPanelOpen] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<string>('');
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

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

  const loadCollections = async () => {
    setCollectionsLoading(true);
    setCollectionsError(null);
    try {
      const data = await fetchCollections();
      if (!data.success) {
        setCollectionsError(data.error || 'Unable to load collections.');
        return;
      }
      setCollections(data.collections);
      if (!selectedCollection && data.collections.length > 0) {
        const first = data.collections[0];
        setSelectedCollection(first);
        void loadSchema(first);
      }
    } catch (err) {
      setCollectionsError(
        err instanceof Error ? err.message : 'Unable to load collections.',
      );
    } finally {
      setCollectionsLoading(false);
    }
  };

  const loadSchema = async (collectionName: string) => {
    setSchemaLoading(true);
    setSchemaError(null);
    setSchemaInfo('');
    try {
      const data = await fetchCollectionSchema(collectionName);
      if (!data.success) {
        setSchemaError(data.error || 'Unable to load schema.');
        return;
      }
      setSchemaInfo(data.schema_info);
    } catch (err) {
      setSchemaError(err instanceof Error ? err.message : 'Unable to load schema.');
    } finally {
      setSchemaLoading(false);
    }
  };

  const openCollectionsPanel = () => {
    setIsCollectionsPanelOpen(true);
    if (collections.length === 0 && !collectionsLoading) {
      void loadCollections();
    }
  };

  const handleSelectCollection = (name: string) => {
    setSelectedCollection(name);
    void loadSchema(name);
  };

  const hasMessages = session && session.messages.length > 0;

  const statusStyles = {
    loading: 'bg-[#202222] border border-gray-700 text-gray-400',
    healthy: 'bg-[#0f2f2f] border border-[#20b8cd]/30 text-[#5ddce8]',
    degraded: 'bg-[#2d2f2f] border border-yellow-500/30 text-yellow-200',
    offline: 'bg-[#2f1f1f] border border-red-500/40 text-red-200',
  } as const;

  const renderStatusIcon = () => {
    switch (connectionStatus.state) {
      case 'healthy':
        return <CheckCircle2 size={16} />;
      case 'degraded':
        return <AlertTriangle size={16} />;
      case 'offline':
        return <AlertTriangle size={16} />;
      default:
        return <Loader2 size={16} className="animate-spin" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#191A1A] text-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4">
        <div className="flex justify-center md:justify-start">
          <div
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shadow-lg/20',
              statusStyles[connectionStatus.state],
            )}
          >
            {renderStatusIcon()}
            <span className="capitalize">{connectionStatus.state}</span>
            <span className="text-gray-500">•</span>
            <span className="text-[11px] text-gray-300">{connectionStatus.detail}</span>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={openCollectionsPanel}
            className="px-4 py-2 rounded-full text-xs font-medium bg-[#202222] border border-gray-700/60 hover:border-gray-500 transition-colors"
          >
            Browse collections
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4">
          <div className="max-w-3xl mx-auto bg-[#2f1f1f] border border-red-500/40 text-sm text-red-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5" />
              <div>
                <div className="font-semibold">Request failed</div>
                <p className="text-xs text-red-100/80">{error}</p>
              </div>
            </div>
            <button
              onClick={onDismissError}
              className="text-red-200/70 hover:text-red-100 transition-colors"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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
                                <SmartRenderer content={message.content} />
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
      
      {isCollectionsPanelOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsCollectionsPanelOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-[#1b1c1c] border-l border-gray-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <div className="text-sm font-semibold text-white">Collections</div>
                <p className="text-xs text-gray-500">Browse datasets and inspect their schema</p>
              </div>
              <button
                onClick={() => setIsCollectionsPanelOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close collections panel"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
              <div className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Available</div>
                <div className="space-y-2">
                  {collectionsLoading && (
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Loading collections…
                    </div>
                  )}
                  {collectionsError && (
                    <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                      {collectionsError}
                    </div>
                  )}
                  {!collectionsLoading && !collectionsError && collections.length === 0 && (
                    <div className="text-xs text-gray-500">No collections available.</div>
                  )}
                  {collections.map((collection) => (
                    <button
                      key={collection}
                      onClick={() => handleSelectCollection(collection)}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                        selectedCollection === collection
                          ? 'border-[#20b8cd]/40 bg-[#112526] text-[#5ddce8]'
                          : 'border-gray-800 bg-[#202222] hover:border-gray-600',
                      )}
                    >
                      {collection}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Schema preview</div>
                {!selectedCollection && (
                  <p className="text-xs text-gray-500">Select a collection to view its schema.</p>
                )}
                {schemaLoading && (
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Loading schema…
                  </div>
                )}
                {schemaError && (
                  <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                    {schemaError}
                  </div>
                )}
                {schemaInfo && (
                  <pre className="text-xs text-gray-300 bg-[#131414] border border-gray-800 rounded-lg p-4 whitespace-pre-wrap leading-relaxed">
                    {schemaInfo}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
