import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaType = "tiktok" | "instagram" | "twitter";

interface MediaTypeSelectorProps {
  selectedMediaType: MediaType;
  onMediaTypeChange: (mediaType: MediaType) => void;
}

const mediaTypes: MediaType[] = ["tiktok", "instagram", "twitter"];
const mediaTypeDisplayNames: Record<MediaType, string> = {
  tiktok: "TikTok",
  instagram: "Instagram Post",
  twitter: "Twitter Post",
};

export const MediaTypeSelector = ({ selectedMediaType, onMediaTypeChange }: MediaTypeSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-400 mb-2 block">
        Content Type
      </label>
      <div className="flex w-full gap-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-1.5">
        {mediaTypes.map((mediaType) => (
          <Button
            key={mediaType}
            variant="ghost"
            size="sm"
            onClick={() => onMediaTypeChange(mediaType)}
            className={cn(
              "capitalize w-full hover:bg-zinc-700/50 hover:text-white transition-all text-xs sm:text-sm",
              selectedMediaType === mediaType
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                : "text-zinc-400"
            )}
          >
            {mediaTypeDisplayNames[mediaType]}
          </Button>
        ))}
      </div>
    </div>
  );
}; 