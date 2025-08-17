import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Tag } from "@/components/Tags";
import ContentDisplay from "@/components/ContentDisplay";
import { Calendar, Tv, Play } from "lucide-react";
import type { Content } from "@shared/schema";

type ContentType = "tv" | "anime";
type SortBy = "popular" | "new" | "reviews" | "air_date";

export default function Schedule() {
  const [activeContentType, setActiveContentType] = useState<ContentType>("tv");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("air_date");
  const [location] = useLocation();

  // Parse URL parameters to set initial content type
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const typeParam = urlParams.get('type');
    if (typeParam && ['tv', 'anime'].includes(typeParam)) {
      setActiveContentType(typeParam as ContentType);
    }
  }, [location]);

  const contentTypeConfig = {
    tv: {
      label: "TV Shows",
      icon: Tv,
      description: "Current and upcoming TV series"
    },
    anime: {
      label: "Anime",
      icon: Play,
      description: "Current and upcoming anime series"
    }
  };

  const sortOptions = [
    { value: "air_date", label: "Air Date" },
    { value: "popular", label: "Most Popular" },
    { value: "new", label: "Recently Added" },
    { value: "reviews", label: "Highest Rated" }
  ];

  // Fetch content data
  const { data: content = [], isLoading } = useQuery<Content[]>({
    queryKey: ['/api/content/type', activeContentType],
    enabled: true
  });

  // Get unique genres for the selected content type
  const genres = ["all", ...Array.from(new Set(
    content.flatMap((item) => item.genre || [])
  ))];

  // Filter and sort content
  const filteredAndSortedContent = content
    .filter((item) => {
      if (selectedGenre === "all") return true;
      return item.genre?.includes(selectedGenre);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "air_date":
          return (Number(b.year) || 0) - (Number(a.year) || 0);
        case "popular":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case "new":
          return b.id.localeCompare(a.id);
        case "reviews":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        default:
          return 0;
      }
    });

  // Mock episode data for demonstration
  const getEpisodeInfo = (item: Content) => {
    const currentSeason = Math.floor(Math.random() * 5) + 1;
    const totalSeasons = currentSeason + Math.floor(Math.random() * 3);
    const currentEpisode = Math.floor(Math.random() * 12) + 1;
    const totalEpisodes = currentEpisode + Math.floor(Math.random() * 8);
    const nextAirDate = new Date();
    nextAirDate.setDate(nextAirDate.getDate() + Math.floor(Math.random() * 14));
    
    return {
      currentSeason,
      totalSeasons,
      currentEpisode,
      totalEpisodes,
      nextAirDate: nextAirDate.toLocaleDateString(),
      status: Math.random() > 0.5 ? "Airing" : "Upcoming"
    };
  };

  return (
    <div className="min-h-screen bg-retro-50">
      <Navbar 
        isSignedIn={false}
        onGetStarted={() => console.log("Get started clicked")}
        onSchedule={() => window.location.href = "/schedule"}
        onSearch={(query: string) => console.log(`Search: ${query}`)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-retro-600" />
            <h1 className="text-4xl font-bold text-retro-900">Schedule</h1>
          </div>
          <p className="text-retro-600 text-lg">
            Keep track of your favorite shows and upcoming episodes
          </p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-retro-200 rounded-lg aspect-[16/9] mb-3"></div>
                      <div className="bg-retro-200 rounded h-4 mb-2"></div>
                      <div className="bg-retro-200 rounded h-3 w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredAndSortedContent.map((item) => {
                    const episodeInfo = getEpisodeInfo(item);
                    
                    return (
                      <ContentDisplay
                        key={item.id}
                        posterUrl={item.poster || `https://picsum.photos/300/450?random=${item.id}`}
                        title={item.title}
                        type={activeContentType as "tv" | "anime"}
                        status={episodeInfo.status === "Airing" ? "ongoing" : "coming-soon"}
                        season={episodeInfo.currentSeason}
                        episode={episodeInfo.currentEpisode}
                        onClick={() => console.log(`Clicked ${item.title}`)}
                        className="w-full"
                      />
                    );
                  })}
                </div>
              )}

              {!isLoading && filteredAndSortedContent.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-retro-400 mb-4">
                    <Calendar className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-retro-900 mb-2">No shows found</h3>
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
                    <span className="font-medium" data-testid="text-total-count">{content?.length || 0}</span>
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