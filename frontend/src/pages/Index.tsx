import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/ChatPanel";
import { TrendPanel } from "@/components/TrendPanel";
import { MediaTransformPanel } from "@/components/MediaTransformPanel";
import { PlatformSelector } from "@/components/PlatformSelector";
import { useVideos, ContentType } from "@/hooks/use-videos";

const Index = () => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<ContentType[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("trends");
  
  const {
    videos,
    loading,
    error,
    fetchVideos,
    clearVideos
  } = useVideos();

  // Load all videos by default on component mount
  useEffect(() => {
    fetchVideos({});
  }, [fetchVideos]);

  const handlePlatformChange = (platforms: string[]) => {
    const validPlatforms = platforms.filter(p => 
      ['tiktok', 'twitter', 'instagram', 'linkedin'].includes(p)
    ) as ContentType[];
    setSelectedPlatforms(validPlatforms);
  };

  const handleSearch = async (searchTerm: string, contentTypes?: ContentType[]) => {
    if (searchTerm.trim()) {
      await fetchVideos({
        search_term: searchTerm,
        content_types: contentTypes || selectedPlatforms.length > 0 ? selectedPlatforms : undefined
      });
    } else if (contentTypes) {
      // If no search term but content types are specified, show all videos of that type
      await fetchVideos({
        content_types: contentTypes
      });
    } else {
      // If no search term and no content types, show all videos
      await fetchVideos({});
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <h1 className="text-xl font-bold text-white">ViralCraft</h1>
            </div>
            <PlatformSelector 
              selectedPlatforms={selectedPlatforms}
              onPlatformChange={handlePlatformChange}
            />
          </div>
        </div>
      </header>

      {/* Main Layout - Tabs */}
      <div className="flex-1 container mx-auto px-6 py-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              Trending Content
            </TabsTrigger>
            <TabsTrigger 
              value="transform" 
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              Media Transformer
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-6 overflow-hidden">
            <TabsContent value="trends" className="h-full m-0">
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* Trend Panel - Left Side */}
                <div className="col-span-1 overflow-hidden">
                  <TrendPanel 
                    videos={videos}
                    loading={loading}
                    error={error}
                    onSearch={handleSearch}
                  />
                </div>

                {/* Chat Panel - Right Side */}
                <div className="col-span-1 overflow-hidden">
                  <ChatPanel 
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    selectedPlatforms={selectedPlatforms}
                    onSearch={handleSearch}
                    videos={videos}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transform" className="h-full m-0">
              <div className="h-full">
                <MediaTransformPanel />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
