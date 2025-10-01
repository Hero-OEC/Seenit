import { useState, useEffect } from 'react';
import Button from './Button';
import { Plus, Info } from 'lucide-react';

interface HeroMovie {
  id: string;
  title: string;
  description: string;
  year: number;
  rating: string;
  duration: string;
  genres: string[];
  platforms: string[];
  trailerKey: string;
  posterUrl: string;
  backdropUrl: string;
  logoUrl?: string;
}

interface HeroSectionProps {
  movies: HeroMovie[];
  onAddToList?: () => void;
  onViewDetails?: (movieId: string) => void;
}

export function HeroSection({ 
  movies, 
  onAddToList, 
  onViewDetails 
}: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const currentMovie = movies[currentIndex];

  // Rotate through movies every 10 seconds
  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
      setImageError(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [movies.length]);

  if (!currentMovie) return null;

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${currentMovie.trailerKey}?autoplay=1&mute=1&loop=1&playlist=${currentMovie.trailerKey}&controls=0&rel=0&modestbranding=1&playsinline=1`;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className="relative w-full overflow-hidden bg-black"
      style={{ 
        height: '90vh',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)'
      }}
    >
      {/* YouTube Trailer Background or Backdrop Fallback */}
      {currentMovie.trailerKey && !imageError ? (
        <iframe
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={youtubeEmbedUrl}
          title={currentMovie.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            transform: 'translate(-50%, -50%) scale(1.5)',
            pointerEvents: 'none'
          }}
        />
      ) : (
        <img
          src={currentMovie.backdropUrl}
          alt={currentMovie.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={handleImageError}
        />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full px-8 pb-16">
          <div className="max-w-2xl">
            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-thin text-white mb-8 font-headline">
              {currentMovie.title}
            </h1>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={onAddToList}
                className="bg-white text-black hover:bg-white/90 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to Watchlist
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => onViewDetails?.(currentMovie.id)}
                className="border-white/50 text-white hover:bg-white/10 hover:border-white"
              >
                <Info className="w-5 h-5 mr-2" />
                View Details
              </Button>
            </div>

            {/* Rotation Indicators */}
            {movies.length > 1 && (
              <div className="flex gap-2 mt-6">
                {movies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'w-8 bg-white' 
                        : 'w-6 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`View movie ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}