// AI Content Service - Types and interfaces for content generation

export interface ContentGenerationRequest {
  userPrompt: string;
  systemPrompt?: string;
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

export interface AIContentService {
  testConnection(): Promise<boolean>;
  generateContentIdea(request: ContentGenerationRequest): Promise<ContentGenerationResponse>;
}

export function createAIContentService(): AIContentService {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return {
    async testConnection(): Promise<boolean> {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        return response.ok;
      } catch (error) {
        console.error('Connection test failed:', error);
        return false;
      }
    },

    async generateContentIdea(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
      try {
        const response = await fetch(`${API_BASE_URL}/generate-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_prompt: request.userPrompt,
            system_prompt: request.systemPrompt,
            transcripts: request.transcripts,
            platform: request.platform
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Content generation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
      }
    }
  };
} 