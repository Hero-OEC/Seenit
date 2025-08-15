import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-5px text-sm font-headline font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-retro-500 text-white hover:bg-retro-600",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-retro-500 text-retro-500 hover:bg-retro-500 hover:text-white",
        secondary: "bg-retro-200 text-retro-900 hover:bg-retro-300",
        ghost: "text-retro-500 hover:bg-retro-100",
        link: "text-retro-500 underline-offset-4 hover:underline",
        accent: "bg-retro-accent text-retro-900 hover:bg-retro-accent/80",
        cream: "bg-retro-accent-2 text-retro-900 hover:bg-retro-200 border border-retro-400"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;