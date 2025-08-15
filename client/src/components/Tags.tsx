import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-retro-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-retro-200 bg-retro-50 text-retro-700 hover:bg-retro-100",
        primary: "border-retro-300 bg-retro-500 text-white hover:bg-retro-600",
        secondary: "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
        success: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
        error: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        outline: "border-retro-300 text-retro-600 hover:bg-retro-50",
        ghost: "border-transparent text-retro-600 hover:bg-retro-50",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  /** Text content of the tag */
  children: React.ReactNode;
  /** Whether the tag is removable with an X button */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Whether the tag is clickable */
  clickable?: boolean;
  /** Click handler for the tag */
  onTagClick?: () => void;
}

export function Tag({
  className,
  variant,
  size,
  children,
  removable = false,
  onRemove,
  clickable = false,
  onTagClick,
  ...props
}: TagProps) {
  const TagComponent = clickable || onTagClick ? "button" : "span";

  return (
    <TagComponent
      className={cn(
        tagVariants({ variant, size }),
        clickable && "cursor-pointer hover:scale-105 active:scale-95",
        className
      )}
      onClick={onTagClick}
      data-testid="tag"
      {...props}
    >
      <span className="truncate" data-testid="tag-text">
        {children}
      </span>
      {removable && onRemove && (
        <button
          type="button"
          className="ml-1.5 -mr-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          data-testid="tag-remove-button"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </TagComponent>
  );
}

export interface TagsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of tag items */
  tags: Array<{
    id: string | number;
    label: string;
    variant?: TagProps["variant"];
    removable?: boolean;
    clickable?: boolean;
  }>;
  /** Default variant for all tags */
  variant?: TagProps["variant"];
  /** Default size for all tags */
  size?: TagProps["size"];
  /** Whether tags are removable by default */
  removable?: boolean;
  /** Whether tags are clickable by default */
  clickable?: boolean;
  /** Callback when a tag is clicked */
  onTagClick?: (tagId: string | number, tag: TagsProps["tags"][0]) => void;
  /** Callback when a tag is removed */
  onTagRemove?: (tagId: string | number, tag: TagsProps["tags"][0]) => void;
  /** Maximum number of tags to display before showing "show more" */
  maxVisible?: number;
  /** Text for the show more button */
  showMoreText?: string;
  /** Text for the show less button */
  showLessText?: string;
}

export function Tags({
  tags,
  variant = "default",
  size = "default",
  removable = false,
  clickable = false,
  onTagClick,
  onTagRemove,
  maxVisible,
  showMoreText = "Show more",
  showLessText = "Show less",
  className,
  ...props
}: TagsProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const visibleTags = maxVisible && !isExpanded 
    ? tags.slice(0, maxVisible) 
    : tags;

  const hasMoreTags = maxVisible && tags.length > maxVisible;

  return (
    <div
      className={cn("flex flex-wrap gap-2 items-center", className)}
      data-testid="tags-container"
      {...props}
    >
      {visibleTags.map((tag) => (
        <Tag
          key={tag.id}
          variant={tag.variant || variant}
          size={size}
          removable={tag.removable ?? removable}
          clickable={tag.clickable ?? clickable}
          onTagClick={
            onTagClick ? () => onTagClick(tag.id, tag) : undefined
          }
          onRemove={
            onTagRemove ? () => onTagRemove(tag.id, tag) : undefined
          }
        >
          {tag.label}
        </Tag>
      ))}
      
      {hasMoreTags && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-retro-600 hover:text-retro-700 font-medium transition-colors"
          data-testid="tags-toggle-button"
        >
          {isExpanded ? showLessText : `+${tags.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
}

// Common genre presets for entertainment content
export const MOVIE_GENRES = [
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "animation", label: "Animation" },
  { id: "comedy", label: "Comedy" },
  { id: "crime", label: "Crime" },
  { id: "documentary", label: "Documentary" },
  { id: "drama", label: "Drama" },
  { id: "family", label: "Family" },
  { id: "fantasy", label: "Fantasy" },
  { id: "history", label: "History" },
  { id: "horror", label: "Horror" },
  { id: "music", label: "Music" },
  { id: "mystery", label: "Mystery" },
  { id: "romance", label: "Romance" },
  { id: "sci-fi", label: "Science Fiction" },
  { id: "thriller", label: "Thriller" },
  { id: "war", label: "War" },
  { id: "western", label: "Western" },
];

export const TV_GENRES = [
  { id: "action-adventure", label: "Action & Adventure" },
  { id: "animation", label: "Animation" },
  { id: "comedy", label: "Comedy" },
  { id: "crime", label: "Crime" },
  { id: "documentary", label: "Documentary" },
  { id: "drama", label: "Drama" },
  { id: "family", label: "Family" },
  { id: "kids", label: "Kids" },
  { id: "mystery", label: "Mystery" },
  { id: "news", label: "News" },
  { id: "reality", label: "Reality" },
  { id: "sci-fi-fantasy", label: "Sci-Fi & Fantasy" },
  { id: "soap", label: "Soap" },
  { id: "talk", label: "Talk" },
  { id: "war-politics", label: "War & Politics" },
  { id: "western", label: "Western" },
];

export const ANIME_GENRES = [
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "drama", label: "Drama" },
  { id: "ecchi", label: "Ecchi" },
  { id: "fantasy", label: "Fantasy" },
  { id: "hentai", label: "Hentai" },
  { id: "horror", label: "Horror" },
  { id: "mahou-shoujo", label: "Mahou Shoujo" },
  { id: "mecha", label: "Mecha" },
  { id: "music", label: "Music" },
  { id: "mystery", label: "Mystery" },
  { id: "psychological", label: "Psychological" },
  { id: "romance", label: "Romance" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "slice-of-life", label: "Slice of Life" },
  { id: "sports", label: "Sports" },
  { id: "supernatural", label: "Supernatural" },
  { id: "thriller", label: "Thriller" },
];

export default Tags;