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

  // Function to generate sample episodes for demonstration
  const generateSampleEpisodes = (content: Content) => {
    const episodeCount = Math.min(content.episodes || 10, 10); // Show max 10 episodes
    const currentSeason = content.season || 1;
    
    const episodeTitles = [
      "The Beginning", "Shadows of the Past", "Revelations", "The Hunt Begins", 
      "Unexpected Allies", "Betrayal", "The Truth Unveiled", "Final Confrontation", 
      "New Horizons", "The End of an Era"
    ];

    return Array.from({ length: episodeCount }, (_, i) => ({
      number: i + 1,
      title: episodeTitles[i] || `Episode ${i + 1}`,
      description: `An intense episode that continues the storyline with unexpected twists and character development. The stakes are higher than ever as our protagonists face new challenges.`,
      duration: content.type === "anime" ? Math.floor(Math.random() * 5) + 22 : Math.floor(Math.random() * 10) + 42,
      airDate: new Date(2024, 0, 15 + (i * 7)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: (8.0 + Math.random() * 1.5).toFixed(1),
      watched: i < 3 // Mark first 3 episodes as watched for demo
    }));
  };

  // Function to get recommended content based on current content
  const getRecommendedContent = (currentContent: Content) => {
    // Sample recommended content based on type and genre
    const allRecommendations = [
      {
        id: "rec1",
        title: "Dark Mysteries",
        type: "tv",
        year: 2023,
        genre: ["Mystery", "Thriller"],
        rating: "8.7",
        poster: null
      },
      {
        id: "rec2", 
        title: "Action Chronicles",
        type: "movie",
        year: 2024,
        genre: ["Action", "Adventure"],
        rating: "8.2",
        poster: null
      },
      {
        id: "rec3",
        title: "Cyber Anime",
        type: "anime",
        year: 2023,
        genre: ["Sci-Fi", "Action"],
        rating: "9.1",
        poster: null
      },
      {
        id: "rec4",
        title: "Romance Heights",
        type: "movie",
        year: 2024,
        genre: ["Romance", "Drama"],
        rating: "7.9",
        poster: null
      },
      {
        id: "rec5",
        title: "Space Odyssey",
        type: "tv",
        year: 2023,
        genre: ["Sci-Fi", "Adventure"],
        rating: "8.5",
        poster: null
      },
      {
        id: "rec6",
        title: "Horror Nights",
        type: "movie",
        year: 2024,
        genre: ["Horror", "Thriller"],
        rating: "7.6",
        poster: null
      },
      {
        id: "rec7",
        title: "Comedy Central",
        type: "tv",
        year: 2023,
        genre: ["Comedy", "Drama"],
        rating: "8.3",
        poster: null
      },
      {
        id: "rec8",
        title: "Fantasy Quest",
        type: "anime",
        year: 2024,
        genre: ["Fantasy", "Adventure"],
        rating: "8.8",
        poster: null
      }
    ];

    // Filter and sort recommendations based on shared genres
    const currentGenres = currentContent.genre || [];
    const scored = allRecommendations
      .filter(item => item.id !== currentContent.id)
      .map(item => {
        const sharedGenres = item.genre.filter(g => currentGenres.includes(g)).length;
        const typeMatch = item.type === currentContent.type ? 1 : 0;
        return {
          ...item,
          score: sharedGenres * 2 + typeMatch
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return scored;
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
                  <div className="flex items-center gap-3" data-testid="imdb-rating">
                    {/* IMDb Logo */}
                    <svg className="w-12 h-6" viewBox="0 0 64 32" fill="none">
                      <rect width="64" height="32" rx="4" fill="#F5C518"/>
                      <text x="32" y="20" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#000">IMDb</text>
                    </svg>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-lg">{content.imdbRating}/10</span>
                    </div>
                  </div>
                )}
                {content.rottenTomatoesRating && (
                  <div className="flex items-center gap-3" data-testid="rotten-tomatoes-rating">
                    {/* Rotten Tomatoes Logo */}
                    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="16" fill="#FA320A"/>
                      <path d="M16 6c-1.5 0-3 .5-4 1.5l-2-2c-.5-.5-1.5-.5-2 0s-.5 1.5 0 2l2 2C9.5 11 9 12.5 9 14c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1.5-.5-3-1.5-4l2-2c.5-.5.5-1.5 0-2s-1.5-.5-2 0l-2 2C18 6.5 16.5 6 16 6z" fill="#FFFFFF"/>
                      <circle cx="13" cy="13" r="1" fill="#FA320A"/>
                      <circle cx="19" cy="13" r="1" fill="#FA320A"/>
                      <path d="M13 17c0 1.7 1.3 3 3 3s3-1.3 3-3" stroke="#FA320A" strokeWidth="1" fill="none"/>
                    </svg>
                    <span className="font-medium text-lg">{content.rottenTomatoesRating}%</span>
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
                <p className="text-retro-700 leading-relaxed text-lg mb-6" data-testid="content-synopsis">
                  {content.overview}
                </p>
                
                {/* Genre Tags */}
                {content.genre && content.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {content.genre.map((genre, index) => (
                      <span 
                        key={index}
                        className="px-4 py-2 bg-retro-500 text-white rounded-full text-sm font-medium hover:bg-retro-600 transition-colors cursor-pointer"
                        data-testid={`synopsis-genre-tag-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommended Content */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-8">
              <h2 className="text-2xl font-bold text-retro-900 mb-4">Recommended for You</h2>
              
              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {content.genre?.map((genre, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-retro-100 text-retro-700 rounded-full text-sm font-medium hover:bg-retro-200 transition-colors cursor-pointer"
                    data-testid={`genre-tag-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Recommended Content Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getRecommendedContent(content).map((item, index) => (
                  <div 
                    key={index}
                    className="group cursor-pointer"
                    data-testid={`recommended-${index}`}
                    onClick={() => navigate(`/content/${item.id}`)}
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-retro-100 mb-3 group-hover:shadow-lg transition-shadow">
                      <img
                        src={item.poster || `https://picsum.photos/300/450?random=${item.id}`}
                        alt={`${item.title} poster`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-medium text-retro-900 text-sm line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-retro-600">
                      <span>{item.year}</span>
                      <span className="capitalize bg-retro-50 px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </div>
                    {item.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span className="text-xs text-retro-600">{item.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seasons and Episodes Section */}
            {(content.type === "tv" || content.type === "anime") && (content.episodes || content.totalSeasons) && (
              <div className="bg-white rounded-lg p-6 shadow-md mb-8">
                <h2 className="text-2xl font-bold text-retro-900 mb-4">Seasons & Episodes</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                {/* Episode List */}
                <div className="border-t border-retro-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-retro-900">Season {content.season || 1} Episodes</h3>
                    <select className="px-3 py-1 border border-retro-300 rounded-md text-sm text-retro-700 bg-white">
                      {Array.from({ length: content.totalSeasons || 1 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Sample episodes - in a real app this would come from API */}
                    {generateSampleEpisodes(content).map((episode, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border border-retro-200 rounded-lg hover:bg-retro-50 transition-colors cursor-pointer" data-testid={`episode-${episode.number}`}>
                        <div className="flex-shrink-0 w-20 h-12 bg-retro-200 rounded overflow-hidden">
                          <img 
                            src={`https://picsum.photos/160/90?random=${content.id}-ep${episode.number}`}
                            alt={`Episode ${episode.number} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-retro-900 mb-1">
                                {episode.number}. {episode.title}
                              </h4>
                              <p className="text-sm text-retro-600 line-clamp-2 mb-2">
                                {episode.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-retro-500">
                                <span>{episode.duration}m</span>
                                <span>{episode.airDate}</span>
                                {episode.rating && <span>★ {episode.rating}</span>}
                              </div>
                            </div>
                            {episode.watched ? (
                              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <button className="flex-shrink-0 w-8 h-8 bg-retro-500 hover:bg-retro-600 rounded-full flex items-center justify-center transition-colors">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}