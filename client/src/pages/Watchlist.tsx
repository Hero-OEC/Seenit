import { useQuery } from "@tanstack/react-query";
import ContentDisplay from "@/components/ContentDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

interface UserContentItem {
  id: string;
  userId: string;
  contentId: string;
  status: string;
  progress: number | null;
  userRating: number | null;
  addedAt: string;
  updatedAt: string;
  content: {
    id: string;
    title: string;
    type: "movie" | "tv" | "anime";
    year: number | null;
    rating: string | null;
    genre: string[] | null;
    poster: string | null;
    overview: string | null;
    status: string | null;
    episodes: number | null;
    season: number | null;
    totalSeasons: number | null;
  } | null;
}

export default function Watchlist() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not authenticated
  if (!user) {
    navigate("/signin");
    return null;
  }

  // Fetch currently watching content
  const { data: currentlyWatching, isLoading: isLoadingWatching } = useQuery<UserContentItem[]>({
    queryKey: ["/api/users", user.id, "content/status/watching"],
    enabled: !!user?.id,
  });

  // Fetch want to watch content
  const { data: wantToWatch, isLoading: isLoadingWantToWatch } = useQuery<UserContentItem[]>({
    queryKey: ["/api/users", user.id, "content/status/want_to_watch"],
    enabled: !!user?.id,
  });

  const handleContentClick = (contentId: string) => {
    navigate(`/content/${contentId}`);
  };

  const mapStatusToContentStatus = (status: string | null) => {
    switch (status) {
      case "airing":
        return "ongoing" as const;
      case "completed":
        return "finished" as const;
      case "upcoming":
        return "coming-soon" as const;
      default:
        return "finished" as const;
    }
  };

  const renderContentSection = (
    title: string,
    items: UserContentItem[] | undefined,
    isLoading: boolean,
    emptyMessage: string
  ) => (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-retro-900 mb-6">{title}</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-retro-200 rounded-lg aspect-[2/3] animate-pulse"
              data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-skeleton-${i}`}
            />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-12 bg-retro-100 rounded-lg">
          <div className="text-retro-500 text-lg mb-2" data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-empty-icon`}>
            📺
          </div>
          <p className="text-retro-700 mb-4" data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-empty-message`}>
            {emptyMessage}
          </p>
          <button
            onClick={() => navigate("/discover")}
            className="bg-retro-500 hover:bg-retro-600 text-white px-6 py-2 rounded-lg transition-colors"
            data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-browse-button`}
          >
            Browse Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-grid`}>
          {items.map((item) => (
            item.content && (
              <ContentDisplay
                key={item.id}
                id={item.content.id}
                posterUrl={item.content.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450"}
                title={item.content.title}
                type={item.content.type}
                status={mapStatusToContentStatus(item.content.status)}
                year={item.content.year || undefined}
                season={item.content.season || undefined}
                onClick={() => handleContentClick(item.content!.id)}
              />
            )
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-retro-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-retro-900 mb-2" data-testid="watchlist-title">
            My Watchlist
          </h1>
          <p className="text-retro-700" data-testid="watchlist-description">
            Track your entertainment journey and never miss what's next
          </p>
        </div>

        {/* Currently Watching Section */}
        {renderContentSection(
          "Currently Watching",
          currentlyWatching,
          isLoadingWatching,
          "You're not currently watching anything. Start something new!"
        )}

        {/* Want to Watch Section */}
        {renderContentSection(
          "Want to Watch",
          wantToWatch,
          isLoadingWantToWatch,
          "Your watchlist is empty. Add some content to get started!"
        )}
      </main>
    </div>
  );
}