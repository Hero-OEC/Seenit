import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ContentCard from "@/components/content-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, SortAsc } from "lucide-react";
import type { Content } from "@/types/content";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: allContent = [], isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });

  const { data: searchResults = [] } = useQuery<Content[]>({
    queryKey: ["/api/content/search", searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(`/api/content/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    }
  });

  const { data: movies = [] } = useQuery<Content[]>({
    queryKey: ["/api/content/type/movie"],
  });

  const { data: tvShows = [] } = useQuery<Content[]>({
    queryKey: ["/api/content/type/tv"],
  });

  const { data: anime = [] } = useQuery<Content[]>({
    queryKey: ["/api/content/type/anime"],
  });

  const getDisplayedContent = () => {
    if (searchQuery) return searchResults;
    
    switch (activeTab) {
      case "movies": return movies;
      case "tv": return tvShows;
      case "anime": return anime;
      default: return allContent;
    }
  };

  const displayedContent = getDisplayedContent();

  return (
    <div className="min-h-screen bg-retro-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-retro text-4xl text-retro-main mb-4">Browse Content</h1>
          <p className="text-retro-dark text-lg">
            Discover your next favorite movie, TV show, or anime
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-retro-main h-5 w-5" />
            <Input
              type="text"
              placeholder="Search movies, shows, anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-2 border-retro-secondary rounded-full focus:border-retro-accent"
              data-testid="search-input"
            />
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline" className="border-retro-secondary text-retro-main hover:bg-retro-secondary" data-testid="button-filter">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="border-retro-secondary text-retro-main hover:bg-retro-secondary" data-testid="button-sort">
              <SortAsc className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white rounded-2xl shadow-lg p-2">
            <TabsTrigger 
              value="all" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white"
              data-testid="tab-all"
            >
              All Content
            </TabsTrigger>
            <TabsTrigger 
              value="movies" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white"
              data-testid="tab-movies"
            >
              Movies
            </TabsTrigger>
            <TabsTrigger 
              value="tv" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white"
              data-testid="tab-tv"
            >
              TV Shows
            </TabsTrigger>
            <TabsTrigger 
              value="anime" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold data-[state=active]:bg-retro-main data-[state=active]:text-white"
              data-testid="tab-anime"
            >
              Anime
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="w-full h-64 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : displayedContent.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="content-grid">
            {displayedContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-retro-main text-6xl mb-4">🎬</div>
            <h3 className="font-retro text-2xl text-retro-main mb-2">No Content Found</h3>
            <p className="text-retro-dark">
              {searchQuery 
                ? `No results found for "${searchQuery}"`
                : "No content available in this category"
              }
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
