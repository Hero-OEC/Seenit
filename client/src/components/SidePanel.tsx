import ContentDisplay from "@/components/ContentDisplay";

export interface SidePanelItem {
  id: string;
  posterUrl: string;
  title: string;
  type: "movie" | "tv" | "anime";
  year?: number;
  season?: number;
  episode?: number;
}

export interface SidePanelProps {
  /** Panel title */
  title: string;
  /** Array of content items to display */
  items: SidePanelItem[];
  /** Panel variant - recommended or currently watching */
  variant?: "recommended" | "currently-watching";
  /** Optional genre tags to display at top */
  genreTags?: string[];
  /** Width of the panel */
  width?: string;
  /** Click handler for content items */
  onItemClick?: (item: SidePanelItem) => void;
  /** Click handler for genre tags */
  onGenreClick?: (genre: string) => void;
  /** Watchlist status change handler for currently watching items */
  onWatchlistAction?: (itemId: string, action: string) => void;
  /** Maximum number of items to display */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function SidePanel({
  title,
  items,
  variant = "recommended",
  genreTags = [],
  width = "w-64",
  onItemClick,
  onGenreClick,
  onWatchlistAction,
  maxItems = 6,
  className = ""
}: SidePanelProps) {
  const displayItems = items.slice(0, maxItems);

  const handleItemClick = (item: SidePanelItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleGenreClick = (genre: string) => {
    if (onGenreClick) {
      onGenreClick(genre);
    }
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-md ${width} mx-auto ${className}`} data-testid="side-panel">
      {/* Panel Title */}
      <h3 className="text-lg font-bold text-retro-900 mb-4" data-testid="side-panel-title">
        {title}
      </h3>
      
      {/* Genre Tags */}
      {genreTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4" data-testid="side-panel-genres">
          {genreTags.slice(0, 3).map((genre, index) => (
            <span 
              key={index}
              onClick={() => handleGenreClick(genre)}
              className={`px-2 py-1 bg-retro-100 text-retro-700 rounded-full text-xs font-medium hover:bg-retro-200 transition-colors ${
                onGenreClick ? 'cursor-pointer' : ''
              }`}
              data-testid={`side-panel-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Content List */}
      <div className="space-y-3" data-testid="side-panel-content">
        {displayItems.length === 0 ? (
          <div className="text-center py-8 text-retro-500" data-testid="side-panel-empty">
            <p className="text-sm">No content available</p>
          </div>
        ) : (
          displayItems.map((item) => (
            <ContentDisplay
              key={item.id}
              id={item.id}
              posterUrl={item.posterUrl}
              title={item.title}
              type={item.type}
              status="finished" // Default status for side panel items
              year={item.year}
              season={item.season}
              episode={item.episode}
              size="list"
              showWatchlistDropdown={variant === "currently-watching"}
              onWatchlistAction={onWatchlistAction ? (action) => onWatchlistAction(item.id, action) : undefined}
              onClick={() => handleItemClick(item)}
            />
          ))
        )}
      </div>

      {/* View More Button */}
      {items.length > maxItems && (
        <div className="mt-4 text-center" data-testid="side-panel-view-more">
          <button 
            className="text-retro-600 hover:text-retro-500 text-sm font-medium transition-colors"
            onClick={() => console.log('View more clicked')}
          >
            View All ({items.length})
          </button>
        </div>
      )}
    </div>
  );
}