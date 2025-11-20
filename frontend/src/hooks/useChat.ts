import { useState, useEffect, useCallback } from 'react';

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

    setSessions((prev) => {
      return prev.map((session) => {
        if (session.id === activeSessionId) {
            // Update title if it's the first message
            const title = session.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : session.title;
            return {
                ...session,
                title,
                messages: [...session.messages, userMessage],
                updatedAt: Date.now(),
            };
        }
        return session;
      });
    });

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `This is a simulated response to: "${content}". \n\n I am running entirely in your browser!`,
        timestamp: Date.now(),
      };

      setSessions((prev) => {
        return prev.map((session) => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              messages: [...session.messages, aiMessage],
              updatedAt: Date.now(),
            };
          }
          return session;
        });
      });
      setIsLoading(false);
    }, 1000);
  }, [currentSessionId, createNewSession]);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    createNewSession,
    deleteSession,
    sendMessage,
    isLoading,
  };
}

