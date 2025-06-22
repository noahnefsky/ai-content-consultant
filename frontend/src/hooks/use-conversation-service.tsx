import { useState, useCallback } from 'react';

// Types for conversation management
export interface ConversationMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  structuredContent?: ContentIdea;
}

export interface ContentIdea {
  idea: string;
  videoStructure: string;
  caption: string;
  hashtags: string[];
}

export interface ConversationContext {
  current_intent?: string;
  message_count?: number;
  last_user_input?: string;
  needs_content_generation?: boolean;
  content_prompt?: string;
  last_generated_content?: any;
  content_history?: any[];
  conversation_summary?: string;
}

export interface ConversationResponse {
  success: boolean;
  response: string;
  structured_content: ContentIdea;
  conversation_context: ConversationContext;
  content_history: any[];
  error?: string;
}

// Hook interface
export interface UseConversationServiceReturn {
  // State
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  conversationContext: ConversationContext;
  
  // Actions
  sendMessage: (userInput: string, platforms?: string[], trendingContent?: any[]) => Promise<void>;
  clearConversation: () => void;
  clearError: () => void;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const useConversationService = (): UseConversationServiceReturn => {
  // State
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({});

  // Send a message and get response using the conversation graph
  const sendMessage = useCallback(async (userInput: string, platforms?: string[], trendingContent?: any[]): Promise<void> => {
    console.log("trendingContent", trendingContent)
    if (!userInput.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add user message to state immediately
      const userMessage: ConversationMessage = {
        type: 'user',
        content: userInput,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Prepare conversation history for the API
      const conversationHistory = messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }));
      
      console.log('useConversationService: Calling /conversation with:', {
        user_input: userInput,
        conversation_history: conversationHistory,
        platforms: platforms,
        trending_content: trendingContent
      });
      
      const response = await fetch(`${API_BASE_URL}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userInput,
          conversation_history: conversationHistory,
          user_context: {
            ...conversationContext,
            selected_platforms: platforms || [],
            trending_content: trendingContent || []
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ConversationResponse = await response.json();
      console.log('useConversationService: Response received:', data);
      console.log('useConversationService: Structured content:', data.structured_content);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process conversation');
      }

      // Add assistant response to state
      const assistantMessage: ConversationMessage = {
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        structuredContent: data.structured_content
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation context
      setConversationContext(data.conversation_context);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('useConversationService: Error in sendMessage:', err);
      setError(errorMsg);
      
      // Add error message to conversation
      const errorMessage: ConversationMessage = {
        type: 'assistant',
        content: `I'm having trouble processing your request: ${errorMsg}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages, conversationContext]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationContext({});
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    messages,
    loading,
    error,
    conversationContext,
    
    // Actions
    sendMessage,
    clearConversation,
    clearError,
  };
}; 