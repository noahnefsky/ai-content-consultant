import { useState, useCallback } from 'react';

// Types for video transformation
export interface VideoTransformRequest {
  video: File;
  targetPlatform: 'tiktok' | 'instagram' | 'twitter';
}

export interface VideoTransformResponse {
  success: boolean;
  platform: string;
  clips_count: number;
  transcript: string;
  message: string;
  clip_filenames?: string[];
  error?: string;
}

export interface VideoTransformResult {
  platform: string;
  clipsCount: number;
  transcript: string;
  message: string;
  clipFilenames: string[];
}

// Hook interface
export interface UseVideoTransformReturn {
  // State
  loading: boolean;
  error: string | null;
  result: VideoTransformResult | null;
  
  // Actions
  transformVideo: (request: VideoTransformRequest) => Promise<VideoTransformResult | null>;
  clearResult: () => void;
  clearError: () => void;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const useVideoTransform = (): UseVideoTransformReturn => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoTransformResult | null>(null);

  // Transform video
  const transformVideo = useCallback(async (request: VideoTransformRequest): Promise<VideoTransformResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', request.video);
      formData.append('target_platform', request.targetPlatform);
      
      console.log('useVideoTransform: Calling /transform-video with:', {
        filename: request.video.name,
        size: request.video.size,
        platform: request.targetPlatform
      });
      
      const response = await fetch(`${API_BASE_URL}/transform-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: VideoTransformResponse = await response.json();
      console.log('useVideoTransform: Response received:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Video transformation failed');
      }

      // Transform the response
      const transformResult: VideoTransformResult = {
        platform: data.platform,
        clipsCount: data.clips_count,
        transcript: data.transcript,
        message: data.message,
        clipFilenames: data.clip_filenames || []
      };
      
      setResult(transformResult);
      return transformResult;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('useVideoTransform: Error in transformVideo:', err);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    result,
    
    // Actions
    transformVideo,
    clearResult,
    clearError,
  };
}; 