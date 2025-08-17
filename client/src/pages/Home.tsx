import { HeroSection } from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import ContentDisplay from "@/components/ContentDisplay";
import EpisodeDisplay from "@/components/EpisodeDisplay";

export default function Home() {
  const handleGetStarted = () => {
    console.log("Get started clicked");
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
      status: "finished" as const
    },
    {
      id: "2", 
      posterUrl: "https://picsum.photos/300/450?random=2",
      title: "Oppenheimer",
      type: "movie" as const,
      status: "finished" as const
    },
    {
      id: "3",
      posterUrl: "https://picsum.photos/300/450?random=3",
      title: "Spider-Man: Across the Spider-Verse",
      type: "movie" as const,
      status: "finished" as const
    },
    {
      id: "4",
      posterUrl: "https://picsum.photos/300/450?random=4",
      title: "The Menu",
      type: "movie" as const,
      status: "finished" as const
    },
    {
      id: "5",
      posterUrl: "https://picsum.photos/300/450?random=5",
      title: "Black Panther: Wakanda Forever",
      type: "movie" as const,
      status: "finished" as const
    },
    {
      id: "6",
      posterUrl: "https://picsum.photos/300/450?random=6",
      title: "Top Gun: Maverick",
      type: "movie" as const,
      status: "finished" as const
    }
  ];

  const popularTVShows = [
    {
      id: "tv1",
      posterUrl: "https://picsum.photos/300/450?random=7",
      title: "House of the Dragon",
      type: "tv" as const,
      status: "ongoing" as const,
      season: 2
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
      id: "anime1",
      posterUrl: "https://picsum.photos/300/450?random=13",
      title: "Attack on Titan",
      type: "anime" as const,
      status: "finished" as const,
      season: 4,
      episode: 28
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

  return (
    <div className="min-h-screen bg-retro-50 relative">
      <Navbar
        isSignedIn={false}
        onGetStarted={handleGetStarted}
        onSchedule={handleSchedule}
        onSearch={handleSearch}
      />
      
      <main>
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
        
        {/* Content sections below hero */}
        <div className="bg-retro-50">
          {/* Popular Movies Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-retro-900">Popular Movies</h2>
              <button 
                className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                data-testid="view-all-movies"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="popular-movies-grid">
              {popularMovies.map((movie) => (
                <ContentDisplay
                  key={movie.id}
                  posterUrl={movie.posterUrl}
                  title={movie.title}
                  type={movie.type}
                  status={movie.status}
                  onClick={() => console.log(`Clicked movie: ${movie.title}`)}
                />
              ))}
            </div>
          </section>

          {/* Popular TV Shows Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-retro-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-retro-900">Popular TV Shows</h2>
              <button 
                className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                data-testid="view-all-tv"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="popular-tv-grid">
              {popularTVShows.map((show) => (
                <ContentDisplay
                  key={show.id}
                  posterUrl={show.posterUrl}
                  title={show.title}
                  type={show.type}
                  status={show.status}
                  season={show.season}
                  onClick={() => console.log(`Clicked TV show: ${show.title}`)}
                />
              ))}
            </div>
          </section>

          {/* Popular Anime Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-retro-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-retro-900">Popular Anime</h2>
              <button 
                className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
                data-testid="view-all-anime"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="popular-anime-grid">
              {popularAnime.map((anime) => (
                <ContentDisplay
                  key={anime.id}
                  posterUrl={anime.posterUrl}
                  title={anime.title}
                  type={anime.type}
                  status={anime.status}
                  season={anime.season}
                  episode={anime.episode}
                  onClick={() => console.log(`Clicked anime: ${anime.title}`)}
                />
              ))}
            </div>
          </section>

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
      </main>
    </div>
  );
}