import { forwardRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-5px border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus-visible:ring-retro-500 focus-visible:border-retro-500",
        retro: "border-retro-300 bg-retro-50 focus-visible:ring-retro-500 focus-visible:border-retro-500",
        accent: "border-retro-accent border-2 bg-retro-accent-1 focus-visible:ring-retro-accent focus-visible:border-retro-accent",
        error: "border-red-500 bg-red-50 focus-visible:ring-red-500 focus-visible:border-red-500",
        success: "border-green-500 bg-green-50 focus-visible:ring-green-500 focus-visible:border-green-500"
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3",
        lg: "h-12 px-4 text-base",
        xl: "h-14 px-5 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-gray-900",
        retro: "text-retro-900 font-headline",
        accent: "text-retro-accent font-headline",
        error: "text-red-700",
        success: "text-green-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  helper?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type = "text", 
    label, 
    helper, 
    error, 
    success,
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;
    const currentVariant = error ? "error" : success ? "success" : variant;
    const hasIcon = leftIcon || rightIcon || (showPasswordToggle && type === "password");

    const PasswordToggleIcon = () => (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        data-testid="password-toggle"
      >
        {showPassword ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    );

    return (
      <div className="space-y-2">
        {label && (
          <label 
            className={cn(labelVariants({ variant: currentVariant }))}
            data-testid="input-label"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              leftIcon && "pl-10",
              (rightIcon || showPasswordToggle) && "pr-10",
              isFocused && "ring-2",
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            data-testid="input-field"
            {...props}
          />
          
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {showPasswordToggle && type === "password" && <PasswordToggleIcon />}
        </div>

        {(helper || error || success) && (
          <div className="flex items-start gap-1">
            {error && (
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {success && (
              <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p 
              className={cn(
                "text-xs",
                error && "text-red-600",
                success && "text-green-600",
                !error && !success && "text-gray-600"
              )}
              data-testid="input-message"
            >
              {error || success || helper}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;