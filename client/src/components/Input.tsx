import { forwardRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-5px border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-500 focus-visible:border-retro-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "border-gray-300 hover:border-gray-400",
        error: "border-red-500 bg-red-50 focus-visible:ring-red-500 focus-visible:border-red-500",
        warning: "border-orange-500 bg-orange-50 focus-visible:ring-orange-500 focus-visible:border-orange-500",
        success: "border-green-500 bg-green-50 focus-visible:ring-green-500 focus-visible:border-green-500"
      },
      inputSize: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 py-2",
        lg: "h-12 px-4 text-base"
      },
      inputType: {
        text: "",
        textarea: "min-h-20 py-2 resize-y",
        select: "cursor-pointer"
      }
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
      inputType: "text"
    }
  }
);

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-gray-900",
        error: "text-red-700",
        warning: "text-orange-700", 
        success: "text-green-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  warning?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  variant?: "default" | "error" | "warning" | "success";
  inputSize?: "sm" | "default" | "lg";
  inputType?: "text" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>; // For select inputs
  rows?: number; // For textarea
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = "text", 
    label, 
    helper, 
    error, 
    warning,
    success,
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    variant = "default",
    inputSize = "default",
    inputType = "text",
    options = [],
    rows = 4,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const inputTypeResolved = showPasswordToggle ? (showPassword ? "text" : "password") : type;
    
    // Determine variant based on state
    const currentVariant = error ? "error" : warning ? "warning" : success ? "success" : variant;

    // Render different input types
    const renderInputField = () => {
      const baseClasses = cn(
        inputVariants({ variant: currentVariant, inputSize, inputType }),
        leftIcon && "pl-10",
        (rightIcon || showPasswordToggle) && "pr-10",
        className
      );

      if (inputType === "textarea") {
        return (
          <textarea
            className={baseClasses}
            rows={rows}
            ref={ref as any}
            data-testid="textarea-field"
            {...(props as any)}
          />
        );
      }

      if (inputType === "select") {
        return (
          <div className="relative">
            <select
              className={cn(baseClasses, "custom-select")}
              ref={ref as any}
              data-testid="select-field"
              {...(props as any)}
            >
              {props.placeholder && (
                <option value="" disabled>
                  {props.placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        );
      }

      return (
        <input
          type={inputTypeResolved}
          className={baseClasses}
          ref={ref}
          data-testid="input-field"
          {...props}
        />
      );
    };

    const PasswordToggleIcon = () => (
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        onClick={() => setShowPassword(!showPassword)}
        data-testid="password-toggle"
      >
        {showPassword ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
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
          {leftIcon && inputType !== "textarea" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              {leftIcon}
            </div>
          )}
          
          {renderInputField()}
          
          {rightIcon && !showPasswordToggle && inputType !== "select" && inputType !== "textarea" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {showPasswordToggle && type === "password" && inputType === "text" && <PasswordToggleIcon />}
        </div>

        {(helper || error || warning || success) && (
          <div className="flex items-start gap-1">
            {error && (
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {warning && (
              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
                warning && "text-orange-600",
                success && "text-green-600",
                !error && !warning && !success && "text-gray-600"
              )}
              data-testid="input-message"
            >
              {error || warning || success || helper}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;