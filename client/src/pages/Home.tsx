import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import ContentDisplay from "@/components/ContentDisplay";
import EpisodeDisplay from "@/components/EpisodeDisplay";
import SidePanel, { type SidePanelItem } from "@/components/SidePanel";
import HomeContent from "@/components/HomeContent";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Home() {
  const { isSignedIn, user, signOut } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user data when signed in
  const { data: currentlyWatching } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "content/status/watching"],
    enabled: !!user?.id && isSignedIn,
  });

  const { data: recommendedContent } = useQuery<any[]>({
    queryKey: ["/api/content", "recommended"],
    enabled: !!user?.id && isSignedIn,
  });

  const handleGetStarted = () => {
    navigate("/signin");
  };

  const handleBrowse = (type: string) => {
    const typeMap: Record<string, string> = {
      "Movies": "movie",
      "TV Shows": "tv", 
      "Anime": "anime"
    };
    const typeParam = typeMap[type] || type.toLowerCase();
    window.location.href = `/discover?type=${typeParam}`;
  };

  const handleSchedule = () => {
    window.location.href = "/schedule";
  };

  const handleSearch = (query: string) => {
    console.log(`Search: ${query}`);
  };

  // Sample content data with placeholder images
  const popularMovies = [
    {
      id: "1",
      posterUrl: "https://picsum.photos/300/450?random=1",
      title: "Dune: Part Two",
      type: "movie" as const,
      status: "finished" as const,
      year: 2024
    },
    {
      id: "2", 
      posterUrl: "https://picsum.photos/300/450?random=2",
      title: "Oppenheimer",
      type: "movie" as const,
      status: "finished" as const,
      year: 2023
    },
    {
      id: "3",
      posterUrl: "https://picsum.photos/300/450?random=3",
      title: "Spider-Man: Across the Spider-Verse",
      type: "movie" as const,
      status: "finished" as const,
      year: 2023
    },
    {
      id: "4",
      posterUrl: "https://picsum.photos/300/450?random=4",
      title: "The Menu",
      type: "movie" as const,
      status: "finished" as const,
      year: 2022
    },
    {
      id: "5",
      posterUrl: "https://picsum.photos/300/450?random=5",
      title: "Black Panther: Wakanda Forever",
      type: "movie" as const,
      status: "finished" as const,
      year: 2022
    },
    {
      id: "6",
      posterUrl: "https://picsum.photos/300/450?random=6",
      title: "Top Gun: Maverick",
      type: "movie" as const,
      status: "finished" as const,
      year: 2022
    }
  ];

  const popularTVShows = [
    {
      id: "2",
      posterUrl: "https://picsum.photos/300/450?random=7",
      title: "Mystery Series",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 3
    },
    {
      id: "tv2",
      posterUrl: "https://picsum.photos/300/450?random=8",
      title: "The Bear",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 3
    },
    {
      id: "tv3",
      posterUrl: "https://picsum.photos/300/450?random=9",
      title: "Avatar: The Last Airbender",
      type: "tv" as const,
      status: "finished" as const,
      season: 1
    },
    {
      id: "tv4",
      posterUrl: "https://picsum.photos/300/450?random=10",
      title: "Stranger Things",
      type: "tv" as const,
      status: "finished" as const,
      season: 4
    },
    {
      id: "tv5",
      posterUrl: "https://picsum.photos/300/450?random=11",
      title: "Wednesday",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 1
    },
    {
      id: "tv6",
      posterUrl: "https://picsum.photos/300/450?random=12",
      title: "The Last of Us",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 1
    }
  ];

  const popularAnime = [
    {
      id: "3",
      posterUrl: "https://picsum.photos/300/450?random=13",
      title: "Adventure Quest",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 2,
      episode: 12
    },
    {
      id: "anime2",
      posterUrl: "https://picsum.photos/300/450?random=14",
      title: "Demon Slayer",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 4,
      episode: 8
    },
    {
      id: "anime3",
      posterUrl: "https://picsum.photos/300/450?random=15",
      title: "Jujutsu Kaisen",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 2,
      episode: 23
    },
    {
      id: "anime4",
      posterUrl: "https://picsum.photos/300/450?random=16",
      title: "My Hero Academia",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 7,
      episode: 18
    },
    {
      id: "anime5",
      posterUrl: "https://picsum.photos/300/450?random=17",
      title: "One Piece",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 21,
      episode: 1090
    },
    {
      id: "anime6",
      posterUrl: "https://picsum.photos/300/450?random=18",
      title: "Spirited Away",
      type: "anime" as const,
      status: "finished" as const
    }
  ];

  // Sample episode data
  const newEpisodes = [
    {
      id: "ep1",
      thumbnailUrl: "https://picsum.photos/120/180?random=19",
      showTitle: "House of the Dragon",
      episodeTitle: "The Red Dragon and the Gold",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 2,
      episode: 4,
      duration: 68
    },
    {
      id: "ep2", 
      thumbnailUrl: "https://picsum.photos/120/180?random=20",
      showTitle: "Demon Slayer",
      episodeTitle: "The Hashira Training Arc Begins",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 4,
      episode: 8,
      duration: 24
    },
    {
      id: "ep3",
      thumbnailUrl: "https://picsum.photos/120/180?random=21",
      showTitle: "The Bear",
      episodeTitle: "Tomorrow",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 3,
      episode: 9,
      duration: 42
    },
    {
      id: "ep4",
      thumbnailUrl: "https://picsum.photos/120/180?random=22",
      showTitle: "Jujutsu Kaisen",
      episodeTitle: "The Shibuya Incident - Gate Close",
      type: "anime" as const,
      status: "ongoing" as const,
      season: 2,
      episode: 23,
      duration: 24
    }
  ];

  // Transform currently watching data for SidePanel
  const currentlyWatchingSidePanelItems: SidePanelItem[] = (currentlyWatching || []).map(item => ({
    id: item.content?.id || item.id,
    posterUrl: item.content?.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
    title: item.content?.title || "Unknown Title",
    type: item.content?.type || "movie",
    year: item.content?.year || undefined,
    season: item.content?.season || undefined,
    episode: undefined
  })).filter(item => item.title !== "Unknown Title");

  // Transform recommended content for SidePanel
  const recommendedSidePanelItems: SidePanelItem[] = (recommendedContent || popularMovies.slice(0, 4)).map(item => ({
    id: item.id,
    posterUrl: item.posterUrl || item.poster || `https://picsum.photos/300/450?random=${item.id}`,
    title: item.title,
    type: item.type,
    year: item.year || undefined,
    season: item.season || undefined,
    episode: item.episode || undefined
  }));

  const handleWatchlistAction = (itemId: string, action: string) => {
    console.log(`Watchlist action for ${itemId}: ${action}`);
  };

  return (
    <div className="min-h-screen bg-retro-50 relative">
      <main>
        {/* Show hero section only when not signed in */}
        {!isSignedIn && (
          <HeroSection
            content={{
              id: "featured-movie",
              title: "Dune: Part Two",
              description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
              year: 2024,
              rating: "PG-13",
              duration: "2h 46m",
              genres: ["Sci-Fi", "Adventure", "Drama"],
              platforms: ["HBO Max", "Prime Video", "Apple TV+", "Vudu"],
              trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
            }}
            onAddToList={() => console.log("Add to Watchlist clicked!")}
            onViewDetails={() => console.log("View Details clicked!")}
          />
        )}
        
        {/* Signed-in user layout */}
        {isSignedIn && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Sidebar - Currently Watching & Genres */}
              <aside className="lg:w-64 flex-shrink-0 space-y-6">
                <SidePanel
                  title="Currently Watching"
                  items={currentlyWatchingSidePanelItems}
                  variant="currently-watching"
                  width="w-full"
                  onItemClick={(item) => navigate(`/content/${item.id}`)}
                  onWatchlistAction={handleWatchlistAction}
                  maxItems={6}
                />

                {/* Genre-based Recommendations from User's Watching History */}
                <SidePanel
                  title="Your Genres"
                  items={[
                    // Mix content from different genres based on what user watches
                    ...popularMovies.filter(movie => 
                      movie.title.includes("Action") || 
                      movie.title.includes("Dune") || 
                      movie.title.includes("Spider-Man")
                    ).slice(0, 2),
                    ...popularAnime.filter(anime => 
                      anime.title.includes("Adventure") ||
                      anime.title.includes("Demon")
                    ).slice(0, 2)
                  ].map(item => ({
                    id: item.id,
                    posterUrl: item.posterUrl,
                    title: item.title,
                    type: item.type,
                    year: (item as any).year,
                    season: (item as any).season
                  }))}
                  variant="recommended"
                  width="w-full"
                  genreTags={["Action", "Adventure", "Drama"]}
                  onItemClick={(item) => navigate(`/content/${item.id}`)}
                  onGenreClick={(genre) => navigate(`/discover?genre=${genre.toLowerCase()}`)}
                  maxItems={4}
                />
              </aside>

              {/* Main Content */}
              <main className="flex-1 space-y-12">
                {/* New Movies Section */}
                <HomeContent
                  title="New Movies"
                  items={popularMovies}
                  contentType="movie"
                  onViewAll={() => handleBrowse("Movies")}
                  onItemClick={(movie) => console.log(`Clicked movie: ${movie.title}`)}
                  maxItems={4}
                  variant="compact"
                />

                {/* New TV Episodes Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-retro-900">New TV Episodes</h2>
                    <button 
                      className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                      onClick={() => handleBrowse("TV Shows")}
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {newEpisodes.filter(ep => ep.type === "tv").slice(0, 3).map((episode) => (
                      <EpisodeDisplay
                        key={episode.id}
                        thumbnailUrl={episode.thumbnailUrl}
                        showTitle={episode.showTitle}
                        episodeTitle={episode.episodeTitle}
                        type={episode.type}
                        status={episode.status}
                        season={episode.season}
                        episode={episode.episode}
                        duration={episode.duration}
                        onClick={() => console.log(`Clicked episode: ${episode.episodeTitle}`)}
                      />
                    ))}
                  </div>
                </section>

                {/* New Anime Episodes Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-retro-900">New Anime Episodes</h2>
                    <button 
                      className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                      onClick={() => handleBrowse("Anime")}
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {newEpisodes.filter(ep => ep.type === "anime").slice(0, 3).map((episode) => (
                      <EpisodeDisplay
                        key={episode.id}
                        thumbnailUrl={episode.thumbnailUrl}
                        showTitle={episode.showTitle}
                        episodeTitle={episode.episodeTitle}
                        type={episode.type}
                        status={episode.status}
                        season={episode.season}
                        episode={episode.episode}
                        duration={episode.duration}
                        onClick={() => console.log(`Clicked episode: ${episode.episodeTitle}`)}
                      />
                    ))}
                  </div>
                </section>

                {/* Genre-based Recommendations */}
                <HomeContent
                  title="Sci-Fi Recommendations"
                  items={[...popularMovies.slice(0, 2), ...popularAnime.slice(0, 2)]}
                  contentType="genre"
                  onViewAll={() => navigate("/discover?genre=sci-fi")}
                  onItemClick={(item) => console.log(`Clicked: ${item.title}`)}
                  maxItems={4}
                  variant="compact"
                  testId="sci-fi-recommendations-section"
                />
              </main>

              {/* Right Sidebar - Recommended for You */}
              <aside className="lg:w-64 flex-shrink-0">
                <SidePanel
                  title="Recommended for You"
                  items={recommendedSidePanelItems}
                  variant="recommended"
                  width="w-full"
                  genreTags={["Action", "Adventure", "Sci-Fi"]}
                  onItemClick={(item) => navigate(`/content/${item.id}`)}
                  onGenreClick={(genre) => navigate(`/discover?genre=${genre.toLowerCase()}`)}
                  maxItems={6}
                />
              </aside>
            </div>
          </div>
        )}
        
        {/* Content sections below hero - only show for non-signed-in users */}
        {!isSignedIn && (
        <div className="bg-retro-50">
          {/* Popular Movies Section */}
          <HomeContent
            title="Popular Movies"
            items={popularMovies}
            contentType="movie"
            onViewAll={() => console.log("View all movies clicked")}
            onItemClick={(movie) => console.log(`Clicked movie: ${movie.title}`)}
            variant="expanded"
            testId="popular-movies-section"
          />

          {/* Popular TV Shows Section */}
          <HomeContent
            title="Popular TV Shows"
            items={popularTVShows}
            contentType="tv"
            onViewAll={() => console.log("View all TV shows clicked")}
            onItemClick={(show) => console.log(`Clicked TV show: ${show.title}`)}
            variant="expanded"
            testId="popular-tv-section"
          />

          {/* Popular Anime Section */}
          <HomeContent
            title="Popular Anime"
            items={popularAnime}
            contentType="anime"
            onViewAll={() => console.log("View all anime clicked")}
            onItemClick={(anime) => console.log(`Clicked anime: ${anime.title}`)}
            variant="expanded"
            testId="popular-anime-section"
          />

          {/* New Episodes Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-retro-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-retro-900">New Episodes</h2>
              <button 
                className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                data-testid="view-all-episodes"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4 p-1" data-testid="new-episodes-list">
              {newEpisodes.map((episode) => (
                <EpisodeDisplay
                  key={episode.id}
                  thumbnailUrl={episode.thumbnailUrl}
                  showTitle={episode.showTitle}
                  episodeTitle={episode.episodeTitle}
                  type={episode.type}
                  status={episode.status}
                  season={episode.season}
                  episode={episode.episode}
                  duration={episode.duration}
                  onClick={() => console.log(`Clicked episode: ${episode.episodeTitle}`)}
                />
              ))}
            </div>
          </section>

          {/* Welcome Section for New Users */}
          <section className="bg-retro-100 py-16">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-retro-900 mb-6">
                Track Your Entertainment Journey
              </h2>
              <p className="text-lg text-retro-700 mb-8 max-w-2xl mx-auto">
                Join thousands of users who organize their watchlists, discover new content, 
                and never miss an episode with Seenit's intuitive tracking system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleGetStarted}
                  className="bg-retro-500 hover:bg-retro-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  data-testid="cta-get-started"
                >
                  Get Started Free
                </button>
                <button 
                  onClick={() => handleBrowse('movies')}
                  className="border border-retro-300 hover:border-retro-500 text-retro-700 hover:text-retro-900 px-8 py-3 rounded-lg font-medium transition-colors"
                  data-testid="cta-browse"
                >
                  Browse Content
                </button>
              </div>
            </div>
          </section>
        </div>
        )}
      </main>
    </div>
  );
}