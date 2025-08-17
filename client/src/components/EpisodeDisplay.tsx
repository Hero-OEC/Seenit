import { Play, Clock } from "lucide-react";

export interface EpisodeDisplayProps {
  /** URL for the episode thumbnail */
  thumbnailUrl?: string;
  /** Title of the show */
  showTitle: string;
  /** Episode title */
  episodeTitle: string;
  /** Content type: tv or anime */
  type: "tv" | "anime";
  /** Status of the content */
  status: "coming-soon" | "ongoing" | "finished" | "canceled";
  /** Season number */
  season?: number;
  /** Episode number */
  episode?: number;
  /** Episode duration in minutes */
  duration?: number;
  /** Size variant - default or compact */
  size?: "default" | "compact";
  /** Click handler for the episode card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export default function EpisodeDisplay({
  thumbnailUrl,
  showTitle,
  episodeTitle,
  type,
  status,
  season,
  episode,
  duration,
  size = "default",
  onClick,
  className = ""
}: EpisodeDisplayProps) {
  
  const getTypeBadgeColor = (contentType: string) => {
    switch (contentType) {
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
      case "tv":
        return "TV Show";
      case "anime":
        return "Anime";
      default:
        return contentType;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const isCompact = size === "compact";

  return (
    <div 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${className}`}
      onClick={onClick}
      data-testid="episode-display"
    >
      <div className={`flex gap-4 ${isCompact ? 'p-3' : 'p-4'} bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
        {/* Episode Thumbnail */}
        <div className={`${isCompact ? 'w-14 h-20' : 'w-16 h-24'} rounded overflow-hidden flex-shrink-0 bg-retro-200`}>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`${showTitle} episode thumbnail`}
              className="w-full h-full object-cover"
              data-testid="episode-thumbnail"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-retro-300 to-retro-500 flex items-center justify-center">
              <Play className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-retro-50 fill-current`} />
            </div>
          )}
        </div>

        {/* Episode Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Episode Title */}
            <h3 
              className={`font-headline ${isCompact ? 'text-sm' : 'text-base'} font-semibold text-retro-900 line-clamp-1 leading-tight mb-1`}
              data-testid="episode-title"
            >
              {episodeTitle}
            </h3>

            {/* Show Title */}
            <p 
              className={`${isCompact ? 'text-xs' : 'text-sm'} text-retro-700 font-medium line-clamp-1 mb-2`}
              data-testid="show-title"
            >
              {showTitle}
            </p>

            {/* Season/Episode Info */}
            {(season !== undefined || episode !== undefined) && (
              <div 
                className={`inline-flex items-center gap-1 ${isCompact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} rounded-full bg-retro-500 text-white font-semibold shadow-md border border-retro-600 mb-2`} 
                data-testid="episode-info"
              >
                <Play className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill-white`} />
                {season !== undefined && `S${season}`}
                {season !== undefined && episode !== undefined && " • "}
                {episode !== undefined && `E${episode}`}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Info */}
        <div className="flex flex-col items-end justify-between">
          <div className="flex flex-col items-end gap-1">
            {/* Type Badge */}
            <span 
              className={`inline-flex items-center ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full font-medium border ${getTypeBadgeColor(type)} backdrop-blur-sm bg-opacity-90`}
              data-testid="episode-type-badge"
            >
              {getTypeLabel(type)}
            </span>
            
            {/* Status Badge */}
            <span 
              className={`inline-flex items-center ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full font-medium border ${getStatusBadgeColor(status)} backdrop-blur-sm bg-opacity-90`}
              data-testid="episode-status-badge"
            >
              {getStatusLabel(status)}
            </span>
          </div>

          {/* Duration */}
          {duration && (
            <div 
              className={`flex items-center gap-1 ${isCompact ? 'text-xs' : 'text-sm'} text-retro-600`}
              data-testid="episode-duration"
            >
              <Clock className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}