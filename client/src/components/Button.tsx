interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClasses = "font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-retro-main text-white hover:bg-retro-dark focus:ring-retro-main",
    secondary: "bg-retro-secondary text-retro-dark hover:bg-retro-accent focus:ring-retro-secondary",
    accent: "bg-retro-accent text-retro-dark hover:bg-retro-secondary focus:ring-retro-accent"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  return (
    <button 
      className={classes}
      onClick={onClick}
      disabled={disabled}
      data-testid="button-component"
    >
      {children}
    </button>
  );
}