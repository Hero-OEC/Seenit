import { useState } from "react";
import Button from "@/components/Button";

interface NavbarProps {
  isSignedIn?: boolean;
  userName?: string;
  onGetStarted?: () => void;
  onHome?: () => void;
  onWatchlist?: () => void;
  onBrowse?: (type: string) => void;
  onSchedule?: () => void;
}

export default function Navbar({ 
  isSignedIn = false, 
  userName = "John Doe",
  onGetStarted = () => console.log("Get started clicked"),
  onHome = () => console.log("Home clicked"),
  onWatchlist = () => console.log("Watchlist clicked"),
  onBrowse = (type: string) => console.log(`Browse ${type} clicked`),
  onSchedule = () => console.log("Schedule clicked")
}: NavbarProps) {
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);

  const handleBrowseClick = () => {
    setIsBrowseOpen(!isBrowseOpen);
  };

  const handleBrowseItem = (type: string) => {
    setIsBrowseOpen(false);
    onBrowse(type);
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-retro-accent-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-retro-500 rounded-lg flex items-center justify-center">
              <span className="font-headline text-white text-lg">S</span>
            </div>
            <div>
              <h1 className="font-headline text-xl text-retro-900">Seenit</h1>
            </div>
          </div>

          {/* Navigation Menu */}
          {isSignedIn && (
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={onHome}
                className="font-headline text-retro-900 hover:text-retro-500 transition-colors"
                data-testid="nav-home"
              >
                Home
              </button>
              <button
                onClick={onWatchlist}
                className="font-headline text-retro-900 hover:text-retro-500 transition-colors"
                data-testid="nav-watchlist"
              >
                Watchlist
              </button>
              
              {/* Browse Dropdown */}
              <div className="relative">
                <button
                  onClick={handleBrowseClick}
                  className="flex items-center gap-1 font-headline text-retro-900 hover:text-retro-500 transition-colors"
                  data-testid="nav-browse"
                >
                  Browse
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isBrowseOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Browse Dropdown Menu */}
                {isBrowseOpen && (
                  <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={() => handleBrowseItem("Movies")}
                        className="w-full text-left px-4 py-2 text-sm font-headline text-retro-900 hover:bg-retro-200 transition-colors"
                        data-testid="browse-movies"
                      >
                        Movies
                      </button>
                      <button
                        onClick={() => handleBrowseItem("TV Shows")}
                        className="w-full text-left px-4 py-2 text-sm font-headline text-retro-900 hover:bg-retro-200 transition-colors"
                        data-testid="browse-tv"
                      >
                        TV Shows
                      </button>
                      <button
                        onClick={() => handleBrowseItem("Anime")}
                        className="w-full text-left px-4 py-2 text-sm font-headline text-retro-900 hover:bg-retro-200 transition-colors"
                        data-testid="browse-anime"
                      >
                        Anime
                      </button>
                    </div>
                  </div>
                )}

                {/* Backdrop to close dropdown when clicking outside */}
                {isBrowseOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBrowseOpen(false)}
                    data-testid="browse-backdrop"
                  />
                )}
              </div>

              <button
                onClick={onSchedule}
                className="font-headline text-retro-900 hover:text-retro-500 transition-colors"
                data-testid="nav-schedule"
              >
                Schedule
              </button>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              /* Signed In State */
              <div className="flex items-center gap-3">
                <span className="hidden sm:block font-headline text-retro-900">{userName}</span>
                <div className="w-8 h-8 bg-retro-500 rounded-full flex items-center justify-center">
                  <span className="font-headline text-white text-sm">
                    {getUserInitials(userName)}
                  </span>
                </div>
              </div>
            ) : (
              /* Not Signed In State */
              <div className="flex items-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onGetStarted}
                  data-testid="get-started-button"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}