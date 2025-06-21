import { useState, useCallback } from 'react';
import { ContentType } from './use-videos';
import { createAIContentService, ContentGenerationRequest, ContentIdea } from '../../../services/ai-content-service';

export interface AIResponse {
  id: string;
  content: string;
  content_type: ContentType;
  generated_at: string;
  relevant_media: string;
  // Add structured content for better frontend usage
  structuredContent?: {
    idea: string;
    videoStructure: string;
    caption: string;
    hashtags: string[];
  };
}

// Hook interface
export interface UseAIServiceReturn {
  // State
  aiResponses: AIResponse[];
  aiLoading: boolean;
  aiError: string | null;
  
  // Actions
  generateAIContent: (relevantMedia: string, contentType: ContentType) => Promise<void>;
  generateCustomContent: (request: ContentGenerationRequest) => Promise<ContentIdea | null>;
  clearAIResponses: () => void;
  clearError: () => void;
}

export const useAIService = (): UseAIServiceReturn => {
  // State
  const [aiResponses, setAIResponses] = useState<AIResponse[]>([]);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  // Helper function to create AI service
  const createService = useCallback(() => {
    return createAIContentService();
  }, []);

  // Generate AI content based on relevant media and content type (for existing app integration)
  const generateAIContent = useCallback(async (relevantMedia: string, contentType: ContentType) => {
    setAILoading(true);
    setAIError(null);
    
    try {
      if (!relevantMedia) {
        throw new Error('No relevant media content provided for AI generation');
      }

      const aiService = createService();
      
      // Map content types to user prompts
      const contentTypePrompts = {
        'morning': 'Create a morning routine video that inspires people to start their day right',
        'cooking': 'Create a cooking tutorial that shows how to make delicious meals easily',
        'workout': 'Create a workout video that motivates people to exercise',
        'study': 'Create a study tips video that helps students be more productive',
        'budget': 'Create a budgeting video that teaches financial literacy',
        'photography': 'Create a photography tutorial that teaches creative techniques',
        'fashion': 'Create a fashion video that shows styling tips and trends',
        'decor': 'Create a home decor video that shows DIY projects and styling',
        'plant': 'Create a plant care video that teaches gardening and plant maintenance',
        'skincare': 'Create a skincare routine video that promotes healthy skin',
        'tech': 'Create a tech review or tutorial video',
        'startup': 'Create a startup advice video for entrepreneurs',
        'climate': 'Create an environmental awareness video',
        'mental health': 'Create a mental health awareness and wellness video',
        'remote work': 'Create a remote work tips and productivity video',
        'leadership': 'Create a leadership and management advice video',
        'career': 'Create a career development and job search video',
        'culture': 'Create a cultural awareness and diversity video',
        'sales': 'Create a sales and marketing strategy video',
        'healthcare': 'Create a healthcare and wellness education video'
      };

      const userPrompt = contentTypePrompts[contentType] || `Create a ${contentType} related video`;
      
      const request: ContentGenerationRequest = {
        userPrompt,
        systemPrompt: `You are an expert content creator specializing in ${contentType} content. 
        Create engaging, viral-worthy content that resonates with your audience.
        Focus on practical value, entertainment, and shareability.`,
        transcripts: [relevantMedia], // Use the relevant media as context
        platform: 'tiktok' // Default to TikTok for maximum reach
      };

      console.log("request", request);

      const response = await aiService.generateContentIdea(request);
      console.log("response", response);

      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'Failed to generate AI content');
      }

      // Convert the structured response to the expected format
      const combinedContent = `
IDEA: ${response.content.idea}

VIDEO STRUCTURE: ${response.content.videoStructure}

CAPTION: ${response.content.caption}

HASHTAGS: ${response.content.hashtags.join(' ')}
      `.trim();

      const aiResponse: AIResponse = {
        id: `ai-${Date.now()}`,
        content: combinedContent,
        content_type: contentType,
        generated_at: new Date().toISOString(),
        relevant_media: relevantMedia,
        structuredContent: response.content // Keep structured content for frontend use
      };

      setAIResponses(prev => [...prev, aiResponse]);
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Failed to generate AI content');
    } finally {
      setAILoading(false);
    }
  }, [createService]);

  // Generate custom content with full control (for new AI content generator)
  const generateCustomContent = useCallback(async (request: ContentGenerationRequest): Promise<ContentIdea | null> => {
    console.log('useAIService: generateCustomContent called with:', request);
    setAILoading(true);
    setAIError(null);
    
    try {
      const aiService = createService();
      console.log('useAIService: AI service created');
      
      // Test connection first
      const isConnected = await aiService.testConnection();
      console.log('useAIService: Connection test result:', isConnected);
      if (!isConnected) {
        throw new Error('Failed to connect to AI service. Please check your API key.');
      }

      console.log('useAIService: Calling generateContentIdea');
      const response = await aiService.generateContentIdea(request);
      console.log('useAIService: Response received:', response);
      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'Failed to generate content');
      }

      console.log('useAIService: Returning content:', response.content);
      return response.content;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('useAIService: Error in generateCustomContent:', err);
      setAIError(errorMsg);
      return null;
    } finally {
      setAILoading(false);
    }
  }, [createService]);

  // Clear AI responses
  const clearAIResponses = useCallback(() => {
    setAIResponses([]);
    setAIError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setAIError(null);
  }, []);

  return {
    // State
    aiResponses,
    aiLoading,
    aiError,
    
    // Actions
    generateAIContent,
    generateCustomContent,
    clearAIResponses,
    clearError
  };
}; 