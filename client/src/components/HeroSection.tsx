import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { Plus, Info } from 'lucide-react';

interface HeroContent {
  id: string;
  title: string;
  description: string;
  year: number;
  rating: string;
  duration: string;
  genres: string[];
  platforms: string[];
  trailerUrl: string;
  posterUrl: string;
  logoUrl?: string;
}

interface HeroSectionProps {
  content: HeroContent;
  onAddToList?: () => void;
  onViewDetails?: () => void;
}

export function HeroSection({ 
  content, 
  onAddToList, 
  onViewDetails 
}: HeroSectionProps) {

  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((error) => {
        // Silently handle play() interruptions during hot reloading
        console.log('Video play interrupted:', error);
      });
    }
  }, []);

  const handleVideoError = () => {
    setVideoError(true);
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
      {/* Video Background or Poster Fallback */}
      {!videoError ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={content.trailerUrl}
          autoPlay
          muted
          loop
          playsInline
          onError={handleVideoError}
          poster={content.posterUrl}
        />
      ) : (
        <img
          src={content.posterUrl}
          alt={content.title}
          className="absolute inset-0 w-full h-full object-cover"
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
              {content.title}
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
                onClick={onViewDetails}
                className="border-white/50 text-white hover:bg-white/10 hover:border-white"
              >
                <Info className="w-5 h-5 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}