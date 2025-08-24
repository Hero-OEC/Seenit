import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface StatusUpdateButtonProps {
  /** Current status text */
  status: string;
  /** Available status options */
  options: { value: string; label: string }[];
  /** Handler for status changes */
  onStatusChange: (value: string) => void;
  /** Handler for main button click */
  onMainAction?: () => void;
  /** Size variant */
  size?: "default" | "small";
  /** Additional CSS classes */
  className?: string;
  /** Test ID prefix */
  testIdPrefix?: string;
}

export default function StatusUpdateButton({
  status,
  options,
  onStatusChange,
  onMainAction,
  size = "default",
  className = "",
  testIdPrefix = "status-update"
}: StatusUpdateButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const getStatusButtonColor = () => {
    switch (status) {
      case "Want to Watch":
        return "bg-green-500 hover:bg-green-600";
      case "Currently Watching":
        return "bg-orange-500 hover:bg-orange-600";
      case "Watched":
      case "Finished":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-retro-500 hover:bg-retro-600";
    }
  };

  const getSeparatorColor = () => {
    switch (status) {
      case "Want to Watch":
        return "bg-green-600";
      case "Currently Watching":
        return "bg-orange-600";
      case "Watched":
      case "Finished":
        return "bg-gray-600";
      default:
        return "bg-retro-600";
    }
  };

  const handleMainClick = () => {
    // Only trigger main action if not already in a selected state
    if (status === "Add to Watch List" && onMainAction) {
      onMainAction();
    }
    // For other states, do nothing - user must use dropdown
  };

  const handleOptionClick = (value: string) => {
    onStatusChange(value);
    setIsDropdownOpen(false);
  };

  const isSmall = size === "small";
  const containerWidth = isSmall ? "w-full" : "w-64 mx-auto";
  const buttonPadding = isSmall ? "px-3 py-2" : "px-6 py-3";
  const dropdownPadding = isSmall ? "px-3 py-2" : "px-6 py-3";
  const fontSize = isSmall ? "text-xs" : "text-base";
  const iconSize = isSmall ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={`relative ${size === 'small' ? 'mb-0' : 'mb-4'} ${containerWidth} ${className}`}>
      <div className={`flex rounded-lg overflow-hidden ${isSmall ? 'shadow-sm' : 'shadow-md'}`}>
        {/* Main Action Button */}
        <button
          onClick={handleMainClick}
          className={`flex-1 ${buttonPadding} text-white font-medium transition-colors ${fontSize} ${getStatusButtonColor()}`}
          data-testid={`${testIdPrefix}-main-button`}
        >
          {status}
        </button>
        
        {/* Separator Line */}
        <div className={`w-px ${getSeparatorColor()}`}></div>
        
        {/* Dropdown Trigger */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`${isSmall ? 'px-2 py-2' : 'px-3 py-3'} text-white transition-all ${getStatusButtonColor()} opacity-90 hover:opacity-100`}
          data-testid={`${testIdPrefix}-dropdown-trigger`}
        >
          <ChevronDown className={iconSize} />
        </button>
      </div>
      
      {isDropdownOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-lg ${isSmall ? 'shadow-md' : 'shadow-lg'} border border-retro-200 z-10`}>
          {options
            .filter(option => 
              // Only show remove option if item is already added to watchlist
              option.value !== "remove_from_watch_list" || status !== "Add to Watch List"
            )
            .map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`w-full ${dropdownPadding} transition-all duration-200 first:rounded-t-lg last:rounded-b-lg border-b border-retro-100 last:border-b-0 ${fontSize} ${
                option.value === "remove_from_watch_list" 
                  ? "text-red-600 hover:bg-red-50 hover:text-red-700 text-center font-medium" 
                  : "text-left text-retro-900 hover:bg-retro-100 hover:text-retro-700"
              }`}
              data-testid={`${testIdPrefix}-option-${option.value}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}