import { useQuery } from "@tanstack/react-query";
import { Eye, Play, Bookmark, Star } from "lucide-react";

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-1";

interface UserStats {
  watched: number;
  watching: number;
  watchlist: number;
  avgRating: string;
}

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/users", MOCK_USER_ID, "stats"],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl p-6 text-center shadow-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-3"></div>
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const statsData = [
    {
      icon: Eye,
      value: stats?.watched || 0,
      label: "Watched",
      bgColor: "bg-retro-secondary",
      testId: "stat-watched"
    },
    {
      icon: Play,
      value: stats?.watching || 0,
      label: "Watching",
      bgColor: "bg-retro-accent",
      testId: "stat-watching"
    },
    {
      icon: Bookmark,
      value: stats?.watchlist || 0,
      label: "Watchlist",
      bgColor: "bg-retro-secondary",
      testId: "stat-watchlist"
    },
    {
      icon: Star,
      value: stats?.avgRating || "0.0",
      label: "Avg Rating",
      bgColor: "bg-retro-accent",
      testId: "stat-rating"
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statsData.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.label}
                className={`${stat.bgColor} rounded-2xl p-6 text-center shadow-lg`}
                data-testid={stat.testId}
              >
                <IconComponent className="h-8 w-8 text-retro-main mx-auto mb-3" />
                <div className="text-2xl font-bold text-retro-dark">{stat.value}</div>
                <div className="text-sm text-retro-dark font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
