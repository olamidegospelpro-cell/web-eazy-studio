import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * WebEazy Button
 * --------------
 * Single reusable button used across the entire app. New variants and
 * sizes are added here rather than duplicated inline so styling stays
 * consistent (radius, focus ring, disabled state, icon sizing).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-brand-600 active:bg-brand-700",
        brand:
          "bg-brand text-brand-foreground shadow-xs hover:bg-brand-600 active:bg-brand-700",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        toolbar:
          "text-toolbar-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
        link:
          "text-brand underline-offset-4 hover:underline p-0 h-auto",
        destructive:
          "bg-danger text-danger-foreground shadow-xs hover:bg-danger/90",
        success:
          "bg-success text-success-foreground shadow-xs hover:bg-success/90",
        warning:
          "bg-warning text-warning-foreground shadow-xs hover:bg-warning/90",
      },
      size: {
        xs: "h-6 px-2 text-[11px] [&_svg]:size-3",
        sm: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
        md: "h-8 px-3 text-sm [&_svg]:size-4",
        lg: "h-10 px-5 text-sm [&_svg]:size-4",
        "icon-xs": "h-6 w-6 [&_svg]:size-3",
        "icon-sm": "h-7 w-7 [&_svg]:size-3.5",
        icon: "h-8 w-8 [&_svg]:size-4",
        "icon-lg": "h-10 w-10 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
