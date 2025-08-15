import { useState } from "react";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import Input from "@/components/Input";
import seenitLogo from "@/assets/Seenit.svg";

interface NavbarProps {
  isSignedIn?: boolean;
  userName?: string;
  onGetStarted?: () => void;
  onHome?: () => void;
  onWatchlist?: () => void;
  onBrowse?: (type: string) => void;
  onSchedule?: () => void;
  onProfile?: () => void;
  onSignOut?: () => void;
  onSearch?: (query: string) => void;
}

export default function Navbar({ 
  isSignedIn = false, 
  userName = "John Doe",
  onGetStarted = () => console.log("Get started clicked"),
  onHome = () => console.log("Home clicked"),
  onWatchlist = () => console.log("Watchlist clicked"),
  onBrowse = (type: string) => console.log(`Browse ${type} clicked`),
  onSchedule = () => console.log("Schedule clicked"),
  onProfile = () => console.log("Profile clicked"),
  onSignOut = () => console.log("Sign out clicked"),
  onSearch = (query: string) => console.log(`Search: ${query}`)
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
          <div className="flex items-center">
            <img 
              src={seenitLogo} 
              alt="Seenit Logo" 
              className="h-10 w-auto object-contain"
              data-testid="seenit-logo"
            />
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isSignedIn ? (
              <>
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
              </>
            ) : (
              <>
                <button
                  onClick={() => onGetStarted && onGetStarted()}
                  className="font-headline text-retro-900 hover:text-retro-500 transition-colors"
                  data-testid="nav-home-guest"
                >
                  Home
                </button>
                <button
                  onClick={() => onGetStarted && onGetStarted()}
                  className="font-headline text-retro-900 hover:text-retro-500 transition-colors"
                  data-testid="nav-discover-guest"
                >
                  Discover
                </button>
              </>
            )}
              
              {/* Browse Dropdown */}
              <Dropdown
                trigger={
                  <span className="flex items-center gap-1 font-headline text-retro-900 hover:text-retro-500 transition-colors">
                    Browse
                    <svg
                      className="w-4 h-4 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                }
                options={[
                  {
                    value: "movies",
                    label: "Movies",
                    onClick: () => onBrowse("Movies")
                  },
                  {
                    value: "tv-shows", 
                    label: "TV Shows",
                    onClick: () => onBrowse("TV Shows")
                  },
                  {
                    value: "anime",
                    label: "Anime", 
                    onClick: () => onBrowse("Anime")
                  }
                ]}
                placement="left"
              />

            <button
              onClick={isSignedIn ? onSchedule : () => onGetStarted && onGetStarted()}
              className="font-headline text-retro-900 hover:text-retro-500 transition-colors"
              data-testid="nav-schedule"
            >
              Schedule
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit}>
              <Input
                type="text"
                placeholder="Search movies, TV shows, anime..."
                value={searchQuery}
                onChange={handleSearchChange}
                inputSize="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                className="bg-white/80 border-retro-300 focus:border-retro-500 focus:ring-retro-500"
                data-testid="navbar-search"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              /* Signed In State */
              <Dropdown
                trigger={
                  <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-retro-500 rounded-full flex items-center justify-center">
                      <span className="font-headline text-white text-sm">
                        {getUserInitials(userName)}
                      </span>
                    </div>
                    <span className="hidden sm:block font-headline text-retro-900 text-sm">{userName}</span>
                  </div>
                }
                options={[
                  {
                    value: "profile",
                    label: "Profile",
                    onClick: onProfile
                  },
                  {
                    value: "sign-out",
                    label: "Sign Out",
                    onClick: onSignOut
                  }
                ]}
                placement="right"
              />
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