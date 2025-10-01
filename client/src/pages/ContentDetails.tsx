import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Play, ExternalLink, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import type { Content } from "@shared/schema";
import ContentDisplay from "@/components/ContentDisplay";
import StatusUpdateButton from "@/components/StatusUpdateButton";
import { useAuth } from "@/contexts/AuthContext";
import { getSeriesSeasons, formatSeasonTitle } from "@/lib/animeGrouping";

export default function ContentDetails() {
  const [, params] = useRoute("/content/:id");
  const [, navigate] = useLocation();
  const [selectedWatchlistStatus, setSelectedWatchlistStatus] = useState<string>("Add to Watch List");
  const [selectedSeason, setSelectedSeason] = useState<number>(0); // Will be set dynamically
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>("");
  const [watchedEpisodes, setWatchedEpisodes] = useState<{[key: string]: boolean}>({});
  const { user, isSignedIn } = useAuth();

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch recommended content from database
  const { data: recommendedContent } = useQuery<Content[]>({
    queryKey: [`/api/content/${params?.id}/recommendations`],
    enabled: !!params?.id,
  });

  // Fetch all seasons for anime series
  const { data: animeResponse } = useQuery<{content: Content[], pagination: any}>({
    queryKey: ["/api/content/type/anime?limit=100"], // Get more anime to find all seasons
    enabled: content?.type === 'anime' && !!content?.seriesKey,
  });

  // Get seasons for this anime series if it's anime
  const seriesSeasons = content?.type === 'anime' && content?.seriesKey && animeResponse?.content
    ? getSeriesSeasons(animeResponse.content, content.seriesKey)
    : [];

  const hasMultipleSeasons = seriesSeasons.length > 1;

  // Initialize empty watched episodes state and set default season
  useEffect(() => {
    if (!content || (content.type !== "tv" && content.type !== "anime")) return;
    // Start with empty state - all episodes unwatched
    setWatchedEpisodes({});
    
    // Set selected season to the most recent available season
    const availableSeasons = getAvailableSeasons(content);
    if (availableSeasons.length > 0 && selectedSeason === 0) {
      setSelectedSeason(availableSeasons[0]); // Most recent season first
    }
  }, [content, selectedSeason]);

  const handleSearch = (query: string) => {
    console.log(`Search: ${query}`);
  };

  const toggleEpisodeWatched = (seasonNumber: number, episodeNumber: number) => {
    const episodeKey = `s${seasonNumber}e${episodeNumber}`;
    setWatchedEpisodes(prev => ({
      ...prev,
      [episodeKey]: !prev[episodeKey]
    }));
  };

  const isEpisodeWatched = (seasonNumber: number, episodeNumber: number) => {
    const episodeKey = `s${seasonNumber}e${episodeNumber}`;
    return watchedEpisodes[episodeKey] || false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-retro-50">
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
        return "bg-orange-500 text-white border-orange-600";
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
    { value: "added_to_watch_list", label: "Want to Watch" },
    { value: "watching", label: "Currently Watching" },
    { value: "watched", label: "Watched" },
    { value: "remove_from_watch_list", label: "Remove from Watch List" },
  ];

  const handleWatchlistAction = (status: string) => {
    if (status === "remove_from_watch_list") {
      setSelectedWatchlistStatus("Add to Watch List");
      console.log(`Watchlist updated: Removed from watch list`);
    } else {
      const option = watchlistOptions.find(opt => opt.value === status);
      if (option) {
        setSelectedWatchlistStatus(option.label);
        console.log(`Watchlist updated: ${option.label}`);
      }
    }
  };


  const handleRatingClick = (rating: number) => {
    setUserRating(rating);
    console.log(`User rated content: ${rating} stars`);
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-colors hover:scale-110 transform duration-150"
            data-testid={`star-${star}`}
          >
            <Star 
              className={`w-6 h-6 ${
                star <= (hoveredRating || userRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Get all unique seasons from episode data
  const getAvailableSeasons = (content: Content): number[] => {
    if (!content.episodeData) return [];
    
    try {
      const episodeData = typeof content.episodeData === 'string' 
        ? JSON.parse(content.episodeData) 
        : content.episodeData;
      
      const episodes = episodeData?.episodes || episodeData;
      if (!Array.isArray(episodes)) return [];
      
      // Get unique season numbers and sort them
      const uniqueSeasons = Array.from(new Set(episodes.map((ep: any) => ep.season)));
      return uniqueSeasons.sort((a, b) => b - a); // Newest first
    } catch (error) {
      console.error('Error parsing episode data:', content.title);
      return [];
    }
  };

  // Get episodes from database content
  const getEpisodesFromContent = (content: Content, seasonNumber: number) => {
    if (!content.episodeData) return [];
    
    try {
      const episodeData = typeof content.episodeData === 'string' 
        ? JSON.parse(content.episodeData) 
        : content.episodeData;
      
      // Check if episodeData has the expected structure
      const episodes = episodeData?.episodes || episodeData;
      
      if (!Array.isArray(episodes)) return [];
      
      // Filter episodes for the selected season
      return episodes.filter((ep: any) => ep.season === seasonNumber);
    } catch (error) {
      console.error('Error parsing episode data:', content.title);
      return [];
    }
  };


  return (
    <div className="min-h-screen bg-retro-50">
      {/* Content Details */}
      <div className="max-w-7xl mx-auto pt-8 pb-8">
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
              <StatusUpdateButton
                status={selectedWatchlistStatus}
                options={watchlistOptions}
                onStatusChange={handleWatchlistAction}
                onMainAction={() => handleWatchlistAction("added_to_watch_list")}
                testIdPrefix="watchlist"
              />

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

              {/* Recommended Content */}
              <div className="bg-white rounded-lg p-4 shadow-md mt-6 w-64 mx-auto">
                <h3 className="text-lg font-bold text-retro-900 mb-4">Recommended for You</h3>
                
                {/* Genre Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {content.genres?.slice(0, 3).map((genre, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-retro-100 text-retro-700 rounded-full text-xs font-medium hover:bg-retro-200 transition-colors cursor-pointer"
                      data-testid={`rec-genre-tag-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Recommended Content List - Vertical */}
                <div className="space-y-3">
                  {recommendedContent?.slice(0, 6).map((item, index) => (
                    <div 
                      key={item.id} 
                      className="flex gap-3 cursor-pointer hover:bg-retro-50 p-2 rounded-lg transition-colors" 
                      data-testid={`recommended-${index}`}
                      onClick={() => navigate(`/content/${item.id}`)}
                    >
                      <div className="flex-shrink-0 w-12 h-16 bg-retro-200 rounded overflow-hidden">
                        <img 
                          src={item.poster || "/api/placeholder/300/450"}
                          alt={`${item.title} poster`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-retro-900 text-sm line-clamp-2 mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-retro-600 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(item.type)}`}>
                            {getTypeLabel(item.type)}
                          </span>
                          <span>{item.year}</span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-sm text-retro-500 text-center py-4">
                      No recommendations available
                    </div>
                  )}
                </div>

              </div>
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
            </div>

            {/* Season Navigation for Anime Series */}
            {hasMultipleSeasons && content.type === 'anime' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-retro-900 mb-3">Seasons</h3>
                <div className="flex flex-wrap gap-2">
                  {seriesSeasons.map((season, index) => (
                    <button
                      key={season.id}
                      onClick={() => navigate(`/content/${season.id}`)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                        season.id === content.id
                          ? 'bg-retro-500 text-white border-retro-500 shadow-md'
                          : 'bg-white text-retro-700 border-retro-200 hover:bg-retro-50 hover:border-retro-300'
                      }`}
                      data-testid={`season-${season.seasonNumber || index + 1}`}
                    >
                      {formatSeasonTitle(season)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-sm text-retro-600">
                  Currently viewing: <span className="font-medium">{formatSeasonTitle(content)}</span>
                </div>
              </div>
            )}

            {/* Ratings */}
            {(content.imdbRating || content.rottenTomatoesRating || content.malRating || content.rating) && (
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
                    <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                      {/* Main tomato body */}
                      <ellipse cx="50" cy="60" rx="35" ry="30" fill="#FA320A"/>
                      
                      {/* Tomato highlights */}
                      <ellipse cx="42" cy="55" rx="8" ry="6" fill="#FF6B47" opacity="0.7"/>
                      <ellipse cx="35" cy="65" rx="4" ry="3" fill="#FF6B47" opacity="0.5"/>
                      
                      {/* Tomato stem/calyx */}
                      <path d="M35 35 Q40 30 45 35 Q50 25 55 35 Q60 30 65 35 Q50 40 50 45 Q50 40 35 35" fill="#228B22"/>
                      
                      {/* Small leaves */}
                      <path d="M30 35 Q25 30 30 25 Q35 30 30 35" fill="#32CD32"/>
                      <path d="M70 35 Q75 30 70 25 Q65 30 70 35" fill="#32CD32"/>
                      
                      {/* Tomato shine */}
                      <ellipse cx="45" cy="50" rx="6" ry="8" fill="#FF8C69" opacity="0.6"/>
                    </svg>
                    <span className="font-medium text-lg">{content.rottenTomatoesRating}%</span>
                  </div>
                )}
                {content.malRating && content.type === "anime" && (
                  <div className="flex items-center gap-3" data-testid="mal-rating">
                    {/* MyAnimeList Logo */}
                    <div className="w-12 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MAL</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-lg">{content.malRating}/10</span>
                    </div>
                  </div>
                )}
                {content.rating && !content.imdbRating && !content.malRating && (
                  <div className="flex items-center gap-3" data-testid="tvmaze-imdb-rating">
                    {/* IMDb Logo */}
                    <svg className="w-12 h-6" viewBox="0 0 64 32" fill="none">
                      <rect width="64" height="32" rx="4" fill="#F5C518"/>
                      <text x="32" y="20" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#000">IMDb</text>
                    </svg>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-lg">{content.rating}/10</span>
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
                
                {/* Genres */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {content.genres && content.genres.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-retro-900 mb-3">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {content.genres.map((genre, index) => (
                          <span 
                            key={index}
                            className="px-4 py-2 bg-retro-100 text-retro-700 rounded-full text-sm font-medium hover:bg-retro-200 transition-colors cursor-pointer border border-retro-200"
                            data-testid={`synopsis-genre-tag-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Seasons and Episodes Section */}
            {(content.type === "tv" || content.type === "anime") && (content.episodes || content.totalSeasons) && (
              <div className="bg-white rounded-lg p-6 shadow-md mb-8">
                <h2 className="text-2xl font-bold text-retro-900 mb-4">Seasons & Episodes</h2>

                {/* Season Tabs */}
                {(() => {
                  const availableSeasons = getAvailableSeasons(content);
                  return availableSeasons.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {availableSeasons.map((seasonNum) => (
                        <button
                          key={seasonNum}
                          onClick={() => setSelectedSeason(seasonNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedSeason === seasonNum
                              ? 'bg-retro-500 text-white shadow-md'
                              : 'border border-retro-300 text-retro-700 hover:bg-retro-50'
                          }`}
                          data-testid={`season-tab-${seasonNum}`}
                        >
                          Season {seasonNum}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Episode List */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-retro-900">Season {selectedSeason} Episodes</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Episodes from database */}
                    {getEpisodesFromContent(content, selectedSeason).map((episode: any, index: number) => (
                      <div key={index} className="border-b border-retro-200 pb-4 last:border-b-0 last:pb-0" data-testid={`episode-${episode.number || episode.episodeNumber || index + 1}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-medium text-retro-900">
                                S{(episode.season || selectedSeason || 1).toString().padStart(2, '0')} E{(episode.number || episode.episodeNumber || index + 1).toString().padStart(2, '0')} • {episode.name || episode.title || `Episode ${episode.episodeNumber || index + 1}`}
                              </h4>
                              {isEpisodeWatched(episode.season || selectedSeason || 1, episode.number || episode.episodeNumber || index + 1) && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <Check className="w-3 h-3" />
                                  Watched
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-retro-500 mb-3">
                              {(() => {
                                const airdate = episode.airdate || episode.aired;
                                if (!airdate || airdate === 'TBA') return 'TBA';
                                // Extract date part from ISO format (remove time)
                                return airdate.includes('T') ? airdate.split('T')[0] : airdate;
                              })()}
                            </p>
                            {(episode.summary || episode.description) && (
                              <p className="text-retro-700 leading-relaxed mb-4">{episode.summary || episode.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-retro-500">
                                {(episode.runtime || episode.duration) && episode.runtime !== 'TBA' && episode.duration !== 'TBA' && (
                                  <span>{episode.runtime || episode.duration} min</span>
                                )}
                                {episode.rating?.average && <span>★ {episode.rating.average}</span>}
                              </div>
                              <button 
                                onClick={() => toggleEpisodeWatched(episode.season || selectedSeason || 1, episode.number || episode.episodeNumber || index + 1)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  isEpisodeWatched(episode.season || selectedSeason || 1, episode.number || episode.episodeNumber || index + 1)
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-retro-500 hover:bg-retro-600 text-white'
                                }`}
                                title={isEpisodeWatched(episode.season || selectedSeason || 1, episode.number || episode.episodeNumber || index + 1) ? "Mark as unwatched" : "Mark as watched"}
                                data-testid={`episode-${episode.number || episode.episodeNumber || index + 1}-watch-button`}
                              >
                                <Check className="w-4 h-4" />
                                {isEpisodeWatched(episode.season || selectedSeason || 1, episode.number || episode.episodeNumber || index + 1) ? 'Watched' : 'Mark as Watched'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trailer Section - Only for movies and anime, not TV shows */}
            {content.type !== 'tv' && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-retro-900 mb-4">
                  {content.type === 'movie' ? 'Movie' : 'Anime'} Trailer
                </h2>
                
                {/* Display trailer if available, otherwise show placeholder */}
                {content.trailerKey ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${content.trailerKey}?rel=0&modestbranding=1`}
                      title={`${content.title} Trailer`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-retro-900 to-retro-700">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Official Trailer</h3>
                        <p className="text-retro-200 text-sm">
                          Trailer not available
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Reviews Section */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-8">
              <h2 className="text-2xl font-bold text-retro-900 mb-6">User Reviews</h2>
              
              {/* Write Review Section - Only show when signed in */}
              {isSignedIn && (
                <div className="border-b border-retro-200 pb-6 mb-6">
                  <h3 className="text-lg font-semibold text-retro-900 mb-4">Rate & Review This {content.type === 'movie' ? 'Movie' : content.type === 'tv' ? 'TV Show' : 'Anime'}</h3>
                  
                  {/* Rating Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-retro-700 mb-2">Your Rating</label>
                    <div className="flex items-center gap-4">
                      {renderStarRating()}
                      {userRating > 0 && (
                        <span className="text-sm text-retro-600 font-medium">
                          {userRating} out of 5 stars
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-retro-700 mb-2">Your Review</label>
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Share your thoughts about this content..."
                      className="w-full p-3 border border-retro-300 rounded-lg focus:ring-2 focus:ring-retro-500 focus:border-retro-500 resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-retro-500 mt-1">
                      {userComment.length}/500 characters
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      {(userRating > 0 || userComment.trim()) && (
                        <p className="text-sm text-retro-600">
                          {userRating > 0 && userComment.trim() ? "Thanks for your rating and review!" : 
                           userRating > 0 ? "Thanks for rating!" : ""}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (userRating > 0 || userComment.trim()) {
                          console.log(`User review submitted: Rating: ${userRating}, Comment: ${userComment}`);
                        }
                      }}
                      disabled={userRating === 0 && !userComment.trim()}
                      className="px-6 py-2 bg-retro-500 text-white rounded-lg hover:bg-retro-600 disabled:bg-retro-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              )}

              {/* Sign In Prompt for non-signed in users */}
              {!isSignedIn && (
                <div className="border-b border-retro-200 pb-6 mb-6 text-center">
                  <p className="text-retro-600 mb-4">Sign in to rate and review this {content.type === 'movie' ? 'movie' : content.type === 'tv' ? 'TV show' : 'anime'}</p>
                  <button
                    onClick={() => navigate("/signin")}
                    className="px-6 py-2 bg-retro-500 text-white rounded-lg hover:bg-retro-600 transition-colors font-medium"
                  >
                    Sign In to Review
                  </button>
                </div>
              )}

              {/* Database Reviews - Will be populated when review system is implemented */}
              <div className="text-center py-8">
                <p className="text-retro-500">No reviews yet. Be the first to review!</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}