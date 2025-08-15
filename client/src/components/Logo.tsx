interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function Logo({ size = 'medium', className = '' }: LogoProps) {
  const sizeClasses = {
    small: 'w-20 h-12',
    medium: 'w-32 h-20', 
    large: 'w-48 h-28'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`} data-testid={`logo-${size}`}>
      <img 
        src="/attached_assets/Seenit.svg" 
        alt="Seenit - Entertainment Tracker" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}