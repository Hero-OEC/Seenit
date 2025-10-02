import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import ContentDisplay from "@/components/ContentDisplay";
import EpisodeDisplay from "@/components/EpisodeDisplay";
import SidePanel, { type SidePanelItem } from "@/components/SidePanel";
import HomeContent from "@/components/HomeContent";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { groupAnimeIntoSeries, seriesToContentItems } from "@/lib/animeGrouping";
import type { Content } from "@shared/schema";

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

  // Fetch trending movies with trailers for hero section
  const { data: trendingMoviesWithTrailers } = useQuery<any[]>({
    queryKey: ["/api/content/trending-movies-with-trailers?limit=5"],
    enabled: !isSignedIn,
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

  // Fetch popular movies from database (sorted by rating)
  const { data: movieData } = useQuery<any>({
    queryKey: ["/api/content/type/movie?limit=6&sort=popular"],
    enabled: true,
  });
  const popularMovies = movieData?.content || [];

  // Fetch new movie releases (sorted by release date)
  const { data: newMovieData } = useQuery<any>({
    queryKey: ["/api/content/type/movie?limit=8&sort=new"],
    enabled: true,
  });
  const newMovies = newMovieData?.content || [];

  // Fetch popular TV shows from database (sorted by rating)
  const { data: tvData } = useQuery<any>({
    queryKey: ["/api/content/type/tv?limit=6&sort=popular"],
    enabled: true,
  });
  const popularTVShows = tvData?.content || [];

  // Fetch popular anime from database (sorted by rating)
  const { data: animeData } = useQuery<any>({
    queryKey: ["/api/content/type/anime?limit=12&sort=popular"], // Fetch more to account for series grouping
    enabled: true,
  });
  const rawAnimeData = animeData?.content || [];
  
  // Group anime by series and get representative items
  const groupedAnimeSeries = groupAnimeIntoSeries(rawAnimeData);
  const popularAnime = seriesToContentItems(groupedAnimeSeries).slice(0, 6);

  // Fetch recent episodes from database
  const { data: newEpisodes = [] } = useQuery<any[]>({
    queryKey: ["/api/content/recent-episodes"],
    enabled: true,
  });

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
    posterUrl: item.poster || "/api/placeholder/300/450",
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
        {!isSignedIn && trendingMoviesWithTrailers && trendingMoviesWithTrailers.length > 0 && (
          <HeroSection
            movies={trendingMoviesWithTrailers.map(movie => ({
              id: movie.id,
              title: movie.title,
              description: movie.overview || "An exciting entertainment experience waiting for you.",
              year: movie.year,
              rating: movie.rating ? `${movie.rating.toFixed(1)}/10` : "Not Rated",
              duration: movie.runtime ? `${movie.runtime}m` : "N/A",
              genres: movie.genres || [],
              platforms: movie.streamingPlatforms || [],
              trailerKey: movie.trailerKey,
              posterUrl: movie.poster || movie.backdrop || "/api/placeholder/500/750",
              backdropUrl: movie.backdrop || movie.poster || "/api/placeholder/1920/1080"
            }))}
            onAddToList={() => navigate("/signin")}
            onViewDetails={(movieId) => navigate(`/content/${movieId}`)}
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
                  title="Action Picks"
                  items={[
                    // Mix content from different genres based on what user watches
                    ...popularMovies.filter(movie => 
                      movie.genres?.some((g: string) => g.toLowerCase().includes("action"))
                    ).slice(0, 2),
                    ...popularAnime.filter(anime => 
                      anime.genres?.some((g: string) => g.toLowerCase().includes("action") || g.toLowerCase().includes("adventure"))
                    ).slice(0, 2)
                  ].map((item, index) => ({
                    id: item.id,
                    posterUrl: item.poster || "/api/placeholder/300/450",
                    title: item.title,
                    type: item.type,
                    year: item.year,
                    season: item.season
                  }))}
                  variant="recommended"
                  width="w-full"
                  onItemClick={(item) => navigate(`/content/${item.id}`)}
                  maxItems={4}
                />
              </aside>

              {/* Main Content */}
              <main className="flex-1 space-y-12">
                {/* New Movies Section */}
                <HomeContent
                  title="New Movies"
                  items={newMovies.map(movie => ({
                    id: movie.id,
                    posterUrl: movie.poster,
                    title: movie.title,
                    type: movie.type,
                    status: movie.status,
                    year: movie.year
                  }))}
                  contentType="movie"
                  onViewAll={() => handleBrowse("Movies")}
                  onItemClick={(movie) => navigate(`/content/${movie.id}`)}
                  maxItems={8}
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
                    {newEpisodes.filter((ep: any) => ep.type === "tv").slice(0, 3).map((episode: any) => (
                      <EpisodeDisplay
                        key={episode.id}
                        thumbnailUrl={episode.image?.medium || "/api/placeholder/120/180"}
                        showTitle={episode.showTitle || episode.title}
                        episodeTitle={episode.name || episode.episodeTitle}
                        type={episode.type}
                        status={episode.status}
                        season={episode.season}
                        episode={episode.number || episode.episode}
                        duration={episode.runtime || episode.duration}
                        onClick={() => navigate(`/content/${episode.contentId || episode.id}`)}
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
                    {newEpisodes.filter((ep: any) => ep.type === "anime").slice(0, 3).map((episode: any) => (
                      <EpisodeDisplay
                        key={episode.id}
                        thumbnailUrl={episode.image?.medium || "/api/placeholder/120/180"}
                        showTitle={episode.showTitle || episode.title}
                        episodeTitle={episode.name || episode.episodeTitle}
                        type={episode.type}
                        status={episode.status}
                        season={episode.season}
                        episode={episode.number || episode.episode}
                        duration={episode.runtime || episode.duration}
                        onClick={() => navigate(`/content/${episode.contentId || episode.id}`)}
                      />
                    ))}
                  </div>
                </section>

                {/* Genre-based Recommendations */}
                <HomeContent
                  title="Sci-Fi Recommendations"
                  items={[
                    ...popularMovies.filter(movie => 
                      movie.genres?.some((g: string) => g.toLowerCase().includes("sci-fi") || g.toLowerCase().includes("science"))
                    ).slice(0, 3).map(movie => ({
                      id: movie.id,
                      posterUrl: movie.poster,
                      title: movie.title,
                      type: movie.type,
                      status: movie.status,
                      year: movie.year
                    })),
                    ...popularAnime.filter(anime => 
                      anime.genres?.some((g: string) => g.toLowerCase().includes("sci-fi") || g.toLowerCase().includes("science"))
                    ).slice(0, 3).map(anime => ({
                      id: anime.id,
                      posterUrl: anime.poster,
                      title: anime.title,
                      type: anime.type,
                      status: anime.status,
                      year: anime.year,
                      season: anime.season,
                      episode: anime.episode
                    }))
                  ]}
                  contentType="genre"
                  onViewAll={() => navigate("/discover?genre=sci-fi")}
                  onItemClick={(item) => navigate(`/content/${item.id}`)}
                  maxItems={6}
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
            items={popularMovies.map(movie => ({
              id: movie.id,
              posterUrl: movie.poster,
              title: movie.title,
              type: movie.type,
              status: movie.status,
              year: movie.year
            }))}
            contentType="movie"
            onViewAll={() => handleBrowse("Movies")}
            onItemClick={(item) => navigate(`/content/${item.id}`)}
            variant="expanded"
            testId="popular-movies-section"
          />

          {/* Popular TV Shows Section */}
          <HomeContent
            title="Popular TV Shows"
            items={popularTVShows.map(show => ({
              id: show.id,
              posterUrl: show.poster,
              title: show.title,
              type: show.type,
              status: show.status,
              year: show.year,
              season: show.season,
              episode: show.episode
            }))}
            contentType="tv"
            onViewAll={() => handleBrowse("TV Shows")}
            onItemClick={(show) => navigate(`/content/${show.id}`)}
            variant="expanded"
            testId="popular-tv-section"
          />

          {/* Popular Anime Section */}
          <HomeContent
            title="Popular Anime"
            items={popularAnime.map(anime => ({
              id: anime.id,
              posterUrl: anime.poster,
              title: anime.title,
              type: anime.type,
              status: anime.status,
              year: anime.year,
              season: anime.season,
              episode: anime.episode
            }))}
            contentType="anime"
            onViewAll={() => handleBrowse("Anime")}
            onItemClick={(item) => navigate(`/content/${item.id}`)}
            variant="expanded"
            testId="popular-anime-section"
          />

          {/* Trending Action & Adventure - Mixed Content */}
          {[...popularMovies, ...popularTVShows, ...popularAnime].filter(item => 
            item.genres?.some((g: string) => 
              g.toLowerCase().includes("action") || g.toLowerCase().includes("adventure")
            )
          ).length > 0 && (
            <HomeContent
              title="Trending Action & Adventure"
              items={[...popularMovies, ...popularTVShows, ...popularAnime]
                .filter(item => 
                  item.genres?.some((g: string) => 
                    g.toLowerCase().includes("action") || g.toLowerCase().includes("adventure")
                  )
                )
                .slice(0, 6)
                .map(item => ({
                  id: item.id,
                  posterUrl: item.poster,
                  title: item.title,
                  type: item.type,
                  status: item.status,
                  year: item.year,
                  season: item.season,
                  episode: item.episode
                }))}
              contentType="mixed"
              onViewAll={() => navigate("/discover?genre=action")}
              onItemClick={(item) => navigate(`/content/${item.id}`)}
              variant="expanded"
              testId="action-adventure-section"
            />
          )}

          {/* New Episodes Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-retro-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-retro-900">New Episodes</h2>
              <button 
                className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                onClick={handleSchedule}
                data-testid="view-all-episodes"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4 p-1" data-testid="new-episodes-list">
              {newEpisodes.slice(0, 4).map((episode: any) => (
                <EpisodeDisplay
                  key={episode.id || `${episode.contentId}-${episode.season}-${episode.number}`}
                  thumbnailUrl={episode.image?.medium || "/api/placeholder/120/180"}
                  showTitle={episode.showTitle || episode.title}
                  episodeTitle={episode.name}
                  type={episode.type}
                  status={episode.status}
                  season={episode.season}
                  episode={episode.number}
                  duration={episode.runtime}
                  onClick={() => navigate(`/content/${episode.contentId}`)}
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