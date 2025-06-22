import { useState, useCallback } from 'react';

// Types matching the backend models
export interface ContentGenerationRequest {
  user_prompt: string;
  system_prompt?: string;
  transcripts?: string[];
  platform?: string;
}

export interface ContentIdea {
  idea: string;
  videoStructure: string;
  caption: string;
  hashtags: string[];
}

export interface ContentGenerationResponse {
  success: boolean;
  content?: ContentIdea;
  error?: string;
}

// Hook interface
export interface UseGeminiServiceReturn {
  // State
  loading: boolean;
  error: string | null;
  lastResponse: ContentGenerationResponse | null;
  
  // Actions
  generateContent: (request: ContentGenerationRequest) => Promise<ContentIdea | null>;
  clearError: () => void;
  clearResponse: () => void;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const useGeminiService = (): UseGeminiServiceReturn => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ContentGenerationResponse | null>(null);

  // Generate content using the backend endpoint
  const generateContent = useCallback(async (request: ContentGenerationRequest): Promise<ContentIdea | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('useGeminiService: Calling /generate-content with:', request);
      
      const response = await fetch(`${API_BASE_URL}/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ContentGenerationResponse = await response.json();
      console.log('useGeminiService: Response received:', data);
      
      setLastResponse(data);
      
      if (!data.success || !data.content) {
        throw new Error(data.error || 'Failed to generate content');
      }

      return data.content;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('useGeminiService: Error in generateContent:', err);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear last response
  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    // State
    loading,
    error,
    lastResponse,
    
    // Actions
    generateContent,
    clearError,
    clearResponse,
  };
};
