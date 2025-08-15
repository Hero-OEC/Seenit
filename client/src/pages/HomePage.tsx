import { useState } from "react";
import { Link } from "wouter";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Logo from "@/components/Logo";

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
              <Logo size="medium" />
              <div>
                <h1 className="font-retro text-2xl text-retro-dark">Seenit</h1>
                <p className="text-sm text-gray-600">Track what you've seen</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" data-testid="link-home">
                <Button variant="secondary" size="sm">Home</Button>
              </Link>
              <Link href="/components" data-testid="link-components">
                <Button variant="accent" size="sm">Components</Button>
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
          <Button variant="primary" size="lg" data-testid="button-get-started">
            Get Started
          </Button>
        </div>

        {/* Category Tabs */}
        <Card className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`tab-${category.id}`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card hover data-testid="card-watchlist">
            <h3 className="font-semibold text-xl text-retro-dark mb-3">My Watchlist</h3>
            <p className="text-gray-600 mb-4">
              Keep track of what you want to watch next
            </p>
            <Button variant="accent" size="sm" data-testid="button-view-watchlist">
              View Watchlist
            </Button>
          </Card>

          <Card hover data-testid="card-watching">
            <h3 className="font-semibold text-xl text-retro-dark mb-3">Currently Watching</h3>
            <p className="text-gray-600 mb-4">
              Track your progress on ongoing series
            </p>
            <Button variant="accent" size="sm" data-testid="button-view-watching">
              View Progress
            </Button>
          </Card>

          <Card hover data-testid="card-completed">
            <h3 className="font-semibold text-xl text-retro-dark mb-3">Completed</h3>
            <p className="text-gray-600 mb-4">
              See everything you've finished watching
            </p>
            <Button variant="accent" size="sm" data-testid="button-view-completed">
              View Completed
            </Button>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card data-testid="card-recent-activity">
          <h3 className="font-semibold text-xl text-retro-dark mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity yet. Start tracking your entertainment!</p>
              <Button variant="primary" className="mt-4" data-testid="button-add-first-item">
                Add Your First Item
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-retro-cream border-t-2 border-retro-main mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Logo size="small" />
            <p className="text-sm text-gray-600 mt-2">
              Built with ❤️ for entertainment enthusiasts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}