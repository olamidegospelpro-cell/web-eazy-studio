/**
 * Top toolbar.
 *
 * Left: application logo (links to home).
 * Center: reserved slot for future project controls (name, breadcrumbs,
 *   device preview toggle, viewport width, undo/redo).
 * Right: theme toggle + future account/notifications slot.
 */
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Play, Undo2, Redo2 } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { SaveStatus } from "@/components/project/SaveStatus";

export function TopToolbar() {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border bg-toolbar px-3 text-toolbar-foreground">
      <Link to="/" className="flex items-center">
        <Logo />
      </Link>

      <Separator orientation="vertical" className="mx-2 h-5" />

      {/* Reserved: future project controls (undo/redo, run) — disabled until a project is open. */}
      <div className="flex items-center gap-1 opacity-40">
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled aria-label="Preview">
          <Play className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <SaveStatus />


      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={toggle}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
