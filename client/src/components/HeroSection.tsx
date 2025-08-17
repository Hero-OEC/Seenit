import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { Play, Pause, Volume2, VolumeX, Plus, Info } from 'lucide-react';

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isMuted]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setIsPlaying(false);
  };

  return (
    <div 
      className="relative w-screen overflow-hidden bg-black"
      style={{ 
        height: '90vh',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        maxWidth: '100vw'
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Background or Poster Fallback */}
      {!videoError ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={content.trailerUrl}
          autoPlay={false}
          muted={isMuted}
          loop={false}
          playsInline
          onEnded={handleVideoEnd}
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

      {/* Video Controls */}
      <div 
        className={`absolute bottom-6 right-6 flex gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={togglePlayPause}
          className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={toggleMute}
          className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-1000"
          style={{ 
            width: isPlaying ? '100%' : '0%',
            transitionDuration: isPlaying ? '30s' : '0s' 
          }}
        />
      </div>
    </div>
  );
}