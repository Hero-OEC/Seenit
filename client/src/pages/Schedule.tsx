import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Tag } from "@/components/Tags";
import ContentDisplay from "@/components/ContentDisplay";
import { Calendar, Tv, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import SharinganIcon from "@/components/icons/SharinganIcon";
import type { Content } from "@shared/schema";

type ContentType = "tv" | "anime";
type SortBy = "popular" | "new" | "reviews" | "air_date";

export default function Schedule() {
  const [activeContentType, setActiveContentType] = useState<ContentType>("tv");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("air_date");
  const [location] = useLocation();
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1])); // Today is open by default (index 1 now)

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

  // Generate 7 days: tomorrow, today, and 5 previous days
  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate days from tomorrow to 5 days ago
    // Day offset: +1 (tomorrow), 0 (today), -1 (yesterday), -2, -3, -4, -5
    const dayOffsets = [1, 0, -1, -2, -3, -4, -5];
    
    dayOffsets.forEach((offset, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      
      let dayName;
      if (offset === 1) dayName = 'Tomorrow';
      else if (offset === 0) dayName = 'Today';
      else if (offset === -1) dayName = 'Yesterday';
      else dayName = dayNames[date.getDay()];
      
      days.push({
        index,
        dayName,
        fullDayName: dayNames[date.getDay()],
        date: date.getDate(),
        month: monthNames[date.getMonth()],
        fullDate: date,
        isToday: offset === 0
      });
    });
    
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

  // Load all episodes for all days at once
  const { data: allWeekEpisodes = [], isLoading: isLoadingAllEpisodes } = useQuery<any[]>({
    queryKey: ["/api/content/schedule/week", activeContentType],
    queryFn: async () => {
      const allEpisodes: any[] = [];
      
      // Fetch episodes for all 7 days
      for (const day of weekDays) {
        try {
          const response = await fetch(`/api/content/schedule/${day.fullDate.toISOString().split('T')[0]}?type=${activeContentType}`);
          if (response.ok) {
            const dayEpisodes = await response.json();
            // Add day info to each episode
            const episodesWithDay = dayEpisodes.map((episode: any) => ({
              ...episode,
              dayInfo: {
                dayName: day.dayName,
                fullDayName: day.fullDayName,
                date: day.date,
                month: day.month,
                isToday: day.isToday,
                fullDate: day.fullDate
              }
            }));
            allEpisodes.push(...episodesWithDay);
          }
        } catch (error) {
          console.error(`Failed to fetch episodes for ${day.dayName}:`, error);
        }
      }
      
      return allEpisodes;
    },
  });

  // Group episodes by day for display
  const episodesByDay = allWeekEpisodes.reduce((acc: Record<string, { day: any, episodes: any[] }>, episode: any) => {
    const dayKey = episode.dayInfo.dayName;
    if (!acc[dayKey]) {
      acc[dayKey] = {
        day: episode.dayInfo,
        episodes: []
      };
    }
    acc[dayKey].episodes.push(episode);
    return acc;
  }, {} as Record<string, { day: any, episodes: any[] }>);

  // Component for each day's content
  function DayContent({ day, isOpen }: { day: any, isOpen: boolean }) {
    const dayKey = day.dayName;
    const dayData = episodesByDay[dayKey];
    const dayContent = dayData?.episodes || [];

    if (!isOpen) return null;

    // Show loading only if we're still loading and have no data at all
    if (isLoadingAllEpisodes && allWeekEpisodes.length === 0) {
      return (
        <div className="p-6 border-t border-retro-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-retro-200 rounded-lg aspect-[2/3] mb-3"></div>
                <div className="bg-retro-200 rounded h-4 mb-2"></div>
                <div className="bg-retro-200 rounded h-3 w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Show empty state if no episodes for this day
    if (dayContent.length === 0) {
      return (
        <div className="p-6 border-t border-retro-200">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-retro-400 mb-3" />
            <p className="text-retro-600">No {activeContentType === 'tv' ? 'TV shows' : 'anime'} scheduled for {day.dayName}</p>
          </div>
        </div>
      );
    }

    // Show all episodes for this day immediately
    return (
      <div className="p-6 border-t border-retro-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {dayContent.map((episode: any) => {
            const getContentStatus = () => {
              if (episode.status === "airing") return "ongoing";
              if (episode.status === "upcoming") return "coming-soon";
              if (episode.status === "completed") return "finished";
              return "finished";
            };

            return (
              <ContentDisplay
                key={`${episode.contentId}-${episode.id}`}
                id={episode.contentId}
                posterUrl={episode.image?.medium || `https://picsum.photos/300/450?random=${episode.contentId}`}
                title={episode.showTitle}
                type={activeContentType}
                status={getContentStatus()}
                year={episode.airdate ? new Date(episode.airdate).getFullYear() : undefined}
                season={episode.season || 1}
                episode={episode.number}
                episodeTitle={episode.name}
                airDate={episode.airdate}
                size="small"
                onClick={() => console.log(`Clicked on ${episode.showTitle} S${episode.season}E${episode.number}`)}
                data-testid={`schedule-episode-${episode.contentId}-${episode.id}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-retro-900 mb-2">Schedule</h1>
          <p className="text-retro-700">See what's airing this week</p>
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

            {/* Weekly Schedule */}
            <div className="bg-white rounded-lg shadow-sm border border-retro-200 overflow-hidden">
              <div className="p-6 border-b border-retro-200">
                <h2 className="text-xl font-semibold text-retro-900 mb-2">This Week's Schedule</h2>
                <p className="text-retro-600">Click on a day to see what's airing</p>
              </div>
              
              {weekDays.map((day) => {
                const isOpen = openDays.has(day.index);
                
                return (
                  <div key={day.index} className="border-b border-retro-200 last:border-b-0">
                    <button
                      onClick={() => toggleDay(day.index)}
                      className={`w-full p-6 text-left hover:bg-retro-50 transition-colors duration-200 flex items-center justify-between ${
                        day.isToday ? 'bg-retro-100' : ''
                      }`}
                      data-testid={`button-toggle-day-${day.index}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`text-center ${day.isToday ? 'text-retro-700' : 'text-retro-600'}`}>
                          <div className="text-xs font-medium uppercase tracking-wide">{day.month}</div>
                          <div className={`text-2xl font-bold ${day.isToday ? 'text-retro-900' : 'text-retro-800'}`}>
                            {day.date}
                          </div>
                        </div>
                        <div>
                          <div className={`text-lg font-semibold ${day.isToday ? 'text-retro-900' : 'text-retro-800'}`}>
                            {day.dayName}
                          </div>
                          <div className="text-sm text-retro-600">{day.fullDayName}</div>
                        </div>
                        {day.isToday && (
                          <Tag size="sm" className="bg-retro-600 text-white">Today</Tag>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-retro-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-retro-600" />
                        )}
                      </div>
                    </button>
                    
                    <DayContent day={day} isOpen={isOpen} />
                  </div>
                );
              })}
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
                  options={[
                    { value: "all", label: "All Genres" },
                    { value: "action", label: "Action" },
                    { value: "adventure", label: "Adventure" },
                    { value: "animation", label: "Animation" },
                    { value: "comedy", label: "Comedy" },
                    { value: "crime", label: "Crime" },
                    { value: "documentary", label: "Documentary" },
                    { value: "drama", label: "Drama" },
                    { value: "family", label: "Family" },
                    { value: "fantasy", label: "Fantasy" },
                    { value: "horror", label: "Horror" },
                    { value: "mystery", label: "Mystery" },
                    { value: "romance", label: "Romance" },
                    { value: "sci-fi", label: "Sci-Fi" },
                    { value: "thriller", label: "Thriller" },
                    { value: "war", label: "War" },
                    { value: "western", label: "Western" }
                  ]}
                  data-testid="select-genre"
                />
              </div>

              {/* Help text */}
              <div className="text-sm text-retro-600">
                <p>Click on any day to see what's scheduled to air. All episodes are pre-loaded for instant viewing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}