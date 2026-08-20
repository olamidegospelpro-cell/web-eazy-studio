/**
 * IconButton / ToolbarButton — thin wrappers around the shared Button so
 * consumers get the right defaults without repeating props.
 *
 *   IconButton      — square icon action (ghost by default)
 *   ToolbarButton   — flat button used inside the top toolbar rail
 */
import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type IconButtonProps = Omit<ButtonProps, "size"> & {
  label: string;
  size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "icon", variant = "ghost", tooltipSide = "bottom", children, ...rest }, ref) => {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button ref={ref} size={size} variant={variant} aria-label={label} {...rest}>
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
IconButton.displayName = "IconButton";

type ToolbarButtonProps = Omit<IconButtonProps, "variant"> & { active?: boolean };

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ active, ...rest }, ref) => {
    return (
      <IconButton ref={ref} variant="toolbar" data-active={active ? "true" : undefined} {...rest} />
    );
  },
);
ToolbarButton.displayName = "ToolbarButton";
