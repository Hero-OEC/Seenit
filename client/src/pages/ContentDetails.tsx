import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Play, ExternalLink, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Content } from "@shared/schema";
import Navbar from "@/components/Navbar";

export default function ContentDetails() {
  const [, params] = useRoute("/content/:id");
  const [selectedWatchlistStatus, setSelectedWatchlistStatus] = useState<string>("Add to Watchlist");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${params?.id}`],
    enabled: !!params?.id,
  });

  const handleSearch = (query: string) => {
    console.log(`Search: ${query}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-retro-50">
        <Navbar onSearch={handleSearch} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-retro-500 mx-auto mb-4"></div>
            <p className="text-retro-700">Loading content details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-retro-50">
        <Navbar onSearch={handleSearch} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-retro-900 mb-4">Content Not Found</h1>
            <p className="text-retro-700 mb-6">The content you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const getTypeBadgeColor = (contentType: string) => {
    switch (contentType) {
      case "movie":
        return "bg-indigo-500 text-white border-indigo-600";
      case "tv":
        return "bg-emerald-500 text-white border-emerald-600";
      case "anime":
        return "bg-violet-500 text-white border-violet-600";
      default:
        return "bg-slate-500 text-white border-slate-600";
    }
  };

  const getStatusBadgeColor = (contentStatus: string) => {
    switch (contentStatus) {
      case "upcoming":
        return "bg-amber-500 text-white border-amber-600";
      case "airing":
        return "bg-lime-500 text-white border-lime-600";
      case "completed":
        return "bg-neutral-500 text-white border-neutral-600";
      case "canceled":
        return "bg-rose-500 text-white border-rose-600";
      default:
        return "bg-neutral-500 text-white border-neutral-600";
    }
  };

  const getStatusLabel = (contentStatus: string) => {
    switch (contentStatus) {
      case "upcoming":
        return "Coming Soon";
      case "airing":
        return "Ongoing";
      case "completed":
        return "Finished";
      case "canceled":
        return "Canceled";
      default:
        return contentStatus;
    }
  };

  const getTypeLabel = (contentType: string) => {
    switch (contentType) {
      case "movie":
        return "Movie";
      case "tv":
        return "TV Show";
      case "anime":
        return "Anime";
      default:
        return contentType;
    }
  };

  const formatYearRange = () => {
    if (content.type === "movie") {
      return content.year?.toString() || "";
    }
    
    if (content.year) {
      if (content.status === "airing") {
        return `${content.year} - Ongoing`;
      } else if (content.endYear && content.endYear !== content.year) {
        return `${content.year} - ${content.endYear}`;
      } else {
        return content.year.toString();
      }
    }
    
    return "";
  };

  const watchlistOptions = [
    { value: "want_to_watch", label: "Want to Watch" },
    { value: "watching", label: "Currently Watching" },
    { value: "watched", label: "Watched" },
  ];

  const handleWatchlistAction = (status: string) => {
    const option = watchlistOptions.find(opt => opt.value === status);
    if (option) {
      setSelectedWatchlistStatus(option.label);
      // TODO: Add API call to update user's watchlist
      console.log(`Added to watchlist with status: ${status}`);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-retro-50">
      <Navbar onSearch={handleSearch} />

      {/* Content Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Poster and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Poster */}
              <div className="aspect-[2/3] w-64 mx-auto rounded-lg overflow-hidden bg-retro-100 shadow-lg mb-6">
                <img
                  src={content.poster || "/api/placeholder/400/600"}
                  alt={`${content.title} poster`}
                  className="w-full h-full object-cover"
                  data-testid="content-details-poster"
                />
              </div>

              {/* Watchlist Button with Dropdown */}
              <div className="relative mb-4 w-64 mx-auto">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-6 py-3 bg-retro-500 text-white rounded-lg hover:bg-retro-600 transition-colors font-medium shadow-md"
                  data-testid="watchlist-button"
                >
                  <span>{selectedWatchlistStatus}</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-retro-200 z-10">
                    {watchlistOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleWatchlistAction(option.value)}
                        className="w-full px-6 py-3 text-left hover:bg-retro-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        data-testid={`watchlist-option-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Streaming Platforms */}
              {content.streamingPlatforms && content.streamingPlatforms.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-md w-64 mx-auto">
                  <h3 className="font-semibold text-retro-900 mb-3">Watch On</h3>
                  <div className="space-y-2">
                    {content.streamingPlatforms.map((platform, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center justify-between px-4 py-2 border border-retro-300 rounded-lg hover:bg-retro-50 transition-colors"
                        data-testid={`platform-${platform.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span className="font-medium">{platform}</span>
                        <ExternalLink className="w-4 h-4 text-retro-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            {/* Title and Year */}
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-retro-900 mb-2" data-testid="content-details-title">
                {content.title}
              </h1>
              {formatYearRange() && (
                <p className="text-xl text-retro-600 font-medium" data-testid="content-details-year">
                  {formatYearRange()}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span 
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeBadgeColor(content.type)}`}
                data-testid="content-details-type-badge"
              >
                {getTypeLabel(content.type)}
              </span>
              {content.status && (
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(content.status)}`}
                  data-testid="content-details-status-badge"
                >
                  {getStatusLabel(content.status)}
                </span>
              )}
              {content.genre && content.genre.map((g, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-retro-100 text-retro-800 border border-retro-200"
                  data-testid={`genre-badge-${g.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Ratings */}
            {(content.imdbRating || content.rottenTomatoesRating || content.rating) && (
              <div className="flex flex-wrap gap-6 mb-6">
                {content.imdbRating && (
                  <div className="flex items-center gap-2" data-testid="imdb-rating">
                    <span className="font-semibold text-retro-900">IMDb:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{content.imdbRating}/10</span>
                    </div>
                  </div>
                )}
                {content.rottenTomatoesRating && (
                  <div className="flex items-center gap-2" data-testid="rotten-tomatoes-rating">
                    <span className="font-semibold text-retro-900">Rotten Tomatoes:</span>
                    <span className="font-medium">{content.rottenTomatoesRating}%</span>
                  </div>
                )}
                {content.rating && !content.imdbRating && (
                  <div className="flex items-center gap-2" data-testid="general-rating">
                    <span className="font-semibold text-retro-900">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{content.rating}/10</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Synopsis */}
            {content.overview && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-retro-900 mb-4">Synopsis</h2>
                <p className="text-retro-700 leading-relaxed text-lg" data-testid="content-synopsis">
                  {content.overview}
                </p>
              </div>
            )}

            {/* Seasons and Episodes Section */}
            {(content.type === "tv" || content.type === "anime") && (content.episodes || content.totalSeasons) && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-2xl font-bold text-retro-900 mb-4">Seasons & Episodes</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {content.totalSeasons && (
                    <div className="text-center p-4 bg-retro-50 rounded-lg">
                      <div className="text-2xl font-bold text-retro-900" data-testid="total-seasons">
                        {content.totalSeasons}
                      </div>
                      <div className="text-sm text-retro-600 font-medium">
                        {content.totalSeasons === 1 ? "Season" : "Seasons"}
                      </div>
                    </div>
                  )}
                  {content.episodes && (
                    <div className="text-center p-4 bg-retro-50 rounded-lg">
                      <div className="text-2xl font-bold text-retro-900" data-testid="total-episodes">
                        {content.episodes}
                      </div>
                      <div className="text-sm text-retro-600 font-medium">
                        {content.episodes === 1 ? "Episode" : "Episodes"}
                      </div>
                    </div>
                  )}
                  {content.season && (
                    <div className="text-center p-4 bg-retro-50 rounded-lg">
                      <div className="text-2xl font-bold text-retro-900" data-testid="current-season">
                        {content.season}
                      </div>
                      <div className="text-sm text-retro-600 font-medium">Current Season</div>
                    </div>
                  )}
                  {content.status === "airing" && (
                    <div className="text-center p-4 bg-lime-50 rounded-lg border border-lime-200">
                      <div className="text-2xl font-bold text-lime-700">
                        <Play className="w-6 h-6 mx-auto" />
                      </div>
                      <div className="text-sm text-lime-600 font-medium">Now Airing</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}