import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  placement?: "left" | "right" | "center";
}

export default function Dropdown({ 
  trigger, 
  options, 
  className, 
  menuClassName,
  disabled = false,
  placement = "left"
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option: DropdownOption) => {
    option.onClick?.();
    setIsOpen(false);
  };

  const getMenuPositionClass = () => {
    switch (placement) {
      case "right":
        return "right-0";
      case "center":
        return "left-1/2 -translate-x-1/2";
      default:
        return "left-0";
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        data-testid="dropdown-trigger"
        className="w-full"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-2 bg-background border border-border rounded-5px shadow-lg",
          "max-h-60 overflow-auto min-w-40",
          getMenuPositionClass(),
          menuClassName
        )}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left text-sm font-headline transition-colors",
                "first:rounded-t-5px last:rounded-b-5px",
                "hover:bg-retro-500 hover:text-white text-retro-900"
              )}
              onClick={() => handleOptionClick(option)}
              data-testid={`dropdown-option-${option.value}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          data-testid="dropdown-backdrop"
        />
      )}
    </div>
  );
}