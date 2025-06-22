import { useState, useCallback } from 'react';
// import { mockVideos } from '@/data/videos';

// Types
export type ContentType = 'tiktok' | 'twitter' | 'instagram' | 'linkedin';

export interface Video {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  url: string;
  thumbnail_url?: string;
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
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const query = new URLSearchParams();
  if (params.search_term) query.append('search_term', params.search_term);
  if (params.content_types && params.content_types.length > 0) {
    query.append('content_types', params.content_types.join(','));
  }
  const res = await fetch(`${API_BASE_URL}/videos?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch videos (${res.status})`);
  }
  const data: Video[] = await res.json();
  return data;
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
