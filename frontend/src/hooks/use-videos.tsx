import { useState, useCallback } from 'react';
import { mockVideos } from '@/data/videos';

// Types
export type ContentType = 'tiktok' | 'twitter' | 'instagram' | 'linkedin';

export interface Video {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  url: string;
  transcript?: string;
  post_text?: string;
  post_description?: string;
  created_at: string;
  views?: number;
  likes?: number;
  shares?: number;
}

export interface SearchParams {
  search_term?: string;
  content_types?: ContentType[];
  embedding?: number[];
}

// API placeholder functions
const getVideos = async (params: SearchParams): Promise<Video[]> => {
  // Placeholder implementation
  console.log('Fetching videos with params:', params);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Filter mock data based on search term and content types
  let filteredVideos = [...mockVideos];
  
  // Filter by content types if specified
  if (params.content_types && params.content_types.length > 0) {
    filteredVideos = filteredVideos.filter(video => 
      params.content_types!.includes(video.content_type)
    );
  }
  
  // Filter by search term if provided
  if (params.search_term) {
    const searchLower = params.search_term.toLowerCase();
    filteredVideos = filteredVideos.filter(video => 
      video.title.toLowerCase().includes(searchLower) ||
      video.description.toLowerCase().includes(searchLower) ||
      video.transcript?.toLowerCase().includes(searchLower) ||
      video.post_text?.toLowerCase().includes(searchLower) ||
      video.post_description?.toLowerCase().includes(searchLower)
    );
  }
  
  return filteredVideos;
};

const getEmbedding = async (searchTerm: string): Promise<number[]> => {
  // Placeholder implementation for embedding service
  console.log('Getting embedding for:', searchTerm);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock embedding vector
  return Array.from({ length: 384 }, () => Math.random());
};

// Hook interface
export interface UseVideosReturn {
  // State
  videos: Video[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchVideos: (params: SearchParams) => Promise<void>;
  clearVideos: () => void;
}

export const useVideos = (): UseVideosReturn => {
  // Video state
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch videos with optional search term and content types
  const fetchVideos = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      let apiParams = { ...params };
      
      // If search term is provided, get embedding first
      if (params.search_term) {
        const embedding = await getEmbedding(params.search_term);
        // Add embedding to API params (you can modify this based on your API structure)
        apiParams = {
          ...apiParams,
          embedding: embedding
        };
      }
      
      const fetchedVideos = await getVideos(apiParams);
      setVideos(fetchedVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear videos
  const clearVideos = useCallback(() => {
    setVideos([]);
    setError(null);
  }, []);

  return {
    // State
    videos,
    loading,
    error,
    
    // Actions
    fetchVideos,
    clearVideos
  };
};
