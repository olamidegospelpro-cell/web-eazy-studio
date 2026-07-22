/**
 * Collapsible left navigation sidebar.
 *
 * Milestone 1 hosts app-level navigation (Home, Plugins, Settings, About).
 * In later milestones this becomes the editor's tool rail (Pages, Layers,
 * Assets, Widgets, Sections) when a project is open — the surface stays,
 * only the items change.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Puzzle, Settings, Info, PanelLeftClose, PanelLeftOpen, Palette } from "lucide-react";
import { useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> };

const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plugins", label: "Plugins", icon: Puzzle },
  { to: "/design-system", label: "Design System", icon: Palette },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
];

export function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          collapsed ? "w-12" : "w-52",
        )}
      >
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {items.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            const link = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
            if (!collapsed) return link;
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-9 items-center gap-2 border-t border-border px-3 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </TooltipProvider>
  );
}
