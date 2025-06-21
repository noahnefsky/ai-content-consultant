
import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { TrendPanel } from "@/components/TrendPanel";
import { PlatformSelector } from "@/components/PlatformSelector";

const Index = () => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");

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
              onPlatformChange={setSelectedPlatforms}
            />
          </div>
        </div>
      </header>

      {/* Main Layout - Left Right Panels */}
      <div className="flex-1 container mx-auto px-6 py-6 overflow-hidden">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Trend Panel - Left Side */}
          <div className="col-span-1 overflow-hidden">
            <TrendPanel />
          </div>

          {/* Chat Panel - Right Side */}
          <div className="col-span-1 overflow-hidden">
            <ChatPanel 
              chatInput={chatInput}
              setChatInput={setChatInput}
              selectedPlatforms={selectedPlatforms}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
