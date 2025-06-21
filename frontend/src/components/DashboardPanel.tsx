import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIResponse } from "@/hooks/use-ai-service";
import { Loader2, Sparkles } from "lucide-react";

interface DashboardPanelProps {
  aiResponses: AIResponse[];
  aiLoading: boolean;
  aiError: string | null;
}

export const DashboardPanel = ({ aiResponses, aiLoading, aiError }: DashboardPanelProps) => {
  const latestResponse = aiResponses[aiResponses.length - 1];

  const extractHashtags = (content: string) => {
    const hashtagRegex = /#\w+/g;
    return content.match(hashtagRegex) || [];
  };

  const extractCaption = (content: string) => {
    // Simple logic to extract caption-like content (first few sentences)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
  };

  const calculateConfidence = (response: AIResponse) => {
    // Simple confidence calculation based on content length and structure
    const hasHashtags = extractHashtags(response.content).length > 0;
    const hasGoodLength = response.content.length > 50;
    const hasPlatformSpecific = response.content.toLowerCase().includes(response.content_type);
    
    let confidence = 60; // Base confidence
    if (hasHashtags) confidence += 10;
    if (hasGoodLength) confidence += 10;
    if (hasPlatformSpecific) confidence += 10;
    
    return Math.min(confidence, 95);
  };

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Content Analysis</h2>
        {latestResponse ? (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {calculateConfidence(latestResponse)}% Viral Potential
          </Badge>
        ) : (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Ready
          </Badge>
        )}
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
            <p className="text-white/70">Generating AI content...</p>
          </div>
        </div>
      )}

      {aiError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{aiError}</p>
        </div>
      )}

      {latestResponse ? (
        <div className="space-y-6">
          {/* Platform Badge */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {latestResponse.content_type.charAt(0).toUpperCase() + latestResponse.content_type.slice(1)}
            </Badge>
            <span className="text-xs text-white/60">
              Generated {new Date(latestResponse.generated_at).toLocaleTimeString()}
            </span>
          </div>

          {/* Suggested Caption */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Generated Content</h3>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white text-sm leading-relaxed">{latestResponse.content}</p>
            </div>
          </div>

          {/* Hashtags */}
          {extractHashtags(latestResponse.content).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80">Extracted Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {extractHashtags(latestResponse.content).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content Analysis */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Content Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">
                  {latestResponse.content.length}
                </div>
                <div className="text-xs text-white/60">Characters</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">
                  {extractHashtags(latestResponse.content).length}
                </div>
                <div className="text-xs text-white/60">Hashtags</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl mb-4 border border-purple-500/30">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No AI Content Yet</h3>
          <p className="text-sm text-white/60">
            Generate AI content from trending videos to see analysis and suggestions here.
          </p>
        </div>
      )}

      {/* All AI Responses History */}
      {aiResponses.length > 1 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-medium text-white/80 mb-4">Previous Generations</h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {aiResponses.slice(0, -1).reverse().map((response) => (
              <div key={response.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    {response.content_type}
                  </Badge>
                  <span className="text-xs text-white/60">
                    {new Date(response.generated_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-white/70 line-clamp-2">
                  {response.content.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
