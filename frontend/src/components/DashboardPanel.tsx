
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const DashboardPanel = () => {
  const mockAnalysis = {
    suggestedHashtags: ['#viral', '#trending', '#fyp', '#contentcreator', '#socialmedia'],
    caption: "🔥 This trend is absolutely taking off right now! Here's what you need to know...",
    engagement: { views: '2.3M', likes: '456K', shares: '23K' },
    confidence: 87
  };

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Content Analysis</h2>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {mockAnalysis.confidence}% Viral Potential
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Suggested Caption */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/80">Suggested Caption</h3>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-white text-sm leading-relaxed">{mockAnalysis.caption}</p>
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/80">Trending Hashtags</h3>
          <div className="flex flex-wrap gap-2">
            {mockAnalysis.suggestedHashtags.map((tag, index) => (
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
      </div>

      {/* Engagement Metrics */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-white/80 mb-4">Predicted Engagement</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{mockAnalysis.engagement.views}</div>
            <div className="text-xs text-white/60">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{mockAnalysis.engagement.likes}</div>
            <div className="text-xs text-white/60">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{mockAnalysis.engagement.shares}</div>
            <div className="text-xs text-white/60">Shares</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
