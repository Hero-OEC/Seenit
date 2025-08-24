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
  const buttonHeight = isSmall ? "h-9" : "h-10";
  const buttonPadding = isSmall ? "px-3" : "px-4 py-2";
  const dropdownPadding = isSmall ? "px-3 py-1.5" : "px-6 py-3";
  const fontSize = isSmall ? "text-sm" : "text-base";
  const iconSize = isSmall ? "w-3 h-3" : "w-4 h-4";
  const dropdownTriggerPadding = isSmall ? "px-2" : "px-3";

  return (
    <div className={`relative ${size === 'small' ? 'mb-0' : 'mb-4'} ${containerWidth} ${className}`}>
      <div className={`flex ${buttonHeight} rounded-5px overflow-hidden ${isSmall ? 'shadow-sm' : 'shadow-md'}`}>
        {/* Main Action Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMainClick();
          }}
          className={`flex-1 ${buttonPadding} text-white font-medium transition-colors ${fontSize} items-center justify-center ${getStatusButtonColor()}`}
          data-testid={`${testIdPrefix}-main-button`}
        >
          {status}
        </button>
        
        {/* Separator Line */}
        <div className={`w-px ${getSeparatorColor()}`}></div>
        
        {/* Dropdown Trigger */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className={`${dropdownTriggerPadding} text-white transition-all ${getStatusButtonColor()} opacity-90 hover:opacity-100 items-center justify-center`}
          data-testid={`${testIdPrefix}-dropdown-trigger`}
        >
          <ChevronDown className={iconSize} />
        </button>
      </div>
      
      {isDropdownOpen && (
        <div className={`absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-retro-300 rounded-md shadow-lg max-h-60 overflow-auto`}>
          {options
            .filter(option => 
              // Only show remove option if item is already added to watchlist
              option.value !== "remove_from_watch_list" || status !== "Add to Watch List"
            )
            .map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOptionClick(option.value);
              }}
              className={`relative flex w-full cursor-pointer select-none items-center justify-center py-2 px-3 text-sm outline-none first:rounded-t-md last:rounded-b-md ${
                option.value === "remove_from_watch_list" 
                  ? "text-red-600 hover:bg-red-50 focus:bg-red-50 font-medium" 
                  : "text-retro-900 hover:bg-retro-100 focus:bg-retro-100"
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