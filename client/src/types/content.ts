export interface Content {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'anime';
  year?: number;
  rating?: string;
  genre?: string[];
  poster?: string;
  overview?: string;
  status?: 'airing' | 'completed' | 'upcoming';
  episodes?: number;
  streamingPlatforms?: string[];
  affiliateLinks?: string[];
}

export interface UserContent {
  id: string;
  userId: string;
  contentId: string;
  status: 'watching' | 'watched' | 'want_to_watch';
  progress?: number;
  userRating?: number;
  addedAt?: Date;
  updatedAt?: Date;
  content?: Content;
}

export interface UserStats {
  watched: number;
  watching: number;
  watchlist: number;
  avgRating: string;
}
