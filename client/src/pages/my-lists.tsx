import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ContentCard from "@/components/content-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Bookmark, CheckCircle } from "lucide-react";
import type { UserContent } from "@/types/content";

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-1";

export default function MyLists() {
  const [activeTab, setActiveTab] = useState("watching");

  const { data: watching = [], isLoading: watchingLoading } = useQuery<UserContent[]>({
    queryKey: ["/api/users", MOCK_USER_ID, "content/status/watching"],
  });

  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery<UserContent[]>({
    queryKey: ["/api/users", MOCK_USER_ID, "content/status/want_to_watch"],
  });

  const { data: watched = [], isLoading: watchedLoading } = useQuery<UserContent[]>({
    queryKey: ["/api/users", MOCK_USER_ID, "content/status/watched"],
  });

  const isLoading = watchingLoading || watchlistLoading || watchedLoading;

  const getActiveData = () => {
    switch (activeTab) {
      case "watching": return watching;
      case "watchlist": return watchlist;
      case "watched": return watched;
      default: return [];
    }
  };

  const activeData = getActiveData();

  const LoadingGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
          <div className="w-full h-64 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-retro-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-retro text-4xl text-retro-main mb-4">My Lists</h1>
          <p className="text-retro-dark text-lg">
            Manage your entertainment tracking lists
          </p>
        </div>

        {/* List Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white rounded-2xl shadow-lg p-2">
            <TabsTrigger 
              value="watching" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white flex items-center gap-2"
              data-testid="tab-watching"
            >
              <Play className="h-4 w-4" />
              Currently Watching ({watching.length})
            </TabsTrigger>
            <TabsTrigger 
              value="watchlist" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white flex items-center gap-2"
              data-testid="tab-watchlist"
            >
              <Bookmark className="h-4 w-4" />
              Want to Watch ({watchlist.length})
            </TabsTrigger>
            <TabsTrigger 
              value="watched" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white flex items-center gap-2"
              data-testid="tab-watched"
            >
              <CheckCircle className="h-4 w-4" />
              Watched ({watched.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watching" className="mt-8">
            {isLoading ? (
              <LoadingGrid />
            ) : watching.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="watching-grid">
                {watching.map((userContent) => (
                  userContent.content && (
                    <ContentCard 
                      key={userContent.id} 
                      content={userContent.content}
                      userContent={userContent}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Play className="h-16 w-16 text-retro-main mx-auto mb-4" />
                <h3 className="font-retro text-2xl text-retro-main mb-2">Nothing Currently Watching</h3>
                <p className="text-retro-dark">Start watching something to see it here!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="mt-8">
            {isLoading ? (
              <LoadingGrid />
            ) : watchlist.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="watchlist-grid">
                {watchlist.map((userContent) => (
                  userContent.content && (
                    <ContentCard 
                      key={userContent.id} 
                      content={userContent.content}
                      userContent={userContent}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Bookmark className="h-16 w-16 text-retro-main mx-auto mb-4" />
                <h3 className="font-retro text-2xl text-retro-main mb-2">No Watchlist Items</h3>
                <p className="text-retro-dark">Add content to your watchlist to see it here!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="watched" className="mt-8">
            {isLoading ? (
              <LoadingGrid />
            ) : watched.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="watched-grid">
                {watched.map((userContent) => (
                  userContent.content && (
                    <ContentCard 
                      key={userContent.id} 
                      content={userContent.content}
                      userContent={userContent}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle className="h-16 w-16 text-retro-main mx-auto mb-4" />
                <h3 className="font-retro text-2xl text-retro-main mb-2">Nothing Watched Yet</h3>
                <p className="text-retro-dark">Mark content as watched to see it here!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
