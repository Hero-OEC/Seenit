import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Tag } from "@/components/Tags";
import ContentDisplay from "@/components/ContentDisplay";
import { Film, Tv, Star, Calendar, TrendingUp } from "lucide-react";
import SharinganIcon from "@/components/icons/SharinganIcon";
import type { Content } from "@shared/schema";

type ContentType = "movie" | "tv" | "anime";
type SortBy = "popular" | "new" | "reviews" | "release_date";

export default function Discover() {
  const [activeContentType, setActiveContentType] = useState<ContentType>("movie");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [location] = useLocation();

  // Parse URL parameters to set initial content type
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const typeParam = urlParams.get('type');
    if (typeParam && ['movie', 'tv', 'anime'].includes(typeParam)) {
      setActiveContentType(typeParam as ContentType);
    }
  }, [location]);

  const handleSearch = (query: string) => {
    console.log(`Search: ${query}`);
  };

  // Fetch content based on selected type
  const { data: content = [], isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content/type", activeContentType],
    enabled: true,
  });

  // Available genres for filtering
  const genres = [
    "all", "action", "adventure", "animation", "comedy", "crime", "documentary", 
    "drama", "family", "fantasy", "horror", "mystery", "romance", "sci-fi", 
    "thriller", "war", "western"
  ];

  // Filter and sort content
  const filteredAndSortedContent = content
    .filter((item) => {
      if (selectedGenre === "all") return true;
      return item.genre?.some(g => g.toLowerCase() === selectedGenre.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "new":
          return (b.year || 0) - (a.year || 0);
        case "release_date":
          return (b.year || 0) - (a.year || 0);
        case "reviews":
          return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
        case "popular":
        default:
          return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      }
    });

  const contentTypeConfig = {
    movie: { icon: Film, label: "Movies", color: "bg-blue-500" },
    tv: { icon: Tv, label: "TV Shows", color: "bg-green-500" },
    anime: { icon: SharinganIcon, label: "Anime", color: "bg-purple-500" }
  };

  const sortOptions = [
    { value: "popular", label: "Popular", icon: TrendingUp },
    { value: "new", label: "New", icon: Calendar },
    { value: "reviews", label: "Reviews", icon: Star },
    { value: "release_date", label: "Release Date", icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-retro-50">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-retro-900 mb-2">Discover</h1>
          <p className="text-retro-700">Find your next favorite movie, TV show, or anime</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Content Type Switches */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-retro-900 mb-4">Browse by Type</h2>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(contentTypeConfig) as [ContentType, typeof contentTypeConfig[ContentType]][]).map(([type, config]) => {
                  const IconComponent = config.icon;
                  const isActive = activeContentType === type;
                  
                  return (
                    <Button
                      key={type}
                      variant={isActive ? "default" : "outline"}
                      size="lg"
                      onClick={() => setActiveContentType(type)}
                      className={`flex items-center gap-2 ${
                        isActive 
                          ? "bg-retro-600 hover:bg-retro-700 text-white" 
                          : "border-retro-300 text-retro-700 hover:bg-retro-100 hover:text-retro-900"
                      }`}
                      data-testid={`button-content-type-${type}`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Content Grid */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-retro-900 mb-4 capitalize">
                {contentTypeConfig[activeContentType].label}
              </h2>
              
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-retro-200 rounded-lg aspect-[2/3] mb-3"></div>
                      <div className="bg-retro-200 rounded h-4 mb-2"></div>
                      <div className="bg-retro-200 rounded h-3 w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredAndSortedContent.map((item) => {
                    // Determine status based on item data
                    const getContentStatus = () => {
                      if (item.status === "airing") return "ongoing";
                      if (item.status === "upcoming") return "coming-soon";
                      if (item.status === "completed") return "finished";
                      return "finished"; // default fallback
                    };

                    return (
                      <ContentDisplay
                        key={item.id}
                        posterUrl={item.poster || `https://picsum.photos/300/450?random=${item.id}`}
                        title={item.title}
                        type={activeContentType}
                        status={getContentStatus()}
                        year={item.year || undefined}
                        season={activeContentType === "tv" || activeContentType === "anime" ? item.season || undefined : undefined}
                        size="small"
                        onClick={() => console.log(`Clicked on ${item.title}`)}
                        data-testid={`content-display-${item.id}`}
                      />
                    );
                  })}
                </div>
              )}

              {!isLoading && filteredAndSortedContent.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-retro-400 mb-4">
                    <Film className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-retro-900 mb-2">No content found</h3>
                  <p className="text-retro-600">Try adjusting your filters or check back later</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Filters */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border border-retro-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-retro-900 mb-4">Filters & Sort</h3>
              
              {/* Sort Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-retro-700 mb-2">Sort by</label>
                <Input
                  inputType="select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  options={sortOptions.map(option => ({ value: option.value, label: option.label }))}
                  data-testid="select-sort-by"
                />
              </div>

              {/* Genre Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-retro-700 mb-2">Genre</label>
                <Input
                  inputType="select"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  options={genres.map(genre => ({ 
                    value: genre, 
                    label: genre === "all" ? "All Genres" : genre.charAt(0).toUpperCase() + genre.slice(1) 
                  }))}
                  data-testid="select-genre"
                />
              </div>

              {/* Statistics */}
              <div className="mt-6 pt-6 border-t border-retro-200">
                <div className="text-sm text-retro-600">
                  <div className="flex justify-between mb-2">
                    <span>Total {contentTypeConfig[activeContentType].label.toLowerCase()}:</span>
                    <span className="font-medium" data-testid="text-total-count">{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Showing:</span>
                    <span className="font-medium" data-testid="text-filtered-count">{filteredAndSortedContent.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}