import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Loader2, Filter } from "lucide-react";
import { Video, ContentType } from "@/hooks/use-videos";

interface TrendPanelProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onSearch: (searchTerm: string, contentTypes?: ContentType[]) => Promise<void>;
}

export const TrendPanel = ({ 
  videos, 
  loading, 
  error, 
  onSearch
}: TrendPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState<string>("all");

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMediaTypeChange = async (value: string) => {
    setSelectedMediaType(value);
    if (value === "all") {
      await onSearch(searchTerm);
    } else {
      // Filter by media type
      await onSearch(searchTerm, [value as ContentType]);
    }
  };

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

  // Filter videos by selected media type
  const filteredVideos = selectedMediaType === "all" 
    ? videos 
    : videos.filter(video => video.content_type === selectedMediaType);

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">Viral Trends</h2>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {loading ? "Searching..." : filteredVideos.length > 0 ? `${filteredVideos.length} results` : "Ready"}
        </Badge>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-6 pb-4 flex-shrink-0 space-y-3">
        <div className="flex gap-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for trending content..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <Select value={selectedMediaType} onValueChange={handleMediaTypeChange}>
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Filter by media type" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white hover:bg-zinc-700">All Media Types</SelectItem>
              <SelectItem value="tiktok" className="text-white hover:bg-zinc-700">TikTok</SelectItem>
              <SelectItem value="instagram" className="text-white hover:bg-zinc-700">Instagram</SelectItem>
              <SelectItem value="twitter" className="text-white hover:bg-zinc-700">Twitter</SelectItem>
              <SelectItem value="linkedin" className="text-white hover:bg-zinc-700">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        {filteredVideos.length === 0 && !loading ? (
          <div className="text-center py-8">
            <div className="text-white/50 mb-2">No videos found</div>
            <p className="text-sm text-white/40">
              {selectedMediaType !== "all" 
                ? `No ${selectedMediaType} content found. Try a different search or media type.`
                : "Search for trending content to get started"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredVideos.map((video) => (
              <a
                key={video.id}
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
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
