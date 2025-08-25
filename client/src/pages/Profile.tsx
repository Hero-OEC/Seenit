import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoute, useLocation } from "wouter";
import { Search, Users, UserPlus, Eye, Clock, Edit, Settings, Upload, Save, X, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ContentDisplay from "@/components/ContentDisplay";
import Input from "@/components/Input";

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

const mockUserReviews = [
  {
    id: "review-1",
    contentId: "movie-1",
    title: "Dune: Part Two",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    type: "movie" as const,
    year: 2024,
    userRating: 5,
    userComment: "An absolutely stunning continuation of the Dune saga. The cinematography is breathtaking and the performances are top-notch. Denis Villeneuve has created a masterpiece that honors the source material while being visually spectacular.",
    reviewDate: "2024-01-16"
  },
  {
    id: "review-2",
    contentId: "tv-1",
    title: "Breaking Bad",
    posterUrl: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    type: "tv" as const,
    season: 5,
    episode: 16,
    userRating: 5,
    userComment: "One of the greatest TV series ever made. The character development of Walter White is incredible, and every episode keeps you on the edge of your seat. The finale was perfect.",
    reviewDate: "2024-01-13"
  },
  {
    id: "review-3",
    contentId: "anime-1",
    title: "Attack on Titan",
    posterUrl: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    type: "anime" as const,
    season: 4,
    episode: 28,
    userRating: 4,
    userComment: "An epic conclusion to an amazing series. The animation quality is outstanding and the story reaches a satisfying climax. Some pacing issues in the middle, but overall a fantastic experience.",
    reviewDate: "2024-01-09"
  }
];

// Mock data for friend profiles
const mockFriendProfiles = {
  "1": {
    id: "1",
    name: "MovieBuff92",
    username: "MovieBuff92",
    joinedDate: "October 2023",
    watchHistory: {
      movies: [
        {
          id: "movie-3",
          title: "The Batman",
          posterUrl: "https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
          type: "movie" as const,
          year: 2022
        },
        {
          id: "movie-4",
          title: "Top Gun: Maverick",
          posterUrl: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
          type: "movie" as const,
          year: 2022
        }
      ],
      tv: [
        {
          id: "tv-2",
          title: "House of the Dragon",
          posterUrl: "https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg",
          type: "tv" as const,
          season: 1,
          episode: 10
        }
      ],
      anime: []
    },
    reviews: [
      {
        id: "friend-review-1",
        contentId: "movie-3",
        title: "The Batman",
        posterUrl: "https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
        type: "movie" as const,
        year: 2022,
        userRating: 4,
        userComment: "Robert Pattinson delivers a fantastic performance as Batman. The noir atmosphere and detective elements make this a unique take on the Dark Knight.",
        reviewDate: "2024-01-05"
      }
    ]
  },
  "2": {
    id: "2",
    name: "AnimeKing",
    username: "AnimeKing",
    joinedDate: "August 2023",
    watchHistory: {
      movies: [],
      tv: [],
      anime: [
        {
          id: "anime-2",
          title: "Demon Slayer",
          posterUrl: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
          type: "anime" as const,
          season: 3,
          episode: 11
        },
        {
          id: "anime-3",
          title: "Jujutsu Kaisen",
          posterUrl: "https://image.tmdb.org/t/p/w500/qCBJOg3rI1BUFptL4wJjY7YRy98.jpg",
          type: "anime" as const,
          season: 2,
          episode: 23
        }
      ]
    },
    reviews: [
      {
        id: "friend-review-2",
        contentId: "anime-2",
        title: "Demon Slayer",
        posterUrl: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
        type: "anime" as const,
        season: 3,
        episode: 11,
        userRating: 5,
        userComment: "The animation in Season 3 is absolutely incredible. Every fight scene is a work of art and the character development continues to impress.",
        reviewDate: "2024-01-11"
      }
    ]
  }
};

export default function Profile() {
  const { user } = useAuth();
  const [, params] = useRoute("/profile/:userId");
  const [, navigate] = useLocation();
  
  // Determine if viewing own profile or friend's profile
  const isOwnProfile = !params?.userId;
  const friendProfile = params?.userId ? mockFriendProfiles[params.userId as keyof typeof mockFriendProfiles] : null;
  const profileUser = isOwnProfile ? user : friendProfile;
  const currentWatchHistory = isOwnProfile ? mockWatchHistory : friendProfile?.watchHistory;
  const currentReviews = isOwnProfile ? mockUserReviews : friendProfile?.reviews || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profileUser?.name || '',
    email: profileUser?.email || ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleVisitFriendProfile = (friendId: string) => {
    navigate(`/profile/${friendId}`);
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    // TODO: Add validation and API call to save profile
    console.log('Saving profile:', editForm);
    if (profileImage) {
      console.log('Profile image:', profileImage);
    }
    
    // For now, just close the modal
    setIsEditingProfile(false);
    // Reset form
    setEditForm({
      name: profileUser?.name || '',
      email: profileUser?.email || ''
    });
    setProfileImage(null);
    setImagePreview(null);
  };

  const handlePasswordReset = () => {
    // TODO: Add API call to send password reset email
    console.log('Sending password reset email to:', profileUser?.email);
    // Show success message or notification
    alert('Password reset email sent! Check your inbox.');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditForm({
      name: profileUser?.name || '',
      email: profileUser?.email || ''
    });
    setProfileImage(null);
    setImagePreview(null);
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-50">
        <p className="text-retro-600">{isOwnProfile ? "Please sign in to view your profile." : "Profile not found."}</p>
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
                {getUserInitials(profileUser.name)}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-retro-900 mb-2" data-testid="profile-username">
                    {profileUser.name}
                  </h1>
                  {isOwnProfile && (
                    <p className="text-retro-600 mb-4" data-testid="profile-email">{profileUser.email}</p>
                  )}
                  {!isOwnProfile && (
                    <p className="text-retro-600 mb-4" data-testid="profile-joined">
                      Joined {friendProfile?.joinedDate || 'recently'}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="edit-profile-button"
                  >
                    <Edit size={16} />
                    Edit Profile
                  </Button>
                )}
              </div>
              
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

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="edit-profile-modal">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-retro-900">Edit Profile</h2>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  className="text-retro-600 hover:text-retro-900"
                  data-testid="close-edit-modal"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Profile Image Upload */}
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-retro-100 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-retro-700">
                          {getUserInitials(editForm.name || profileUser?.name || '')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => document.getElementById('profile-image')?.click()}
                        data-testid="upload-image-button"
                      >
                        <Upload size={16} />
                        Change Photo
                      </Button>
                    </div>
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="profile-image-input"
                    />
                  </div>

                  {/* Name and Email */}
                  <Input
                    label="Name"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    data-testid="edit-name-input"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    data-testid="edit-email-input"
                  />
                </div>

                {/* Right Column - Password Reset */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-retro-900 pb-2 border-b border-retro-200">Change Password</h3>
                  
                  <div className="bg-retro-50 p-4 rounded-lg">
                    <p className="text-sm text-retro-700 mb-4">
                      For security, we'll send a password reset link to your email address.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePasswordReset}
                      className="w-full flex items-center justify-center gap-2"
                      data-testid="password-reset-button"
                    >
                      Send Password Reset Email
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-retro-200">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 flex items-center justify-center gap-2"
                  data-testid="save-profile-button"
                >
                  <Save size={16} />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1"
                  data-testid="cancel-edit-button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Friends & Social (only show for own profile) */}
          {isOwnProfile && (
            <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md" data-testid="friends-section">
              <div className="flex items-center gap-2 mb-6">
                <Users size={20} />
                <h2 className="text-xl font-bold text-retro-900">Social</h2>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6" data-testid="social-tabs">
                <Button
                  onClick={() => setActiveTab("friends")}
                  variant={activeTab === "friends" ? "accent" : "ghost"}
                  size="sm"
                  data-testid="tab-friends"
                >
                  Friends
                </Button>
                <Button
                  onClick={() => setActiveTab("requests")}
                  variant={activeTab === "requests" ? "accent" : "ghost"}
                  size="sm"
                  data-testid="tab-requests"
                >
                  Requests
                  {mockFriendRequests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-retro-200 text-retro-800 rounded-full text-xs font-semibold">
                      {mockFriendRequests.length}
                    </span>
                  )}
                </Button>
                <Button
                  onClick={() => setActiveTab("search")}
                  variant={activeTab === "search" ? "accent" : "ghost"}
                  size="sm"
                  data-testid="tab-search"
                >
                  Search
                </Button>
              </div>

              {/* Friends List */}
              {activeTab === "friends" && (
                <div className="space-y-4" data-testid="friends-list">
                  {mockFriends.map((friend) => (
                    <div 
                      key={friend.id} 
                      className="flex items-center justify-between p-3 bg-retro-50 rounded-lg hover:bg-retro-100 cursor-pointer transition-colors" 
                      data-testid={`friend-${friend.id}`}
                      onClick={() => handleVisitFriendProfile(friend.id)}
                    >
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
          )}

          {/* Right Column - Viewing History */}
          <div className={isOwnProfile ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg p-6 shadow-md" data-testid="watch-history-section">
              <div className="flex items-center gap-2 mb-6">
                <Eye size={20} />
                <h2 className="text-xl font-bold text-retro-900">{isOwnProfile ? 'Viewing History' : `${profileUser.name}'s Viewing History`}</h2>
              </div>
              
              {/* Content Type Tabs */}
              <div className="flex gap-2 mb-6" data-testid="content-type-tabs">
                <Button
                  onClick={() => setActiveContentTab("movies")}
                  variant={activeContentTab === "movies" ? "accent" : "ghost"}
                  size="sm"
                  data-testid="tab-movies"
                >
                  Movies ({currentWatchHistory?.movies?.length || 0})
                </Button>
                <Button
                  onClick={() => setActiveContentTab("tv")}
                  variant={activeContentTab === "tv" ? "accent" : "ghost"}
                  size="sm"
                  data-testid="tab-tv"
                >
                  TV Shows ({currentWatchHistory?.tv?.length || 0})
                </Button>
                <Button
                  onClick={() => setActiveContentTab("anime")}
                  variant={activeContentTab === "anime" ? "accent" : "ghost"}
                  size="sm"
                  data-testid="tab-anime"
                >
                  Anime ({currentWatchHistory?.anime?.length || 0})
                </Button>
              </div>

              {/* Movies History */}
              {activeContentTab === "movies" && (
                <div className="space-y-4" data-testid="movies-history">
                  {(currentWatchHistory?.movies?.length || 0) === 0 ? (
                    <p className="text-center text-retro-600 py-8">No movies watched yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {(currentWatchHistory?.movies || []).map((movie) => (
                        <ContentDisplay
                          key={movie.id}
                          id={movie.id}
                          posterUrl={movie.posterUrl}
                          title={movie.title}
                          type={movie.type}
                          year={movie.year}
                          status="finished"
                          size="small"
                          onClick={() => console.log(`View ${movie.title}`)}
                          data-testid={`movie-history-${movie.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TV Shows History */}
              {activeContentTab === "tv" && (
                <div className="space-y-4" data-testid="tv-history">
                  {(currentWatchHistory?.tv?.length || 0) === 0 ? (
                    <p className="text-center text-retro-600 py-8">No TV shows watched yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {(currentWatchHistory?.tv || []).map((show) => (
                        <ContentDisplay
                          key={show.id}
                          id={show.id}
                          posterUrl={show.posterUrl}
                          title={show.title}
                          type={show.type}
                          season={show.season}
                          episode={show.episode}
                          status="finished"
                          size="small"
                          onClick={() => console.log(`View ${show.title}`)}
                          data-testid={`tv-history-${show.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Anime History */}
              {activeContentTab === "anime" && (
                <div className="space-y-4" data-testid="anime-history">
                  {(currentWatchHistory?.anime?.length || 0) === 0 ? (
                    <p className="text-center text-retro-600 py-8">No anime watched yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {(currentWatchHistory?.anime || []).map((anime) => (
                        <ContentDisplay
                          key={anime.id}
                          id={anime.id}
                          posterUrl={anime.posterUrl}
                          title={anime.title}
                          type={anime.type}
                          season={anime.season}
                          episode={anime.episode}
                          status="finished"
                          size="small"
                          onClick={() => console.log(`View ${anime.title}`)}
                          data-testid={`anime-history-${anime.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg p-6 shadow-md" data-testid="reviews-section">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare size={20} />
              <h2 className="text-xl font-bold text-retro-900">{isOwnProfile ? 'Your Reviews' : `${profileUser.name}'s Reviews`}</h2>
              <span className="text-sm text-retro-600">({currentReviews.length})</span>
            </div>

            {currentReviews.length === 0 ? (
              <p className="text-center text-retro-600 py-8">No reviews yet</p>
            ) : (
              <div className="space-y-6">
                {currentReviews.map((review) => (
                  <div key={review.id} className="border-b border-retro-200 pb-6 last:border-b-0 last:pb-0" data-testid={`review-${review.id}`}>
                    <div className="flex gap-4">
                      {/* Content Display - Horizontal */}
                      <div className="flex-shrink-0">
                        <ContentDisplay
                          id={review.contentId}
                          posterUrl={review.posterUrl}
                          title={review.title}
                          type={review.type}
                          year={review.year}
                          season={review.season}
                          episode={review.episode}
                          status="finished"
                          size="list"
                          onClick={() => console.log(`View ${review.title}`)}
                        />
                      </div>

                      {/* Review Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center" data-testid={`review-rating-${review.id}`}>
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={`${
                                    i < review.userRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'fill-gray-200 text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-retro-700">
                              {review.userRating} out of 5 stars
                            </span>
                          </div>
                          <span className="text-sm text-retro-500" data-testid={`review-date-${review.id}`}>
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-retro-800 leading-relaxed" data-testid={`review-comment-${review.id}`}>
                          {review.userComment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}