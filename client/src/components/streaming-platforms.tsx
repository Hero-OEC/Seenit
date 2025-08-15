import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Platform {
  name: string;
  color: string;
  icon: string;
  contentCount: string;
  affiliateUrl: string;
}

const platforms: Platform[] = [
  {
    name: "Netflix",
    color: "bg-red-600",
    icon: "🎬",
    contentCount: "1,200+ titles",
    affiliateUrl: "https://netflix.com?ref=seenit"
  },
  {
    name: "Prime Video",
    color: "bg-blue-600",
    icon: "📺",
    contentCount: "800+ titles",
    affiliateUrl: "https://primevideo.com?ref=seenit"
  },
  {
    name: "Disney+",
    color: "bg-blue-500",
    icon: "✨",
    contentCount: "600+ titles",
    affiliateUrl: "https://disneyplus.com?ref=seenit"
  },
  {
    name: "HBO Max",
    color: "bg-purple-600",
    icon: "🎭",
    contentCount: "500+ titles",
    affiliateUrl: "https://hbomax.com?ref=seenit"
  },
  {
    name: "Hulu",
    color: "bg-green-600",
    icon: "📱",
    contentCount: "700+ titles",
    affiliateUrl: "https://hulu.com?ref=seenit"
  },
  {
    name: "Crunchyroll",
    color: "bg-orange-600",
    icon: "🔥",
    contentCount: "1,000+ anime",
    affiliateUrl: "https://crunchyroll.com?ref=seenit"
  }
];

export default function StreamingPlatforms() {
  const handlePlatformClick = (platform: Platform) => {
    // In a real app, this would track the affiliate click
    console.log(`Affiliate click tracked for ${platform.name}`);
    window.open(platform.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-12 bg-retro-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="font-retro text-3xl text-retro-main mb-8 text-center">
          Available on Your Favorite Platforms
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {platforms.map((platform) => (
            <Button
              key={platform.name}
              onClick={() => handlePlatformClick(platform)}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center group cursor-pointer h-auto flex flex-col items-center"
              variant="ghost"
              data-testid={`button-platform-${platform.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              <div className={`w-12 h-12 ${platform.color} rounded-xl mb-3 flex items-center justify-center text-white text-xl`}>
                {platform.icon}
              </div>
              <h4 className="font-semibold text-retro-dark group-hover:text-retro-main transition-colors mb-1">
                {platform.name}
              </h4>
              <p className="text-xs text-gray-600" data-testid={`text-${platform.name.toLowerCase()}-count`}>
                {platform.contentCount}
              </p>
              <ExternalLink className="h-3 w-3 text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-retro-dark text-sm">
            * Affiliate partnerships help us keep Seenit free for everyone
          </p>
        </div>
      </div>
    </section>
  );
}
