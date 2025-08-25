import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Tag } from "@/components/Tags";
import ContentDisplay from "@/components/ContentDisplay";
import { Calendar, Tv, ChevronDown, ChevronRight } from "lucide-react";
import SharinganIcon from "@/components/icons/SharinganIcon";
import type { Content } from "@shared/schema";

type ContentType = "tv" | "anime";
type SortBy = "popular" | "new" | "reviews" | "air_date";

export default function Schedule() {
  const [activeContentType, setActiveContentType] = useState<ContentType>("tv");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("air_date");
  const [location] = useLocation();
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([0])); // Today is open by default

  // Parse URL parameters to set initial content type
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const typeParam = urlParams.get('type');
    if (typeParam && ['tv', 'anime'].includes(typeParam)) {
      setActiveContentType(typeParam as ContentType);
    }
  }, [location]);

  const contentTypeConfig = {
    tv: {
      label: "TV Shows",
      icon: Tv,
      description: "Current and upcoming TV series"
    },
    anime: {
      label: "Anime",
      icon: SharinganIcon,
      description: "Current and upcoming anime series"
    }
  };

  const sortOptions = [
    { value: "air_date", label: "Air Date" },
    { value: "popular", label: "Most Popular" },
    { value: "new", label: "Recently Added" },
    { value: "reviews", label: "Highest Rated" }
  ];

  // Fetch content data
  const { data: content = [], isLoading } = useQuery<Content[]>({
    queryKey: ['/api/content/type', activeContentType],
    enabled: true
  });

  // Get unique genres for the selected content type
  const genres = ["all", ...Array.from(new Set(
    content.flatMap((item) => item.genre || [])
  ))];

  // Filter and sort content
  const filteredAndSortedContent = content
    .filter((item) => {
      if (selectedGenre === "all") return true;
      return item.genre?.includes(selectedGenre);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "air_date":
          return (Number(b.year) || 0) - (Number(a.year) || 0);
        case "popular":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case "new":
          return b.id.localeCompare(a.id);
        case "reviews":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        default:
          return 0;
      }
    });

  // Generate 7 days starting from today
  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      days.push({
        index: i,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()],
        fullDayName: dayNames[date.getDay()],
        date: date.getDate(),
        month: monthNames[date.getMonth()],
        fullDate: date,
        isToday: i === 0
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();

  // Toggle day section open/closed
  const toggleDay = (dayIndex: number) => {
    const newOpenDays = new Set(openDays);
    if (newOpenDays.has(dayIndex)) {
      newOpenDays.delete(dayIndex);
    } else {
      newOpenDays.add(dayIndex);
    }
    setOpenDays(newOpenDays);
  };

  // Mock episode data and distribute across the week
  const getEpisodeInfo = (item: Content, dayIndex: number) => {
    const currentSeason = Math.floor(Math.random() * 5) + 1;
    const currentEpisode = Math.floor(Math.random() * 12) + 1;
    
    return {
      currentSeason,
      currentEpisode,
      status: Math.random() > 0.5 ? "Airing" : "Upcoming"
    };
  };

  // Distribute content across the week for each day
  const getContentForDay = (dayIndex: number) => {
    const shuffledContent = [...filteredAndSortedContent].sort(() => Math.random() - 0.5);
    const contentPerDay = Math.ceil(shuffledContent.length / 7);
    const startIndex = dayIndex * contentPerDay;
    const endIndex = Math.min(startIndex + contentPerDay, shuffledContent.length);
    
    return shuffledContent.slice(startIndex, endIndex);
  };

  return (
    <div className="min-h-screen bg-retro-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-retro-600" />
            <h1 className="text-4xl font-bold text-retro-900">Schedule</h1>
          </div>
          <p className="text-retro-600 text-lg">
            Keep track of your favorite shows and upcoming episodes
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Content Type Switches */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-retro-900 mb-4">Browse by Type</h2>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(contentTypeConfig) as [ContentType, typeof contentTypeConfig[ContentType]][]).map(([type, config]) => {
                  const IconComponent = config.icon;
                  const isActive = activeContentType === type;
                  
                  return (
                    <Button
                      key={type}
                      variant={isActive ? "default" : "outline"}
                      size="lg"
                      onClick={() => setActiveContentType(type)}
                      className={`flex items-center gap-2 ${
                        isActive 
                          ? "bg-retro-600 hover:bg-retro-700 text-white" 
                          : "border-retro-300 text-retro-700 hover:bg-retro-100 hover:text-retro-900"
                      }`}
                      data-testid={`button-content-type-${type}`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Weekly Schedule Sections */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg p-4 shadow-sm">
                      <div className="bg-retro-200 rounded h-4 w-36 mb-3"></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className="bg-retro-200 rounded-lg aspect-[16/9]"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                weekDays.map((day) => {
                  const dayContent = getContentForDay(day.index);
                  const isOpen = openDays.has(day.index);
                  
                  return (
                    <div key={day.index} className="bg-white rounded-lg shadow-sm border border-retro-200 overflow-hidden">
                      {/* Day Header - Always visible */}
                      <button
                        onClick={() => toggleDay(day.index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-retro-50 transition-colors text-left"
                        data-testid={`day-header-${day.index}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            day.isToday 
                              ? 'bg-retro-500 text-white' 
                              : 'bg-retro-100 text-retro-700'
                          }`}>
                            <span className="font-bold text-sm">{day.date}</span>
                          </div>
                          <div>
                            <h2 className={`text-lg font-semibold ${
                              day.isToday ? 'text-retro-900' : 'text-retro-800'
                            }`}>
                              {day.dayName}
                              {day.isToday && <span className="ml-2 text-xs font-normal text-retro-600">• What's New</span>}
                            </h2>
                            <p className="text-xs text-retro-500">
                              {day.month} {day.date} • {dayContent.length} show{dayContent.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-retro-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-retro-400" />
                          )}
                        </div>
                      </button>

                      {/* Day Content - Collapsible */}
                      {isOpen && (
                        <div className="border-t border-retro-200 p-4">
                          {dayContent.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {dayContent.map((item) => {
                                const episodeInfo = getEpisodeInfo(item, day.index);
                                
                                return (
                                  <div key={`${day.index}-${item.id}`} className="group">
                                    <ContentDisplay
                                      posterUrl={item.poster || `https://picsum.photos/300/450?random=${item.id}`}
                                      title={item.title}
                                      type={activeContentType as "tv" | "anime"}
                                      status={episodeInfo.status === "Airing" ? "ongoing" : "coming-soon"}
                                      season={episodeInfo.currentSeason}
                                      episode={episodeInfo.currentEpisode}
                                      size="small"
                                      onClick={() => console.log(`Clicked ${item.title}`)}
                                      className="w-full"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Calendar className="w-8 h-8 mx-auto text-retro-300 mb-2" />
                              <p className="text-sm text-retro-500">No shows scheduled for this day</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {!isLoading && filteredAndSortedContent.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-retro-400 mb-4">
                    <Calendar className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-retro-900 mb-2">No shows found</h3>
                  <p className="text-retro-600">Try adjusting your filters or check back later</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Filters */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm border border-retro-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-retro-900 mb-4">Filters & Sort</h3>
              
              {/* Sort Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-retro-700 mb-2">Sort by</label>
                <Input
                  inputType="select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  options={sortOptions.map(option => ({ value: option.value, label: option.label }))}
                  data-testid="select-sort-by"
                />
              </div>

              {/* Genre Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-retro-700 mb-2">Genre</label>
                <Input
                  inputType="select"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  options={genres.map(genre => ({ 
                    value: genre, 
                    label: genre === "all" ? "All Genres" : genre.charAt(0).toUpperCase() + genre.slice(1) 
                  }))}
                  data-testid="select-genre"
                />
              </div>

              {/* Statistics */}
              <div className="mt-6 pt-6 border-t border-retro-200">
                <div className="text-sm text-retro-600">
                  <div className="flex justify-between mb-2">
                    <span>Total {contentTypeConfig[activeContentType].label.toLowerCase()}:</span>
                    <span className="font-medium" data-testid="text-total-count">{content?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Showing:</span>
                    <span className="font-medium" data-testid="text-filtered-count">{filteredAndSortedContent.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}