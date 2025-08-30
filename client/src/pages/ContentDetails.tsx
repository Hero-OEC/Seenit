import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Play, ExternalLink, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import type { Content } from "@shared/schema";
import ContentDisplay from "@/components/ContentDisplay";
import StatusUpdateButton from "@/components/StatusUpdateButton";
import { useAuth } from "@/contexts/AuthContext";

export default function ContentDetails() {
  const [, params] = useRoute("/content/:id");
  const [, navigate] = useLocation();
  const [selectedWatchlistStatus, setSelectedWatchlistStatus] = useState<string>("Add to Watch List");
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>("");
  const [watchedEpisodes, setWatchedEpisodes] = useState<{[key: string]: boolean}>({});
  const { user, isSignedIn } = useAuth();

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${params?.id}`],
    enabled: !!params?.id,
  });

  // Initialize watched episodes from the generated sample data
  useEffect(() => {
    if (!content || (content.type !== "tv" && content.type !== "anime")) return;
    
    const episodes = generateSampleEpisodes(content);
    const initialWatchedState: {[key: string]: boolean} = {};
    
    episodes.forEach(episode => {
      if (episode.watched) {
        const episodeKey = `s${selectedSeason}e${episode.number}`;
        initialWatchedState[episodeKey] = true;
      }
    });
    
    setWatchedEpisodes(prev => ({ ...prev, ...initialWatchedState }));
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
        poster: null,
        season: 2,
        episode: 8
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
        poster: null,
        season: 1,
        episode: 12
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
        poster: null,
        season: 3,
        episode: 4
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
        poster: null,
        season: 1,
        episode: 6
      },
      {
        id: "rec8",
        title: "Fantasy Quest",
        type: "anime",
        year: 2024,
        genre: ["Fantasy", "Adventure"],
        rating: "8.8",
        poster: null,
        season: 2,
        episode: 3
      }
    ];

    // Filter and sort recommendations based on shared genres
    const currentGenres = currentContent.genres || [];
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
                  {getRecommendedContent(content).slice(0, 6).map((item, index) => (
                    <div key={index} className="flex gap-3 cursor-pointer hover:bg-retro-50 p-2 rounded-lg transition-colors" data-testid={`recommended-${index}`}>
                      <div className="flex-shrink-0 w-12 h-16 bg-retro-200 rounded overflow-hidden">
                        <img 
                          src={item.poster || `https://picsum.photos/300/450?random=${item.id}`}
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
                        {/* Season/Episode Info for TV Shows and Anime */}
                        {(item.type === "tv" || item.type === "anime") && (item.season !== undefined || item.episode !== undefined) && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-retro-500 text-white font-semibold shadow-sm border border-retro-600 mt-1">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            {item.season !== undefined && `S${item.season}`}
                            {item.season !== undefined && item.episode !== undefined && " • "}
                            {item.episode !== undefined && `E${item.episode}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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

            {/* Source and Metadata */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2" data-testid="content-source">
                <span className="text-sm text-retro-600">Source:</span>
                <span className="font-medium text-retro-900 uppercase">{content.source}</span>
              </div>
              {content.popularity && (
                <div className="flex items-center gap-2" data-testid="content-popularity">
                  <span className="text-sm text-retro-600">Popularity:</span>
                  <span className="font-medium text-retro-900">{content.popularity.toFixed(1)}</span>
                </div>
              )}
              {content.voteCount && (
                <div className="flex items-center gap-2" data-testid="content-votes">
                  <span className="text-sm text-retro-600">Votes:</span>
                  <span className="font-medium text-retro-900">{content.voteCount.toLocaleString()}</span>
                </div>
              )}
            </div>

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

            {/* Content-specific details */}
            {(content.runtime || content.network || content.studio || content.sourceMaterial) && (
              <div className="bg-white rounded-lg p-6 shadow-md mb-8">
                <h2 className="text-xl font-bold text-retro-900 mb-4">Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Movie-specific fields */}
                  {content.type === "movie" && content.runtime && (
                    <div data-testid="movie-runtime">
                      <span className="font-medium text-retro-900">Runtime:</span>
                      <span className="ml-2 text-retro-700">{content.runtime} minutes</span>
                    </div>
                  )}
                  
                  {/* TV-specific fields */}
                  {content.type === "tv" && content.network && (
                    <div data-testid="tv-network">
                      <span className="font-medium text-retro-900">Network:</span>
                      <span className="ml-2 text-retro-700">{content.network}</span>
                    </div>
                  )}
                  {content.type === "tv" && content.airTime && (
                    <div data-testid="tv-airtime">
                      <span className="font-medium text-retro-900">Air Time:</span>
                      <span className="ml-2 text-retro-700">{content.airTime}</span>
                    </div>
                  )}
                  {content.type === "tv" && content.airDays && content.airDays.length > 0 && (
                    <div data-testid="tv-airdays">
                      <span className="font-medium text-retro-900">Air Days:</span>
                      <span className="ml-2 text-retro-700">{content.airDays.join(", ")}</span>
                    </div>
                  )}
                  
                  {/* Anime-specific fields */}
                  {content.type === "anime" && content.studio && (
                    <div data-testid="anime-studio">
                      <span className="font-medium text-retro-900">Studio:</span>
                      <span className="ml-2 text-retro-700">{content.studio}</span>
                    </div>
                  )}
                  {content.type === "anime" && content.sourceMaterial && (
                    <div data-testid="anime-source">
                      <span className="font-medium text-retro-900">Source:</span>
                      <span className="ml-2 text-retro-700 capitalize">{content.sourceMaterial.replace('_', ' ')}</span>
                    </div>
                  )}
                  
                  {/* Common episode information */}
                  {content.totalEpisodes && (
                    <div data-testid="total-episodes">
                      <span className="font-medium text-retro-900">Total Episodes:</span>
                      <span className="ml-2 text-retro-700">{content.totalEpisodes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Synopsis */}
            {content.overview && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-retro-900 mb-4">Synopsis</h2>
                <p className="text-retro-700 leading-relaxed text-lg mb-6" data-testid="content-synopsis">
                  {content.overview}
                </p>
                
                {/* Genre and Tags */}
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
                  
                  {content.tags && content.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-retro-900 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {content.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                            data-testid={`synopsis-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {tag.replace(/[-_]/g, ' ')}
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
                {content.totalSeasons && content.totalSeasons > 1 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {Array.from({ length: content.totalSeasons }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setSelectedSeason(i + 1)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedSeason === i + 1
                            ? 'bg-retro-500 text-white shadow-md'
                            : 'border border-retro-300 text-retro-700 hover:bg-retro-50'
                        }`}
                        data-testid={`season-tab-${i + 1}`}
                      >
                        Season {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Episode List */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-retro-900">Season {selectedSeason} Episodes</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Sample episodes - in a real app this would come from API */}
                    {generateSampleEpisodes(content).map((episode, index) => (
                      <div key={index} className="border-b border-retro-200 pb-4 last:border-b-0 last:pb-0" data-testid={`episode-${episode.number}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-medium text-retro-900">
                                S{selectedSeason.toString().padStart(2, '0')} E{episode.number.toString().padStart(2, '0')} • {episode.title}
                              </h4>
                              {isEpisodeWatched(selectedSeason, episode.number) && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <Check className="w-3 h-3" />
                                  Watched
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-retro-500 mb-3">{episode.airDate}</p>
                            <p className="text-retro-700 leading-relaxed mb-4">{episode.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-retro-500">
                                <span>{episode.duration} min</span>
                                {episode.rating && <span>★ {episode.rating}</span>}
                              </div>
                              {isSignedIn && (
                                <button 
                                  onClick={() => toggleEpisodeWatched(selectedSeason, episode.number)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isEpisodeWatched(selectedSeason, episode.number)
                                      ? 'bg-green-500 hover:bg-green-600 text-white'
                                      : 'bg-retro-500 hover:bg-retro-600 text-white'
                                  }`}
                                  title={isEpisodeWatched(selectedSeason, episode.number) ? "Mark as unwatched" : "Mark as watched"}
                                >
                                  <Check className="w-4 h-4" />
                                  {isEpisodeWatched(selectedSeason, episode.number) ? 'Watched' : 'Mark as Watched'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trailer Section */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-8">
              <h2 className="text-2xl font-bold text-retro-900 mb-6">
                {content.type === 'movie' ? 'Movie' : content.type === 'tv' ? 'TV Show' : 'Anime'} Trailer
              </h2>
              
              {/* Trailer will be fetched from API - for now showing placeholder */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-retro-900 to-retro-700">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Official Trailer</h3>
                    <p className="text-retro-200 text-sm">
                      Trailer will be loaded from API
                    </p>
                  </div>
                </div>
                
                {/* When API is connected, this will be replaced with actual video embed */}
                <div 
                  className="absolute inset-0 cursor-pointer hover:bg-black/10 transition-colors"
                  onClick={() => {
                    console.log(`Loading trailer for ${content.title}`);
                    // This will be replaced with actual API call to fetch trailer URL
                  }}
                  data-testid="trailer-play-button"
                />
              </div>
            </div>

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

              {/* Sample Reviews */}
              <div className="space-y-6">
                <div className="border-b border-retro-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-retro-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">AK</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-retro-900">Alex K.</h4>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-retro-500">2 days ago</span>
                      </div>
                      <p className="text-retro-700 leading-relaxed">
                        Great storyline and excellent character development. The plot keeps you engaged throughout, though some episodes feel a bit slow. Overall, definitely worth watching!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-retro-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-retro-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">MR</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-retro-900">Maria R.</h4>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= 5 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-retro-500">1 week ago</span>
                      </div>
                      <p className="text-retro-700 leading-relaxed">
                        Absolutely loved it! The cinematography is stunning and the acting is top-notch. This is exactly what I was looking for. Highly recommend to anyone who enjoys this genre.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-retro-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-retro-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">JS</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-retro-900">John S.</h4>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= 3 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-retro-500">2 weeks ago</span>
                      </div>
                      <p className="text-retro-700 leading-relaxed">
                        It's okay, nothing groundbreaking. Some good moments but overall feels like something I've seen before. The production quality is decent though.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* View More Reviews Button */}
              <div className="mt-6 text-center">
                <button className="px-6 py-2 border border-retro-300 text-retro-700 rounded-lg hover:bg-retro-50 transition-colors font-medium">
                  View All Reviews
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}