interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  hover?: boolean;
}

export default function Card({ 
  children, 
  className = '',
  padding = 'md',
  shadow = true,
  hover = false
}: CardProps) {
  const baseClasses = "bg-white rounded-2xl";
  
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };
  
  const shadowClasses = shadow ? "shadow-lg" : "";
  const hoverClasses = hover ? "hover:shadow-xl transition-shadow duration-200" : "";
  
  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses} ${hoverClasses} ${className}`;

  return (
    <div className={classes} data-testid="card-component">
      {children}
    </div>
  );
}