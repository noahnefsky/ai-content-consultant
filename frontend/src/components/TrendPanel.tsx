import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video } from "@/hooks/use-videos";
import { useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface TrendPanelProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
}

export const TrendPanel = ({ 
  videos, 
  loading, 
  error
}: TrendPanelProps) => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);

  // Update filtered videos whenever videos or selectedType changes
  useEffect(() => {
    const newFilteredVideos = selectedType === "all"
      ? videos
      : videos.filter((video) => video.content_type === selectedType);
    
    setFilteredVideos(newFilteredVideos);
    console.log("Updated filteredVideos:", newFilteredVideos);
  }, [videos, selectedType]);

  const platformColors = {
    tiktok: "from-pink-500 to-red-500",
    instagram: "from-purple-500 to-pink-500",
    linkedin: "from-blue-600 to-blue-700",
    twitter: "from-blue-400 to-blue-500"
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const contentTypes = ["all", ...Object.keys(platformColors)];

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">Viral Trends</h2>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {loading ? "Loading..." : `${filteredVideos.length} results`}
        </Badge>
      </div>

      <div className="px-6 pb-4 flex-shrink-0">
        <ToggleGroup
          type="single"
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value || "all");
          }}
          className="justify-start space-x-1"
        >
          {contentTypes.map((type) => (
            <ToggleGroupItem
              key={type}
              value={type}
              aria-label={`Filter ${type}`}
              className="capitalize bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white px-3 h-8"
            >
              {type}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {error && (
        <div className="px-6 pb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <ScrollArea className="flex-1 px-6 pb-6">
        {filteredVideos.length === 0 && !loading ? (
          <div className="text-center py-8">
            <div className="text-white/50 mb-2">No videos found</div>
            <p className="text-sm text-white/40">
              {videos.length > 0 && selectedType !== 'all' 
                ? `No videos found for ${selectedType}. Try another category.`
                : 'Trending content will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredVideos.map((video, index) => {
              // Ensure unique key - use video.id if available, otherwise fallback to index
              const uniqueKey = video.id && video.id.trim() ? video.id : `video-${index}-${video.content_type}`;
              
              return (
                <a
                  key={uniqueKey}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className={`bg-gradient-to-r ${platformColors[video.content_type]} text-white border-0`}
                      >
                        {video.content_type.charAt(0).toUpperCase() + video.content_type.slice(1)}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">
                          {formatNumber(video.views)}
                        </div>
                        <div className="text-xs text-white/60">views</div>
                      </div>
                    </div>

                    <img
                      src={video.thumbnail_url || '/placeholder.svg'}
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />

                    <h3 className="font-semibold text-white mb-2">{video.title}</h3>
                    <p className="text-sm text-white/70 mb-3 line-clamp-2">
                      {video.description}
                    </p>

                    {/* Content-specific info */}
                    {video.content_type === 'tiktok' && video.transcript && (
                      <div className="text-xs text-white/60 mb-3 p-2 bg-white/5 rounded">
                        <strong>Transcript:</strong> {video.transcript.substring(0, 100)}...
                      </div>
                    )}

                    {video.content_type === 'twitter' && video.post_text && (
                      <div className="text-xs text-white/60 mb-3 p-2 bg-white/5 rounded">
                        <strong>Post:</strong> {video.post_text.substring(0, 100)}...
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-sm">
                        <span className="text-green-400 font-medium">
                          {formatNumber(video.likes)} likes
                        </span>
                        <span className="text-blue-400 font-medium">
                          {formatNumber(video.shares)} shares
                        </span>
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
