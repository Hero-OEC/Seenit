import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import Input from "@/components/Input";
import ContentDisplay from "@/components/ContentDisplay";
import seenitLogo from "@/assets/Seenit.svg";

interface NavbarProps {
  isSignedIn?: boolean;
  userName?: string;
  onGetStarted?: () => void;
  onWatchlist?: () => void;
  onSchedule?: () => void;
  onProfile?: () => void;
  onSignOut?: () => void;
  onSearch?: (query: string) => void;
}

export default function Navbar({ 
  isSignedIn = false, 
  userName = "John Doe",
  onGetStarted = () => { window.location.href = "/signin"; },
  onWatchlist = () => console.log("Watchlist clicked"),
  onSchedule = () => console.log("Schedule clicked"),
  onProfile = () => console.log("Profile clicked"),
  onSignOut = () => console.log("Sign out clicked"),
  onSearch = (query: string) => console.log(`Search: ${query}`)
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search suggestions query (lighter than full search)
  const { data: searchSuggestions = [], isLoading: isSearching } = useQuery<any[]>({
    queryKey: [`/api/content/search/suggestions?q=${encodeURIComponent(debouncedSearchQuery)}`],
    enabled: debouncedSearchQuery.length >= 3, // Increased to 3 characters for better accuracy
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  // Handle clicks outside search to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show/hide search results based on query and focus
  useEffect(() => {
    if (debouncedSearchQuery.length >= 3) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSearchResults(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    if (debouncedSearchQuery.length >= 3) {
      setShowSearchResults(true);
    }
  };

  const handleResultClick = (contentId: string) => {
    window.location.href = `/content/${contentId}`;
    setShowSearchResults(false);
    setSearchQuery("");
  };

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-retro-100 shadow-sm border-b border-retro-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img 
                src={seenitLogo} 
                alt="Seenit Logo" 
                className="h-12 w-auto max-w-[160px] object-contain"
                data-testid="seenit-logo"
              />
              <h1 className="font-headline text-2xl font-bold text-retro-950">
                Seenit
              </h1>
            </div>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isSignedIn ? (
              <>
                <Link href="/">
                  <span className={`font-headline text-sm transition-colors cursor-pointer ${
                    location === "/" ? "text-retro-600 font-semibold" : "text-retro-900 hover:text-retro-500"
                  }`} data-testid="nav-home">
                    Home
                  </span>
                </Link>
                <Link href="/watchlist">
                  <span className={`font-headline text-sm transition-colors cursor-pointer ${
                    location === "/watchlist" ? "text-retro-600 font-semibold" : "text-retro-900 hover:text-retro-500"
                  }`} data-testid="nav-watchlist">
                    Watchlist
                  </span>
                </Link>
                <Link href="/schedule">
                  <span className={`font-headline text-sm transition-colors cursor-pointer ${
                    location === "/schedule" ? "text-retro-600 font-semibold" : "text-retro-900 hover:text-retro-500"
                  }`} data-testid="nav-schedule">
                    Schedule
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/">
                  <span className={`font-headline text-sm transition-colors cursor-pointer ${
                    location === "/" ? "text-retro-600 font-semibold" : "text-retro-900 hover:text-retro-500"
                  }`} data-testid="nav-home-guest">
                    Home
                  </span>
                </Link>
                <Link href="/discover">
                  <span className={`font-headline text-sm transition-colors cursor-pointer ${
                    location === "/discover" ? "text-retro-600 font-semibold" : "text-retro-900 hover:text-retro-500"
                  }`} data-testid="nav-discover-guest">
                    Discover
                  </span>
                </Link>
                <Link href="/schedule">
                  <span className={`font-headline text-sm transition-colors cursor-pointer ${
                    location === "/schedule" ? "text-retro-600 font-semibold" : "text-retro-900 hover:text-retro-500"
                  }`} data-testid="nav-schedule-guest">
                    Schedule
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-[20rem] mx-6 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <Input
                type="text"
                placeholder="Search movies, TV shows, anime..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                className="bg-white/80 border-retro-300 focus:border-retro-500 focus:ring-retro-500"
                data-testid="navbar-search"
              />
            </form>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-retro-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-retro-600">
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-retro-300 border-t-retro-500 rounded-full"></div>
                    <span className="ml-2">Searching...</span>
                  </div>
                ) : searchSuggestions && searchSuggestions.length > 0 ? (
                  <div className="py-2">
                    {searchSuggestions.map((result: any) => (
                      <div key={result.id} className="px-2">
                        <ContentDisplay
                          id={result.id}
                          posterUrl={result.poster || `https://picsum.photos/300/450?random=${result.id}`}
                          title={result.title}
                          type={result.type}
                          status={mapStatusToContentStatus(result.status)}
                          year={result.year || undefined}
                          season={result.season || undefined}
                          size="list"
                          onClick={() => handleResultClick(result.id)}
                        />
                      </div>
                    ))}
                    <div className="px-4 py-2 text-xs text-retro-500 border-t border-retro-100">
                      Press Enter to see all results
                    </div>
                  </div>
                ) : debouncedSearchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-retro-600">
                    No results found for "{debouncedSearchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-retro-100 transition-colors"
              data-testid="mobile-menu-button"
            >
              <svg
                className="w-6 h-6 text-retro-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Right Side Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-retro-200">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <Input
                    type="text"
                    placeholder="Search movies, TV shows, anime..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    className="bg-white/80 border-retro-300 focus:border-retro-500 focus:ring-retro-500"
                    data-testid="mobile-navbar-search"
                  />
                </form>
                
                {/* Mobile Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-retro-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="p-4 text-center text-retro-600">
                        <div className="animate-spin inline-block w-4 h-4 border-2 border-retro-300 border-t-retro-500 rounded-full"></div>
                        <span className="ml-2">Searching...</span>
                      </div>
                    ) : searchSuggestions && searchSuggestions.length > 0 ? (
                      <div className="py-2">
                        {searchSuggestions.slice(0, 6).map((result: any) => (
                          <div key={result.id} className="px-2">
                            <ContentDisplay
                              id={result.id}
                              posterUrl={result.poster || `https://picsum.photos/300/450?random=${result.id}`}
                              title={result.title}
                              type={result.type}
                              status={mapStatusToContentStatus(result.status)}
                              year={result.year || undefined}
                              season={result.season || undefined}
                              size="list"
                              onClick={() => handleResultClick(result.id)}
                            />
                          </div>
                        ))}
                        {searchSuggestions.length > 6 && (
                          <div className="px-4 py-2 text-xs text-retro-500 border-t border-retro-100">
                            Showing first 6 results. Press Enter to see all results.
                          </div>
                        )}
                      </div>
                    ) : debouncedSearchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-retro-600">
                        No results found for "{debouncedSearchQuery}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Mobile Navigation */}
              <div className="space-y-3">
                {isSignedIn ? (
                  <>
                    <button
                      onClick={() => { window.location.href = "/"; setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-nav-home"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => { window.location.href = "/watchlist"; setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-nav-watchlist"
                    >
                      Watchlist
                    </button>
                    <button
                      onClick={() => { window.location.href = "/schedule"; setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-nav-schedule-signed-in"
                    >
                      Schedule
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { window.location.href = "/"; setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-nav-home-guest"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => { window.location.href = "/discover"; setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-nav-discover-guest"
                    >
                      Discover
                    </button>
                  </>
                )}

                <button
                  onClick={() => { window.location.href = "/schedule"; setIsMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                  data-testid="mobile-nav-schedule"
                >
                  Schedule
                </button>

                {/* Mobile User Actions */}
                {isSignedIn ? (
                  <div className="pt-4 border-t border-retro-200 space-y-2">
                    <div className="flex items-center gap-2 py-2 px-3">
                      <div className="w-8 h-8 bg-retro-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {getUserInitials(userName)}
                      </div>
                      <span className="font-headline text-sm text-retro-900">{userName}</span>
                    </div>
                    <button
                      onClick={() => { onProfile && onProfile(); setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-profile"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { onSignOut && onSignOut(); setIsMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 px-3 font-headline text-sm text-retro-900 hover:bg-retro-100 rounded-lg transition-colors"
                      data-testid="mobile-sign-out"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-retro-200">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => { onGetStarted && onGetStarted(); setIsMobileMenuOpen(false); }}
                      className="w-full"
                      data-testid="mobile-get-started-button"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}