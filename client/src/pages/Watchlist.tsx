import { useQuery } from "@tanstack/react-query";
import ContentDisplay from "@/components/ContentDisplay";
import SidePanel, { type SidePanelItem } from "@/components/SidePanel";
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

  const handleWatchlistAction = (itemId: string, action: string) => {
    console.log(`Watchlist action for ${itemId}: ${action}`);
    // TODO: Implement watchlist update logic
  };

  // Transform currentlyWatching data for SidePanel
  const currentlyWatchingSidePanelItems: SidePanelItem[] = (currentlyWatching || []).map(item => ({
    id: item.content?.id || item.id,
    posterUrl: item.content?.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
    title: item.content?.title || "Unknown Title",
    type: item.content?.type || "movie",
    year: item.content?.year || undefined,
    season: item.content?.season || undefined,
    episode: undefined // You can add episode tracking if needed
  })).filter(item => item.title !== "Unknown Title");

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-grid`}>
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
                size="default"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Layout with Sidebar and Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            {isLoadingWatching ? (
              <div className="bg-retro-200 rounded-lg h-96 animate-pulse" data-testid="currently-watching-skeleton" />
            ) : (
              <SidePanel
                title="Currently Watching"
                items={currentlyWatchingSidePanelItems}
                variant="currently-watching"
                width="w-full"
                onItemClick={(item) => navigate(`/content/${item.id}`)}
                onWatchlistAction={handleWatchlistAction}
                maxItems={10}
              />
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Want to Watch Section */}
            {renderContentSection(
              "Want to Watch",
              wantToWatch,
              isLoadingWantToWatch,
              "Your watchlist is empty. Add some content to get started!"
            )}
          </main>
        </div>
      </div>
    </div>
  );
}