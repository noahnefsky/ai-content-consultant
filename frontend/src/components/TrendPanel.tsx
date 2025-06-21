
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const TrendPanel = () => {
  const viralTrends = [
    {
      id: 1,
      title: "Day in My Life as a Creator",
      platform: "TikTok",
      views: "5.2M",
      engagement: "12.3%",
      hashtags: ["#dayinmylife", "#creator", "#morning"],
      description: "Authentic behind-the-scenes content showing daily routines"
    },
    {
      id: 2,
      title: "Quick Recipe Hacks",
      platform: "Instagram",
      views: "3.8M",
      engagement: "8.7%",
      hashtags: ["#recipe", "#cooking", "#lifehack"],
      description: "Fast-paced cooking tips that save time and money"
    },
    {
      id: 3,
      title: "Industry Insights Thread",
      platform: "LinkedIn",
      views: "892K",
      engagement: "15.2%",
      hashtags: ["#leadership", "#business", "#insights"],
      description: "Professional advice and industry observations"
    }
  ];

  const platformColors = {
    TikTok: "from-pink-500 to-red-500",
    Instagram: "from-purple-500 to-pink-500",
    LinkedIn: "from-blue-600 to-blue-700",
    Twitter: "from-blue-400 to-blue-500"
  };

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">Viral Trends</h2>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          Updated 2h ago
        </Badge>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {viralTrends.map((trend) => (
            <Card
              key={trend.id}
              className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className={`bg-gradient-to-r ${platformColors[trend.platform as keyof typeof platformColors]} text-white border-0`}
                >
                  {trend.platform}
                </Badge>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{trend.views}</div>
                  <div className="text-xs text-white/60">views</div>
                </div>
              </div>

              <h3 className="font-semibold text-white mb-2">{trend.title}</h3>
              <p className="text-sm text-white/70 mb-3 line-clamp-2">{trend.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {trend.hashtags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-white/20 text-white/60"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-green-400 font-medium">
                  {trend.engagement} engagement
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                >
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
