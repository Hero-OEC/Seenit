import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  onToggle?: (checked: boolean) => void;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className, onToggle, onChange, defaultChecked = false, ...props }, ref) => {
    const [isChecked, setIsChecked] = useState(defaultChecked);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setIsChecked(checked);
      onToggle?.(checked);
      onChange?.(e);
    };

    return (
      <label className="flex items-center space-x-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            checked={isChecked}
            onChange={handleToggle}
            {...props}
          />
          <div className={cn(
            "w-11 h-6 rounded-full transition-all duration-300 ease-in-out",
            "border-2 border-gray-300 bg-gray-200",
            "group-hover:border-gray-400",
            "peer-checked:bg-retro-500 peer-checked:border-retro-500",
            "peer-focus:ring-2 peer-focus:ring-retro-500 peer-focus:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            className
          )} />
          <div className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out",
            "peer-checked:translate-x-5",
            "peer-disabled:opacity-50"
          )} />
        </div>
        <span className="text-sm text-gray-900 group-hover:text-retro-700 transition-colors">
          {label}
        </span>
      </label>
    );
  }
);

Toggle.displayName = "Toggle";

export default Toggle;