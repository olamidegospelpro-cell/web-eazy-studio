/**
 * Maps a command's `icon` string to a lucide component.
 * Keeps `@/lib/core/commands` free of any UI imports.
 */
import {
  Circle,
  FilePlus2,
  FolderOpen,
  Save,
  SaveAll,
  Settings,
  Info,
  Puzzle,
  Sun,
  Search,
  Download,
  Undo2,
  Redo2,
  Palette,
  PanelLeft,
  PanelRight,
  Terminal,
  Home,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "file-plus": FilePlus2,
  "folder-open": FolderOpen,
  save: Save,
  "save-all": SaveAll,
  settings: Settings,
  info: Info,
  puzzle: Puzzle,
  sun: Sun,
  search: Search,
  download: Download,
  undo: Undo2,
  redo: Redo2,
  palette: Palette,
  "panel-left": PanelLeft,
  "panel-right": PanelRight,
  terminal: Terminal,
  home: Home,
};

export function commandIcon(name?: string): LucideIcon {
  return (name && ICONS[name]) || Circle;
}
