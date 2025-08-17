// Simple toast component for compatibility
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
          variant === "default" && "border bg-background text-foreground",
          variant === "destructive" && "destructive group border-destructive bg-destructive text-destructive-foreground",
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast };