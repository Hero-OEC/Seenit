import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bookmark, Play, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Content, UserContent } from "@/types/content";

interface ContentCardProps {
  content: Content;
  userContent?: UserContent;
}

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-1";

export default function ContentCard({ content, userContent }: ContentCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(!!userContent);

  const addToListMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("POST", `/api/users/${MOCK_USER_ID}/content`, {
        contentId: content.id,
        status,
        progress: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", MOCK_USER_ID] });
      setIsBookmarked(true);
      toast({
        title: "Added to list",
        description: `${content.title} has been added to your list.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add content to your list.",
        variant: "destructive",
      });
    }
  });

  const removeFromListMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/users/${MOCK_USER_ID}/content/${content.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", MOCK_USER_ID] });
      setIsBookmarked(false);
      toast({
        title: "Removed from list",
        description: `${content.title} has been removed from your list.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove content from your list.",
        variant: "destructive",
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/users/${MOCK_USER_ID}/content/${content.id}`, {
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", MOCK_USER_ID] });
      toast({
        title: "Status updated",
        description: `${content.title} status has been updated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update content status.",
        variant: "destructive",
      });
    }
  });

  const handleToggleWatchlist = () => {
    if (userContent) {
      removeFromListMutation.mutate();
    } else {
      addToListMutation.mutate("want_to_watch");
    }
  };

  const handleStartWatching = () => {
    if (userContent) {
      updateStatusMutation.mutate("watching");
    } else {
      addToListMutation.mutate("watching");
    }
  };

  const handleMarkWatched = () => {
    if (userContent) {
      updateStatusMutation.mutate("watched");
    } else {
      addToListMutation.mutate("watched");
    }
  };

  const getMainAction = () => {
    if (userContent?.status === "watching") {
      return (
        <Button 
          onClick={handleMarkWatched}
          className="w-full bg-green-600 text-white py-2 rounded-xl font-medium hover:bg-green-700 transition-colors"
          data-testid="button-mark-watched"
        >
          <Check className="h-4 w-4 mr-1" />
          Mark Watched
        </Button>
      );
    } else if (userContent?.status === "watched") {
      return (
        <Button 
          onClick={handleStartWatching}
          className="w-full bg-retro-main text-white py-2 rounded-xl font-medium hover:bg-retro-dark transition-colors"
          data-testid="button-rewatch"
        >
          <Play className="h-4 w-4 mr-1" />
          Rewatch
        </Button>
      );
    } else if (content.type === "tv" || content.type === "anime") {
      return (
        <Button 
          onClick={handleStartWatching}
          className="w-full bg-retro-main text-white py-2 rounded-xl font-medium hover:bg-retro-dark transition-colors"
          data-testid="button-start-watching"
        >
          <Play className="h-4 w-4 mr-1" />
          {userContent?.status === "want_to_watch" ? "Start Watching" : "Start Watching"}
        </Button>
      );
    } else {
      return (
        <Button 
          onClick={handleMarkWatched}
          className="w-full bg-retro-main text-white py-2 rounded-xl font-medium hover:bg-retro-dark transition-colors"
          data-testid="button-view-details"
        >
          View Details
        </Button>
      );
    }
  };

  const getStatusBadge = () => {
    if (content.status === "airing") {
      return (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          AIRING
        </div>
      );
    }
    return null;
  };

  const getProgressInfo = () => {
    if (userContent?.status === "watching" && (content.type === "tv" || content.type === "anime")) {
      const progress = userContent.progress || 0;
      const total = content.episodes || 0;
      return `Ep ${progress} of ${total}`;
    } else if (content.type === "tv" || content.type === "anime") {
      return `${content.episodes} episodes • ${content.year}`;
    }
    return content.year?.toString() || "";
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1" data-testid={`content-card-${content.id}`}>
      <div className="relative">
        <img 
          src={content.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450"} 
          alt={`${content.title} poster`} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleWatchlist}
            className={`p-2 rounded-full shadow-md transition-colors ${
              isBookmarked || userContent 
                ? 'bg-yellow-400 hover:bg-yellow-300' 
                : 'bg-retro-accent hover:bg-retro-secondary'
            }`}
            data-testid="button-toggle-watchlist"
          >
            <Bookmark className={`h-4 w-4 text-retro-main ${isBookmarked || userContent ? 'fill-current' : ''}`} />
          </Button>
        </div>
        {content.rating && (
          <div className="absolute bottom-2 left-2 bg-retro-main text-white px-2 py-1 rounded-full text-xs font-semibold">
            {content.rating}
          </div>
        )}
        {getStatusBadge()}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-retro-dark mb-1 truncate" data-testid="text-content-title">
          {content.title}
        </h4>
        <p className="text-sm text-gray-600 mb-2" data-testid="text-content-info">
          {getProgressInfo()}
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          {content.genre?.slice(0, 2).map((genre) => (
            <span 
              key={genre}
              className="bg-retro-secondary text-retro-dark px-2 py-1 rounded-full text-xs"
              data-testid={`badge-genre-${genre.toLowerCase()}`}
            >
              {genre}
            </span>
          ))}
        </div>
        {userContent?.userRating && (
          <div className="flex items-center mb-3">
            <div className="flex text-yellow-400 text-xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < userContent.userRating! ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">Your rating: {userContent.userRating}/5</span>
          </div>
        )}
        {getMainAction()}
      </div>
    </div>
  );
}
