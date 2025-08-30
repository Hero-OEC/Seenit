import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Filter, Search, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import ContentDisplay from "@/components/ContentDisplay";

type ContentType = "movie" | "tv" | "anime";

interface ContentTypeConfig {
  label: string;
  colors: {
    bg: string;
    text: string;
    border: string;
  };
}

const contentTypeConfig: Record<ContentType, ContentTypeConfig> = {
  movie: {
    label: "Movies",
    colors: {
      bg: "bg-blue-100",
      text: "text-blue-800", 
      border: "border-blue-300"
    }
  },
  tv: {
    label: "TV Shows",
    colors: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300"
    }
  },
  anime: {
    label: "Anime",
    colors: {
      bg: "bg-purple-100", 
      text: "text-purple-800",
      border: "border-purple-300"
    }
  }
};

const genreOptions = {
  movie: ["Action", "Adventure", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller"],
  tv: ["Action", "Comedy", "Drama", "Reality", "Documentary", "News", "Talk Show", "Game Show"],
  anime: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Slice of Life", "Supernatural"]
};

export default function SearchResults() {
  const [location] = useLocation();
  const [activeContentType, setActiveContentType] = useState<ContentType>("tv");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Extract search query from URL params
  const searchParams = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
  const searchQuery = searchParams.get('q') || '';
  
  // Search results query
  const { data: searchResults = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/content/search", searchQuery],
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter results by active content type
  const filteredResults = searchResults.filter(item => item.type === activeContentType);
  
  // Apply additional filters (genre, sorting)
  const finalResults = filteredResults
    .filter(item => {
      if (selectedGenre === "all") return true;
      return item.genres && item.genres.some((genre: string) => 
        genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (!searchQuery) {
    return (
      <div className="min-h-screen bg-retro-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-retro-400 mb-4" />
            <h1 className="text-3xl font-bold text-retro-900 mb-2">Search Results</h1>
            <p className="text-retro-600">No search query provided</p>
            <Link href="/discover">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Discover
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/discover">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-retro-900">Search Results</h1>
              <p className="text-retro-700">
                Found {finalResults.length} results for "{searchQuery}"
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Content Type Switches */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-retro-900 mb-4">Browse by Type</h2>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(contentTypeConfig) as ContentType[]).map((type) => {
                  const config = contentTypeConfig[type];
                  const isActive = activeContentType === type;
                  const typeResults = searchResults.filter(item => item.type === type);
                  
                  return (
                    <Button
                      key={type}
                      variant={isActive ? "default" : "outline"}
                      className={`relative ${isActive ? 'bg-retro-600 hover:bg-retro-700' : 'hover:bg-retro-100'}`}
                      onClick={() => {
                        setActiveContentType(type);
                        setSelectedGenre("all"); // Reset genre when switching types
                      }}
                      data-testid={`content-type-${type}`}
                    >
                      {config.label}
                      {typeResults.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {typeResults.length}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Results Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-retro-900 capitalize">
                  {contentTypeConfig[activeContentType].label} Results
                </h2>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Loading state */}
              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-retro-200 rounded-lg aspect-[2/3] mb-3"></div>
                      <div className="bg-retro-200 rounded h-4 mb-2"></div>
                      <div className="bg-retro-200 rounded h-3 w-3/4"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {!isLoading && finalResults.length > 0 && (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  : "space-y-4"
                }>
                  {finalResults.map((item) => {
                    const getContentStatus = () => {
                      if (item.status === "airing") return "ongoing";
                      if (item.status === "upcoming") return "coming-soon";
                      if (item.status === "completed") return "finished";
                      return "finished";
                    };

                    return (
                      <ContentDisplay
                        key={item.id}
                        id={item.id}
                        posterUrl={item.poster || `https://picsum.photos/300/450?random=${item.id}`}
                        title={item.title}
                        type={activeContentType}
                        status={getContentStatus()}
                        year={item.year || undefined}
                        season={activeContentType === "tv" || activeContentType === "anime" ? item.season || undefined : undefined}
                        totalSeasons={activeContentType === "tv" ? item.totalSeasons || undefined : undefined}
                        size={viewMode === "grid" ? "small" : "list"}
                        onClick={() => console.log(`Clicked on ${item.title}`)}
                        data-testid={`search-result-${item.id}`}
                      />
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {!isLoading && finalResults.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 mx-auto text-retro-400 mb-4" />
                  <h3 className="text-xl font-semibold text-retro-800 mb-2">
                    No {contentTypeConfig[activeContentType].label.toLowerCase()} found
                  </h3>
                  <p className="text-retro-600 mb-4">
                    No {contentTypeConfig[activeContentType].label.toLowerCase()} match your search for "{searchQuery}"
                  </p>
                  <p className="text-retro-600">Try adjusting your search or check back later</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Filters */}
          <div className="lg:w-80">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="w-5 h-5 text-retro-600" />
                  <h3 className="text-lg font-semibold text-retro-900">Filters & Sort</h3>
                </div>

                <div className="space-y-6">
                  {/* Genre Filter */}
                  <div>
                    <label className="block text-sm font-medium text-retro-900 mb-2">
                      Genre
                    </label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger data-testid="select-genre">
                        <SelectValue placeholder="All genres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genres</SelectItem>
                        {genreOptions[activeContentType].map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-retro-900 mb-2">
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger data-testid="select-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="year">Most Recent</SelectItem>
                        <SelectItem value="title">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Stats */}
                  <div className="pt-4 border-t border-retro-200">
                    <h4 className="text-sm font-medium text-retro-900 mb-2">Search Statistics</h4>
                    <div className="space-y-2 text-sm text-retro-600">
                      <div className="flex justify-between">
                        <span>Total Results:</span>
                        <span className="font-medium">{searchResults.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Movies:</span>
                        <span className="font-medium">{searchResults.filter(r => r.type === 'movie').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TV Shows:</span>
                        <span className="font-medium">{searchResults.filter(r => r.type === 'tv').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anime:</span>
                        <span className="font-medium">{searchResults.filter(r => r.type === 'anime').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}