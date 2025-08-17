import { HeroSection } from "@/components/HeroSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  const handleGetStarted = () => {
    console.log("Get started clicked");
  };

  const handleBrowse = (type: string) => {
    console.log(`Browse ${type} clicked`);
  };

  const handleSchedule = () => {
    console.log("Schedule clicked");
  };

  const handleSearch = (query: string) => {
    console.log(`Search: ${query}`);
  };

  return (
    <div className="min-h-screen bg-retro-50 overflow-x-hidden">
      <Navbar
        isSignedIn={false}
        onGetStarted={handleGetStarted}
        onBrowse={handleBrowse}
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
              {/* Movie cards will be populated here */}
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[2/3] bg-retro-200 rounded-lg mb-3 overflow-hidden group-hover:shadow-lg transition-shadow">
                    <div className="w-full h-full bg-gradient-to-br from-retro-300 to-retro-500 flex items-center justify-center">
                      <span className="text-retro-50 font-medium">Movie {i + 1}</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-retro-900 text-sm truncate">Popular Movie Title</h3>
                  <p className="text-retro-600 text-xs">2024</p>
                </div>
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
              {/* TV show cards will be populated here */}
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[2/3] bg-retro-200 rounded-lg mb-3 overflow-hidden group-hover:shadow-lg transition-shadow">
                    <div className="w-full h-full bg-gradient-to-br from-retro-400 to-retro-600 flex items-center justify-center">
                      <span className="text-retro-50 font-medium">TV {i + 1}</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-retro-900 text-sm truncate">Popular TV Show</h3>
                  <p className="text-retro-600 text-xs">Season 3</p>
                </div>
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
              {/* Anime cards will be populated here */}
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[2/3] bg-retro-200 rounded-lg mb-3 overflow-hidden group-hover:shadow-lg transition-shadow">
                    <div className="w-full h-full bg-gradient-to-br from-retro-500 to-retro-700 flex items-center justify-center">
                      <span className="text-retro-50 font-medium">Anime {i + 1}</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-retro-900 text-sm truncate">Popular Anime Title</h3>
                  <p className="text-retro-600 text-xs">Episode 24</p>
                </div>
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
            <div className="space-y-4" data-testid="new-episodes-list">
              {/* Episode cards will be populated here */}
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-16 h-24 bg-retro-300 rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-retro-50 text-xs font-medium">EP</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-retro-900 truncate">Show Name - Episode {i + 1}</h3>
                    <p className="text-retro-600 text-sm mt-1">Season 2, Episode {i + 5}</p>
                    <p className="text-retro-500 text-xs mt-2">Released 2 days ago</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-retro-400 text-sm">42min</span>
                  </div>
                </div>
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