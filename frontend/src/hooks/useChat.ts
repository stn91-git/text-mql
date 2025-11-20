import { useState, useEffect, useCallback } from 'react';
import { queryDatabase } from '../lib/api';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STORAGE_KEY = 'astro-gpt-chats';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        if (parsed.length > 0) {
          // Optionally load the most recent session
           const mostRecent = parsed.sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt)[0];
           setCurrentSessionId(mostRecent.id);
        }
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    } else {
        // Create a default new session if none exist
        createNewSession();
    }
  }, []);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== id);
      return newSessions;
    });
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  const appendMessage = useCallback((sessionId: string, message: Message) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, message],
              updatedAt: Date.now(),
            }
          : session,
      ),
    );
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let activeSessionId = currentSessionId;
    
    if (!activeSessionId) {
      activeSessionId = createNewSession();
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              title:
                session.messages.length === 0
                  ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
                  : session.title,
              messages: [...session.messages, userMessage],
              updatedAt: Date.now(),
            }
          : session,
      ),
    );

    setError(null);
    setIsLoading(true);

    try {
      const response = await queryDatabase(content);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.result || 'No results returned.',
        timestamp: Date.now(),
      };
      appendMessage(activeSessionId, assistantMessage);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while querying.';
      setError(message);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ ${message}`,
        timestamp: Date.now(),
      };
      appendMessage(activeSessionId, assistantMessage);
    } finally {
      setIsLoading(false);
    }
  }, [appendMessage, currentSessionId, createNewSession]);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    createNewSession,
    deleteSession,
    sendMessage,
    isLoading,
    error,
    setError,
  };
}

