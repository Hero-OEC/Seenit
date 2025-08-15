import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-2 cursor-pointer group">
        <div className="relative">
          <input
            type="radio"
            className="sr-only"
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-4 h-4 rounded-full border-2 border-gray-300 bg-white transition-all duration-200",
            "group-hover:border-retro-400",
            "peer-checked:border-retro-500 peer-checked:bg-retro-500",
            "peer-focus:ring-2 peer-focus:ring-retro-500 peer-focus:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            className
          )} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-2 h-2 rounded-full bg-white opacity-0 transition-opacity duration-200",
              "peer-checked:opacity-100"
            )} />
          </div>
        </div>
        <span className="text-sm text-gray-900 group-hover:text-retro-700 transition-colors">
          {label}
        </span>
      </label>
    );
  }
);

RadioButton.displayName = "RadioButton";

export default RadioButton;