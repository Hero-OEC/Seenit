import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, CheckCircle, Star } from "lucide-react";
import type { UserContent } from "@/types/content";

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-1";

export default function PersonalLists() {
  const { data: watching = [] } = useQuery<UserContent[]>({
    queryKey: ["/api/users", MOCK_USER_ID, "content/status/watching"],
  });

  const { data: watchlist = [] } = useQuery<UserContent[]>({
    queryKey: ["/api/users", MOCK_USER_ID, "content/status/want_to_watch"],
  });

  const { data: watched = [] } = useQuery<UserContent[]>({
    queryKey: ["/api/users", MOCK_USER_ID, "content/status/watched"],
  });

  const ListSection = ({ 
    title, 
    icon: Icon, 
    data, 
    bgColor, 
    viewAllLink, 
    testId 
  }: {
    title: string;
    icon: any;
    data: UserContent[];
    bgColor: string;
    viewAllLink: string;
    testId: string;
  }) => (
    <div className={`${bgColor} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-lg text-retro-dark">{title}</h4>
        <Icon className="h-5 w-5 text-retro-main" />
      </div>
      
      <div className="space-y-3" data-testid={testId}>
        {data.slice(0, 2).map((userContent) => {
          if (!userContent.content) return null;
          
          const content = userContent.content;
          return (
            <div key={userContent.id} className="flex items-center space-x-3 bg-white rounded-xl p-3">
              <img 
                src={content.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=80"} 
                alt={`${content.title} thumbnail`} 
                className="w-12 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h5 className="font-medium text-retro-dark truncate" data-testid={`text-${testId}-title`}>
                  {content.title}
                </h5>
                <p className="text-sm text-gray-600" data-testid={`text-${testId}-info`}>
                  {userContent.status === "watching" && content.episodes 
                    ? `Ep ${userContent.progress || 0} of ${content.episodes}`
                    : content.type === "movie" 
                      ? `Movie • ${content.year}`
                      : `${content.episodes} episodes • ${content.year}`
                  }
                </p>
                {userContent.status === "watching" && content.episodes && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-retro-main h-2 rounded-full" 
                      style={{ width: `${((userContent.progress || 0) / content.episodes) * 100}%` }}
                    ></div>
                  </div>
                )}
                {userContent.userRating && userContent.status === "watched" && (
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < userContent.userRating! ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">
                      Your rating: {userContent.userRating}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {data.length > 2 && (
        <Link href={viewAllLink}>
          <Button 
            variant="ghost"
            className="w-full mt-4 text-retro-main font-medium hover:underline"
            data-testid={`button-view-all-${testId}`}
          >
            View All ({data.length - 2} more)
          </Button>
        </Link>
      )}
      
      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-retro-dark text-sm">Nothing here yet!</p>
        </div>
      )}
    </div>
  );

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="font-retro text-3xl text-retro-main mb-8">Your Personal Lists</h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <ListSection
            title="Currently Watching"
            icon={Play}
            data={watching}
            bgColor="bg-retro-secondary"
            viewAllLink="/my-lists?tab=watching"
            testId="watching-list"
          />
          
          <ListSection
            title="Want to Watch"
            icon={Bookmark}
            data={watchlist}
            bgColor="bg-retro-accent"
            viewAllLink="/my-lists?tab=watchlist"
            testId="watchlist"
          />
          
          <ListSection
            title="Recently Watched"
            icon={CheckCircle}
            data={watched}
            bgColor="bg-retro-secondary"
            viewAllLink="/my-lists?tab=watched"
            testId="watched-list"
          />
        </div>
      </div>
    </section>
  );
}
