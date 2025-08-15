import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-4 h-4 rounded border-2 border-gray-300 bg-white transition-all duration-200",
            "group-hover:border-retro-400",
            "peer-checked:border-retro-500 peer-checked:bg-retro-500",
            "peer-focus:ring-2 peer-focus:ring-retro-500 peer-focus:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            className
          )} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className={cn(
                "w-3 h-3 text-white opacity-0 transition-opacity duration-200",
                "peer-checked:opacity-100"
              )}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <span className="text-sm text-gray-900 group-hover:text-retro-700 transition-colors">
          {label}
        </span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;