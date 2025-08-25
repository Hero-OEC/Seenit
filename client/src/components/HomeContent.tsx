import ContentDisplay from "@/components/ContentDisplay";

interface ContentItem {
  id: string;
  posterUrl: string;
  title: string;
  type: "movie" | "tv" | "anime";
  status: "coming-soon" | "ongoing" | "finished" | "canceled";
  year?: number;
  season?: number;
}

export interface HomeContentProps {
  /** Section title */
  title: string;
  /** Array of content items to display */
  items: ContentItem[];
  /** Content type for consistent styling - optional for mixed genre content */
  contentType?: "movie" | "tv" | "anime" | "genre";
  /** Click handler for "View All" button */
  onViewAll: () => void;
  /** Click handler for individual content items */
  onItemClick: (item: ContentItem) => void;
  /** Maximum number of items to display */
  maxItems?: number;
  /** Layout variant - compact for signed-in users, expanded for public */
  variant?: "compact" | "expanded";
  /** Additional CSS classes */
  className?: string;
  /** Test ID for the section */
  testId?: string;
}

export default function HomeContent({
  title,
  items,
  contentType = "genre",
  onViewAll,
  onItemClick,
  maxItems = 4,
  variant = "compact",
  className = "",
  testId
}: HomeContentProps) {
  const displayItems = items.slice(0, maxItems);
  
  // Grid classes based on variant
  const gridClasses = variant === "expanded" 
    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
  
  // Container classes based on variant
  const containerClasses = variant === "expanded"
    ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    : "";
  
  // Border classes for expanded variant
  const borderClasses = variant === "expanded" && contentType !== "movie" 
    ? "border-t border-retro-200"
    : "";

  // Generate test ID based on content type or title
  const gridTestId = contentType === "genre" 
    ? `${title.toLowerCase().replace(/\s+/g, '-')}-grid`
    : `${contentType}-grid`;

  const buttonTestId = contentType === "genre"
    ? `view-all-${title.toLowerCase().replace(/\s+/g, '-')}`
    : `view-all-${contentType}`;

  return (
    <section className={`${containerClasses} ${borderClasses} ${className}`} data-testid={testId}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`font-bold text-retro-900 ${variant === "expanded" ? "text-3xl mb-8" : "text-2xl"}`}>
          {title}
        </h2>
        <button 
          className="text-retro-700 hover:text-retro-500 font-medium transition-colors"
          onClick={onViewAll}
          data-testid={buttonTestId}
        >
          View All →
        </button>
      </div>
      
      <div className={gridClasses} data-testid={gridTestId}>
        {displayItems.map((item) => (
          <ContentDisplay
            key={item.id}
            id={item.id}
            posterUrl={item.posterUrl}
            title={item.title}
            type={item.type}
            status={item.status}
            year={item.year}
            season={item.season}
            size="small"
            onClick={() => onItemClick(item)}
            data-testid={`content-display-${item.id}`}
          />
        ))}
      </div>
    </section>
  );
}