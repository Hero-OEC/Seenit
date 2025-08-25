import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Users, UserPlus, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ContentDisplay from "@/components/ContentDisplay";

// Mock data for development - will be replaced with real API data
const mockFriends = [
  { id: "1", username: "MovieBuff92", email: "movie@example.com", avatar: "", mutualFriends: 5, status: "online" },
  { id: "2", username: "AnimeKing", email: "anime@example.com", avatar: "", mutualFriends: 3, status: "offline" },
  { id: "3", username: "SeriesFan", email: "series@example.com", avatar: "", mutualFriends: 8, status: "online" }
];

const mockFriendRequests = [
  { id: "4", username: "NewUser123", email: "new@example.com", avatar: "", mutualFriends: 2 },
  { id: "5", username: "CinemaLover", email: "cinema@example.com", avatar: "", mutualFriends: 1 }
];

const mockSearchResults = [
  { id: "6", username: "SearchUser1", email: "search1@example.com", avatar: "", mutualFriends: 0 },
  { id: "7", username: "SearchUser2", email: "search2@example.com", avatar: "", mutualFriends: 4 }
];

const mockWatchHistory = {
  movies: [
    {
      id: "movie-1",
      title: "Dune: Part Two",
      posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      type: "movie" as const,
      year: 2024,
      watchedDate: "2024-01-15",
      rating: 9
    },
    {
      id: "movie-2", 
      title: "Spider-Man: No Way Home",
      posterUrl: "https://image.tmdb.org/t/p/w500/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg",
      type: "movie" as const,
      year: 2021,
      watchedDate: "2024-01-10",
      rating: 8
    }
  ],
  tv: [
    {
      id: "tv-1",
      title: "Breaking Bad",
      posterUrl: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
      type: "tv" as const,
      season: 5,
      episode: 16,
      watchedDate: "2024-01-12",
      rating: 10
    }
  ],
  anime: [
    {
      id: "anime-1",
      title: "Attack on Titan",
      posterUrl: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
      type: "anime" as const,
      season: 4,
      episode: 28,
      watchedDate: "2024-01-08",
      rating: 9
    }
  ]
};

