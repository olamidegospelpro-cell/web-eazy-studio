/**
 * Top toolbar.
 *
 * Left: logo + undo/redo bound to the core HistoryService.
 * Center: save status.
 * Right: search + command palette launchers, theme toggle.
 * All actions go through CommandRegistry so the palette, shortcuts and this
 * toolbar can never drift apart.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Play, Undo2, Redo2, Search, Command as CommandIcon } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { SaveStatus } from "@/components/project/SaveStatus";
import {
  CommandRegistry,
  globalHistory,
  formatAccelerator,
  useUi,
  type HistoryState,
} from "@/lib/core";

export function TopToolbar() {
  const { resolvedTheme, toggle } = useTheme();
  const ui = useUi();
  const [history, setHistory] = useState<HistoryState>(() => globalHistory.getState());

  useEffect(() => globalHistory.subscribe(setHistory), []);

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border bg-toolbar px-3 text-toolbar-foreground">
      <Link to="/" className="flex items-center">
        <Logo />
      </Link>

      <Separator orientation="vertical" className="mx-2 h-5" />

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={!history.canUndo}
          onClick={() => void CommandRegistry.execute("edit.undo")}
          aria-label="Undo"
          title={history.undoLabel ? `Undo ${history.undoLabel}` : "Undo"}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={!history.canRedo}
          onClick={() => void CommandRegistry.execute("edit.redo")}
          aria-label="Redo"
          title={history.redoLabel ? `Redo ${history.redoLabel}` : "Redo"}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled aria-label="Preview">
          <Play className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <SaveStatus />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        size="sm"
        variant="ghost"
        className="h-8 gap-1.5 text-muted-foreground"
        onClick={() => ui.setSearchOpen(true)}
        title={`Search (${formatAccelerator("mod+p")})`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Search</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => ui.setPaletteOpen(true)}
        aria-label="Command palette"
        title={`Command palette (${formatAccelerator("mod+shift+p")})`}
      >
        <CommandIcon className="h-4 w-4" />
      </Button>

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
