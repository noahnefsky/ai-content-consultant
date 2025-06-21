
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformChange: (platforms: string[]) => void;
}

const platforms = [
  { id: 'tiktok', name: 'TikTok', color: 'from-pink-500 to-red-500', icon: '🎵' },
  { id: 'instagram', name: 'Instagram', color: 'from-purple-500 to-pink-500', icon: '📷' },
  { id: 'linkedin', name: 'LinkedIn', color: 'from-blue-600 to-blue-700', icon: '💼' },
  { id: 'twitter', name: 'Twitter', color: 'from-blue-400 to-blue-500', icon: '🐦' },
];

export const PlatformSelector = ({ selectedPlatforms, onPlatformChange }: PlatformSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePlatform = (platformId: string) => {
    const updated = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(p => p !== platformId)
      : [...selectedPlatforms, platformId];
    onPlatformChange(updated);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        Platforms ({selectedPlatforms.length})
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-64 bg-white/10 backdrop-blur-sm border-white/20 p-4 z-50">
          <h3 className="text-sm font-medium text-white mb-3">Select Platforms</h3>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                  selectedPlatforms.includes(platform.id)
                    ? `bg-gradient-to-r ${platform.color} text-white`
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <span className="text-lg">{platform.icon}</span>
                <span className="font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
