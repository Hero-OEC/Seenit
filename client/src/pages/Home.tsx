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
        
        {/* Additional homepage content can be added here */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <section className="text-center">
            <h2 className="text-3xl font-bold text-retro-900 mb-6">
              Track Your Entertainment
            </h2>
            <p className="text-lg text-retro-700 mb-8">
              Discover and keep track of movies, TV shows, and anime with Seenit's modern interface.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}