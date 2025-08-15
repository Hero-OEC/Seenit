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
  onWatchTrailer?: () => void;
  onAddToList?: () => void;
  onMoreInfo?: () => void;
}

export function HeroSection({ 
  content, 
  onWatchTrailer, 
  onAddToList, 
  onMoreInfo 
}: HeroSectionProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
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

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={content.trailerUrl}
        autoPlay
        muted={isMuted}
        loop={false}
        playsInline
        onEnded={handleVideoEnd}
        poster={content.posterUrl}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {/* Logo or Title */}
            {content.logoUrl ? (
              <img 
                src={content.logoUrl} 
                alt={`${content.title} Logo`}
                className="h-20 md:h-28 w-auto object-contain mb-6"
              />
            ) : (
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 font-headline">
                {content.title}
              </h1>
            )}

            {/* Movie Details */}
            <div className="flex items-center gap-4 mb-4 text-white/90">
              <span className="text-sm md:text-base font-medium">{content.year}</span>
              <span className="w-1 h-1 bg-white/60 rounded-full"></span>
              <span className="text-sm md:text-base font-medium">{content.rating}</span>
              <span className="w-1 h-1 bg-white/60 rounded-full"></span>
              <span className="text-sm md:text-base font-medium">{content.duration}</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {content.genres.map((genre) => (
                <span 
                  key={genre}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white/90"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-xl">
              {content.description}
            </p>

            {/* Platforms */}
            <div className="mb-8">
              <p className="text-sm text-white/70 mb-3">Available on:</p>
              <div className="flex flex-wrap gap-3">
                {content.platforms.map((platform) => (
                  <span 
                    key={platform}
                    className="px-4 py-2 bg-retro-950/80 backdrop-blur-sm rounded-lg text-sm text-white font-medium"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={onWatchTrailer}
                className="bg-white text-black hover:bg-white/90 font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Trailer
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={onAddToList}
                className="border-white/50 text-white hover:bg-white/10 hover:border-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to List
              </Button>
              
              <Button
                size="lg"
                variant="ghost"
                onClick={onMoreInfo}
                className="text-white hover:bg-white/10"
              >
                <Info className="w-5 h-5 mr-2" />
                More Info
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