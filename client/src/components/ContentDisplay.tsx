

export interface ContentDisplayProps {
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
  /** Size variant - default or small */
  size?: "default" | "small";
  /** Click handler for the content card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export default function ContentDisplay({
  posterUrl,
  title,
  type,
  status,
  season,
  episode,
  size = "default",
  onClick,
  className = ""
}: ContentDisplayProps) {
  
  const getTypeBadgeColor = (contentType: string) => {
    switch (contentType) {
      case "movie":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "tv":
        return "bg-green-100 text-green-800 border-green-200";
      case "anime":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (contentStatus: string) => {
    switch (contentStatus) {
      case "coming-soon":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ongoing":
        return "bg-green-100 text-green-800 border-green-200";
      case "finished":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  return (
    <div 
      className={`group cursor-pointer transition-all duration-200 hover:scale-105 ${className}`}
      onClick={onClick}
      data-testid="content-display"
    >
      {/* Poster Container - 2:3 Aspect Ratio */}
      <div className={`relative aspect-[2/3] ${isSmall ? 'mb-2' : 'mb-3'} rounded-lg overflow-hidden bg-retro-100 shadow-md group-hover:shadow-lg transition-shadow`}>
        <img
          src={posterUrl}
          alt={`${title} poster`}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          data-testid="content-poster"
        />
        
        {/* Overlay with subtle gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
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



        {/* Season/Episode Info for TV Shows and Anime */}
        {(type === "tv" || type === "anime") && (season !== undefined || episode !== undefined) && (
          <div 
            className={`inline-flex items-center ${isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full bg-orange-50 text-orange-800 font-medium border border-orange-200`} 
            data-testid="content-episode-info"
          >
            {season !== undefined && `S${season}`}
            {season !== undefined && episode !== undefined && " • "}
            {episode !== undefined && `E${episode}`}
          </div>
        )}
      </div>
    </div>
  );
}