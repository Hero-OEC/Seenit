import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Film, Tv, Sparkles } from "lucide-react";

interface CategoryTabsProps {
  onCategoryChange?: (category: string) => void;
}

export default function CategoryTabs({ onCategoryChange }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState("movies");

  const categories = [
    { id: "movies", label: "Movies", icon: Film },
    { id: "tv", label: "TV Shows", icon: Tv },
    { id: "anime", label: "Anime", icon: Sparkles }
  ];

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <section className="py-8 bg-retro-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-1 bg-white p-2 rounded-2xl shadow-lg max-w-md mx-auto">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <Button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  isActive 
                    ? 'bg-retro-main text-white' 
                    : 'text-retro-main hover:bg-retro-secondary bg-transparent'
                }`}
                data-testid={`button-category-${category.id}`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