export default function Profile() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [activeContentTab, setActiveContentTab] = useState("movies");
  const [searchResults, setSearchResults] = useState(mockSearchResults);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Mock search - in real app this would call the API
    if (query.trim()) {
      setSearchResults(mockSearchResults.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase())
      ));
    } else {
      setSearchResults(mockSearchResults);
    }
  };

  const handleSendFriendRequest = (userId: string) => {
    console.log("Sending friend request to:", userId);
  };

  const handleAcceptFriendRequest = (userId: string) => {
    console.log("Accepting friend request from:", userId);
  };

  const handleDeclineFriendRequest = (userId: string) => {
    console.log("Declining friend request from:", userId);
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-50">
        <p className="text-retro-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8" data-testid="profile-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-retro-100 flex items-center justify-center" data-testid="profile-avatar">
              <span className="text-2xl font-bold text-retro-700">
                {getUserInitials(user.name)}
              </span>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-retro-900 mb-2" data-testid="profile-username">
                {user.name}
              </h1>
              <p className="text-retro-600 mb-4" data-testid="profile-email">{user.email}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-retro-600">
                <div className="flex items-center gap-2" data-testid="profile-stats-friends">
                  <Users size={16} />
                  <span>{mockFriends.length} Friends</span>
                </div>
                <div className="flex items-center gap-2" data-testid="profile-stats-watched">
                  <Eye size={16} />
                  <span>{Object.values(mockWatchHistory).flat().length} Watched</span>
                </div>
                <div className="flex items-center gap-2" data-testid="profile-stats-joined">
                  <Clock size={16} />
                  <span>Joined January 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Friends & Social */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md" data-testid="friends-section">
              <div className="flex items-center gap-2 mb-6">
                <Users size={20} />
                <h2 className="text-xl font-bold text-retro-900">Social</h2>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6" data-testid="social-tabs">
                <Button 
                  variant={activeTab === "friends" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTab("friends")}
                  data-testid="tab-friends"
                >
                  Friends
                </Button>
                <Button 
                  variant={activeTab === "requests" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTab("requests")}
                  data-testid="tab-requests"
                  className="relative"
                >
                  Requests
                  {mockFriendRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {mockFriendRequests.length}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant={activeTab === "search" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTab("search")}
                  data-testid="tab-search"
                >
                  Search
                </Button>
              </div>

              {/* Friends List */}
              {activeTab === "friends" && (
                <div className="space-y-4" data-testid="friends-list">
                  {mockFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-retro-50 rounded-lg" data-testid={`friend-${friend.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-retro-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-retro-700">
                            {getUserInitials(friend.username)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-retro-900">{friend.username}</p>
                          <p className="text-xs text-retro-600">
                            {friend.mutualFriends} mutual friends
                          </p>
                        </div>
                      </div>
                      <Badge variant={friend.status === "online" ? "default" : "secondary"}>
                        {friend.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Friend Requests */}
              {activeTab === "requests" && (
                <div className="space-y-4" data-testid="friend-requests">
                  {mockFriendRequests.length === 0 ? (
                    <p className="text-center text-retro-600 py-4">No pending requests</p>
                  ) : (
                    mockFriendRequests.map((request) => (
                      <div key={request.id} className="p-3 bg-retro-50 rounded-lg" data-testid={`friend-request-${request.id}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-retro-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-retro-700">
                              {getUserInitials(request.username)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-retro-900">{request.username}</p>
                            <p className="text-xs text-retro-600">
                              {request.mutualFriends} mutual friends
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptFriendRequest(request.id)}
                            data-testid={`accept-request-${request.id}`}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclineFriendRequest(request.id)}
                            data-testid={`decline-request-${request.id}`}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* User Search */}
              {activeTab === "search" && (
                <div className="space-y-4" data-testid="user-search">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-retro-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search for users..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-retro-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-retro-500 focus:border-retro-500"
                      data-testid="search-users-input"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {searchResults.map((searchUser) => (
                      <div key={searchUser.id} className="flex items-center justify-between p-3 bg-retro-50 rounded-lg" data-testid={`search-result-${searchUser.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-retro-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-retro-700">
                              {getUserInitials(searchUser.username)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-retro-900">{searchUser.username}</p>
                            {searchUser.mutualFriends > 0 && (
                              <p className="text-xs text-retro-600">
                                {searchUser.mutualFriends} mutual friends
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendFriendRequest(searchUser.id)}
                          data-testid={`send-request-${searchUser.id}`}
                        >
                          <UserPlus size={14} className="mr-2" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Viewing History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-md" data-testid="watch-history-section">
              <div className="flex items-center gap-2 mb-6">
                <Eye size={20} />
                <h2 className="text-xl font-bold text-retro-900">Viewing History</h2>
              </div>
              
              {/* Content Type Tabs */}
              <div className="flex gap-2 mb-6" data-testid="content-type-tabs">
                <Button 
                  variant={activeContentTab === "movies" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveContentTab("movies")}
                  data-testid="tab-movies"
                >
                  Movies ({mockWatchHistory.movies.length})
                </Button>
                <Button 
                  variant={activeContentTab === "tv" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveContentTab("tv")}
                  data-testid="tab-tv"
                >
                  TV Shows ({mockWatchHistory.tv.length})
                </Button>
                <Button 
                  variant={activeContentTab === "anime" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveContentTab("anime")}
                  data-testid="tab-anime"
                >
                  Anime ({mockWatchHistory.anime.length})
                </Button>
              </div>

              {/* Movies History */}
              {activeContentTab === "movies" && (
                <div className="space-y-4" data-testid="movies-history">
                  {mockWatchHistory.movies.length === 0 ? (
                    <p className="text-center text-retro-600 py-8">No movies watched yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockWatchHistory.movies.map((movie) => (
                        <div key={movie.id} className="space-y-2" data-testid={`movie-history-${movie.id}`}>
                          <ContentDisplay
                            id={movie.id}
                            posterUrl={movie.posterUrl}
                            title={movie.title}
                            type={movie.type}
                            year={movie.year}
                            status="finished"
                            size="small"
                            onClick={() => console.log(`View ${movie.title}`)}
                          />
                          <div className="text-sm text-retro-600 space-y-1">
                            <p>Watched: {new Date(movie.watchedDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-2">
                              <span>Rating:</span>
                              <div className="flex">
                                {Array.from({ length: 10 }, (_, i) => (
                                  <span key={i} className={i < movie.rating ? "text-yellow-400" : "text-retro-300"}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="ml-1">({movie.rating}/10)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TV Shows History */}
              {activeContentTab === "tv" && (
                <div className="space-y-4" data-testid="tv-history">
                  {mockWatchHistory.tv.length === 0 ? (
                    <p className="text-center text-retro-600 py-8">No TV shows watched yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockWatchHistory.tv.map((show) => (
                        <div key={show.id} className="space-y-2" data-testid={`tv-history-${show.id}`}>
                          <ContentDisplay
                            id={show.id}
                            posterUrl={show.posterUrl}
                            title={show.title}
                            type={show.type}
                            season={show.season}
                            episode={show.episode}
                            status="finished"
                            size="small"
                            onClick={() => console.log(`View ${show.title}`)}
                          />
                          <div className="text-sm text-retro-600 space-y-1">
                            <p>Watched: {new Date(show.watchedDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-2">
                              <span>Rating:</span>
                              <div className="flex">
                                {Array.from({ length: 10 }, (_, i) => (
                                  <span key={i} className={i < show.rating ? "text-yellow-400" : "text-retro-300"}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="ml-1">({show.rating}/10)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Anime History */}
              {activeContentTab === "anime" && (
                <div className="space-y-4" data-testid="anime-history">
                  {mockWatchHistory.anime.length === 0 ? (
                    <p className="text-center text-retro-600 py-8">No anime watched yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockWatchHistory.anime.map((anime) => (
                        <div key={anime.id} className="space-y-2" data-testid={`anime-history-${anime.id}`}>
                          <ContentDisplay
                            id={anime.id}
                            posterUrl={anime.posterUrl}
                            title={anime.title}
                            type={anime.type}
                            season={anime.season}
                            episode={anime.episode}
                            status="finished"
                            size="small"
                            onClick={() => console.log(`View ${anime.title}`)}
                          />
                          <div className="text-sm text-retro-600 space-y-1">
                            <p>Watched: {new Date(anime.watchedDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-2">
                              <span>Rating:</span>
                              <div className="flex">
                                {Array.from({ length: 10 }, (_, i) => (
                                  <span key={i} className={i < anime.rating ? "text-yellow-400" : "text-retro-300"}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="ml-1">({anime.rating}/10)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}