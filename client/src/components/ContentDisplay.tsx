
import { Play } from "lucide-react";
import { Link } from "wouter";
import StatusUpdateButton from "@/components/StatusUpdateButton";

export interface ContentDisplayProps {
  /** Content ID for linking */
  id?: string;
  /** URL for the poster image */
  posterUrl: string;
  /** Title of the content */
  title: string;
  /** Content type: movie, tv, or anime */
  type: "movie" | "tv" | "anime";
  /** Status of the content */
  status: "coming-soon" | "ongoing" | "finished" | "canceled";
  /** Optional season number for TV shows and anime */
  season?: number;
  /** Optional episode number for TV shows and anime */
  episode?: number;
  /** Optional year of release */
  year?: number;
  /** Size variant - default, small, or list */
  size?: "default" | "small" | "list";
  /** Click handler for the content card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show watchlist dropdown for currently watching items */
  showWatchlistDropdown?: boolean;
  /** Watchlist action handler */
  onWatchlistAction?: (action: string) => void;
  /** Current watchlist status */
  watchlistStatus?: string;
}

export default function ContentDisplay({
  id,
  posterUrl,
  title,
  type,
  status,
  season,
  episode,
  year,
  size = "default",
  onClick,
  className = "",
  showWatchlistDropdown = false,
  onWatchlistAction,
  watchlistStatus = "Currently Watching"
}: ContentDisplayProps) {
  
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
      case "coming-soon":
        return "bg-amber-500 text-white border-amber-600";
      case "ongoing":
        return "bg-lime-500 text-white border-lime-600";
      case "finished":
        return "bg-neutral-500 text-white border-neutral-600";
      case "canceled":
        return "bg-rose-500 text-white border-rose-600";
      default:
        return "bg-neutral-500 text-white border-neutral-600";
    }
  };

  const getStatusLabel = (contentStatus: string) => {
    switch (contentStatus) {
      case "coming-soon":
        return "Coming Soon";
      case "ongoing":
        return "Ongoing";
      case "finished":
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

  const isSmall = size === "small";
  const isList = size === "list";

  const watchlistOptions = [
    { value: "added_to_watch_list", label: "Want to Watch" },
    { value: "watching", label: "Currently Watching" },
    { value: "watched", label: "Watched" },
    { value: "remove_from_watch_list", label: "Remove from Watch List" },
  ];

  const handleWatchlistAction = (action: string) => {
    if (onWatchlistAction) {
      onWatchlistAction(action);
    }
  };

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (id) {
      return (
        <Link href={`/content/${id}`}>
          <div 
            className={`group cursor-pointer ${className}`}
            data-testid="content-display"
          >
            {children}
          </div>
        </Link>
      );
    }
    
    return (
      <div 
        className={`group cursor-pointer ${className}`}
        onClick={onClick}
        data-testid="content-display"
      >
        {children}
      </div>
    );
  };

  // List variant layout (horizontal)
  if (isList) {
    return (
      <ContentWrapper>
        <div className="cursor-pointer hover:bg-retro-50 p-2 rounded-lg transition-colors" data-testid="content-display-list">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-12 h-16 bg-retro-200 rounded overflow-hidden">
              <img 
                src={posterUrl}
                alt={`${title} poster`}
                className="w-full h-full object-cover"
                data-testid="content-poster-list"
              />
            </div>
            <div className="flex-1 min-w-0 max-w-[180px]">
              <h4 className="font-medium text-retro-900 text-sm line-clamp-2 mb-1" data-testid="content-title-list">
                {title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-retro-600 mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(type)}`} data-testid="content-type-badge-list">
                  {getTypeLabel(type)}
                </span>
                {year && <span data-testid="content-year-list">{year}</span>}
              </div>
              {/* Season/Episode Info for TV Shows and Anime */}
              {(type === "tv" || type === "anime") && (season !== undefined || episode !== undefined) && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-retro-500 text-white font-semibold shadow-sm border border-retro-600 mt-1" data-testid="content-episode-info-list">
                  <Play className="w-2.5 h-2.5 fill-white" />
                  {season !== undefined && `S${season}`}
                  {season !== undefined && episode !== undefined && " • "}
                  {episode !== undefined && `E${episode}`}
                </div>
              )}
            </div>
          </div>
          
          {/* Watchlist Dropdown for Currently Watching - Below content, full width */}
          {showWatchlistDropdown && (
            <div 
              className="mt-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <StatusUpdateButton
                status={watchlistStatus}
                options={watchlistOptions}
                onStatusChange={handleWatchlistAction}
                size="small"
                testIdPrefix="watchlist-list"
              />
            </div>
          )}
        </div>
      </ContentWrapper>
    );
  }

  // Default and small variant layout (vertical)
  return (
    <ContentWrapper>
      {/* Poster Container - 2:3 Aspect Ratio */}
      <div className={`relative aspect-[2/3] ${isSmall ? 'mb-2' : 'mb-3'} rounded-lg overflow-hidden bg-retro-100 shadow-md group-hover:shadow-lg transition-all duration-200 hover:scale-105`}>
        <img
          src={posterUrl}
          alt={`${title} poster`}
          className="w-full h-full object-cover"
          data-testid="content-poster"
        />
        

        
        {/* Type Badge - positioned based on size */}
        <span 
          className={`absolute ${isSmall ? 'top-1.5 left-1.5' : 'bottom-1.5 left-1.5'} inline-flex items-center ${isSmall ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full ${isSmall ? 'text-[10px]' : 'text-xs'} font-medium border ${getTypeBadgeColor(type)} backdrop-blur-sm bg-opacity-90`}
          data-testid="content-type-badge"
        >
          {getTypeLabel(type)}
        </span>

        {/* Status Badge - always at bottom right */}
        <span 
          className={`absolute bottom-1.5 right-1.5 inline-flex items-center ${isSmall ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full ${isSmall ? 'text-[10px]' : 'text-xs'} font-medium border ${getStatusBadgeColor(status)} backdrop-blur-sm bg-opacity-90`}
          data-testid="content-status-badge"
        >
          {getStatusLabel(status)}
        </span>
      </div>

      {/* Content Info */}
      <div className={isSmall ? 'space-y-1' : 'space-y-2'}>
        {/* Title */}
        <h3 
          className={`font-headline ${isSmall ? 'text-xs' : 'text-sm'} font-semibold text-retro-900 line-clamp-2 leading-tight`}
          data-testid="content-title"
        >
          {title}
        </h3>

        {/* Year for Movies */}
        {type === "movie" && (
          <p 
            className={`${isSmall ? 'text-[10px]' : 'text-xs'} text-retro-600 font-medium`}
            data-testid="content-year"
          >
            {year || 'Year not available'}
          </p>
        )}

        {/* Season/Episode Info for TV Shows and Anime */}
        {(type === "tv" || type === "anime") && (season !== undefined || episode !== undefined) && (
          <div 
            className={`inline-flex items-center gap-1 ${isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full bg-retro-500 text-white font-semibold shadow-md border border-retro-600`} 
            data-testid="content-episode-info"
          >
            <Play className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill-white`} />
            {season !== undefined && `S${season}`}
            {season !== undefined && episode !== undefined && " • "}
            {episode !== undefined && `E${episode}`}
          </div>
        )}
      </div>
    </ContentWrapper>
  );
}