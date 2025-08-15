import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ContentCard from "./content-card";
import CategoryTabs from "./category-tabs";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc } from "lucide-react";
import type { Content } from "@/types/content";

export default function ContentGrid() {
  const [selectedCategory, setSelectedCategory] = useState("movies");

  const { data: content = [], isLoading } = useQuery<Content[]>({
    queryKey: selectedCategory === "all" ? ["/api/content"] : ["/api/content/type", selectedCategory],
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <section className="py-12 bg-retro-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-retro text-3xl text-retro-main">Currently Trending</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow text-retro-main border-retro-secondary"
              data-testid="button-filter-content"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow text-retro-main border-retro-secondary"
              data-testid="button-sort-content"
            >
              <SortAsc className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <CategoryTabs onCategoryChange={handleCategoryChange} />

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="w-full h-64 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-2 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : content.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-8" data-testid="trending-content-grid">
            {content.slice(0, 6).map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 mt-8">
            <div className="text-retro-main text-6xl mb-4">🎬</div>
            <h4 className="font-retro text-2xl text-retro-main mb-2">No Content Available</h4>
            <p className="text-retro-dark">Check back later for new content!</p>
          </div>
        )}
      </div>
    </section>
  );
}
