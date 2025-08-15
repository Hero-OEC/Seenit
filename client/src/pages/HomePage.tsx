import { useState } from "react";
import { Link } from "wouter";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All" },
    { id: "movies", label: "Movies" },
    { id: "tv", label: "TV Shows" },
    { id: "anime", label: "Anime" }
  ];

  return (
    <div className="min-h-screen bg-retro-bg">
      {/* Header */}
      <header className="bg-retro-cream shadow-sm border-b-2 border-retro-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-retro-main rounded-lg flex items-center justify-center">
                <span className="font-retro text-white text-lg">S</span>
              </div>
              <div>
                <h1 className="font-retro text-2xl text-retro-dark">Seenit</h1>
                <p className="text-sm text-gray-600">Track what you've seen</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" data-testid="link-home" className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
                Home
              </Link>
              <Link href="/components" data-testid="link-components" className="px-3 py-1 bg-retro-accent hover:bg-orange-600 text-white rounded text-sm">
                Components
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="font-retro text-4xl text-retro-main mb-4">
            Welcome to Seenit
          </h2>
          <p className="text-xl text-retro-dark mb-8">
            Your personal entertainment tracker for movies, TV shows, and anime
          </p>
          <button 
            className="px-6 py-3 bg-retro-main hover:bg-orange-600 text-white rounded-lg text-lg font-medium"
            data-testid="button-get-started"
          >
            Get Started
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-retro-cream rounded-lg p-4 shadow-sm mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-3 py-1 rounded text-sm ${
                  selectedCategory === category.id 
                    ? "bg-retro-main text-white" 
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`tab-${category.id}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-retro-cream rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow" data-testid="card-watchlist">
            <h3 className="font-semibold text-xl text-retro-dark mb-3">My Watchlist</h3>
            <p className="text-gray-600 mb-4">
              Keep track of what you want to watch next
            </p>
            <button 
              className="px-3 py-1 bg-retro-accent hover:bg-orange-600 text-white rounded text-sm"
              data-testid="button-view-watchlist"
            >
              View Watchlist
            </button>
          </div>

          <div className="bg-retro-cream rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow" data-testid="card-watching">
            <h3 className="font-semibold text-xl text-retro-dark mb-3">Currently Watching</h3>
            <p className="text-gray-600 mb-4">
              Track your progress on ongoing series
            </p>
            <button 
              className="px-3 py-1 bg-retro-accent hover:bg-orange-600 text-white rounded text-sm"
              data-testid="button-view-watching"
            >
              View Progress
            </button>
          </div>

          <div className="bg-retro-cream rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow" data-testid="card-completed">
            <h3 className="font-semibold text-xl text-retro-dark mb-3">Completed</h3>
            <p className="text-gray-600 mb-4">
              See everything you've finished watching
            </p>
            <button 
              className="px-3 py-1 bg-retro-accent hover:bg-orange-600 text-white rounded text-sm"
              data-testid="button-view-completed"
            >
              View Completed
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-retro-cream rounded-lg p-6 shadow-sm" data-testid="card-recent-activity">
          <h3 className="font-semibold text-xl text-retro-dark mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity yet. Start tracking your entertainment!</p>
              <button 
                className="px-4 py-2 bg-retro-main hover:bg-orange-600 text-white rounded mt-4"
                data-testid="button-add-first-item"
              >
                Add Your First Item
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-retro-cream border-t-2 border-retro-main mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 bg-retro-main rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="font-retro text-white text-sm">S</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Built with ❤️ for entertainment enthusiasts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}