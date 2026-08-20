/**
 * AppCommandsProvider — wires core infrastructure to the running app.
 *
 * It is the ONLY place where commands and shortcuts are bound to concrete
 * app behaviour (router, theme, project store, UI state). Services stay pure;
 * this component supplies them with the closures they need.
 *
 * Adding a new action later = add one entry to `commands` (and optionally one
 * accelerator) — nothing else changes.
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandRegistry,
  ShortcutService,
  NotificationService,
  globalHistory,
  bus,
  log,
  useUi,
  type Command,
  type ShortcutDefinition,
} from "@/lib/core";
import { useTheme } from "@/lib/theme";
import { useProject } from "@/lib/project";

const logger = log.scoped("commands");

export function AppCommandsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toggle: toggleTheme, resolvedTheme } = useTheme();
  const ui = useUi();
  const project = useProject();

  /* -------- one global keydown listener for the whole app -------- */
  useEffect(() => ShortcutService.attach(), []);

  /* -------- commands -------- */
  useEffect(() => {
    const newProject = () => {
      bus.emit("ui:command-palette", { open: false });
      // HomeScreen listens for this and opens the wizard.
      window.dispatchEvent(new CustomEvent("webeazy:new-project"));
      void navigate({ to: "/" });
    };

    const commands: Command[] = [
      {
        id: "project.new",
        title: "New Project",
        category: "Project",
        icon: "file-plus",
        accelerator: "mod+n",
        keywords: ["create", "website", "start"],
        run: newProject,
      },
      {
        id: "project.open",
        title: "Open Project",
        category: "Project",
        icon: "folder-open",
        accelerator: "mod+o",
        keywords: ["folder", "load"],
        run: () => void project.openFromPicker(),
      },
      {
        id: "project.save",
        title: "Save Project",
        category: "File",
        icon: "save",
        accelerator: "mod+s",
        disabled: !project.bundle,
        disabledReason: "no project",
        run: () => void project.save(),
      },
      {
        id: "project.saveAs",
        title: "Save Project As…",
        category: "File",
        icon: "save-all",
        accelerator: "mod+shift+s",
        disabled: !project.bundle,
        disabledReason: "no project",
        run: () => void project.saveAs(),
      },
      {
        id: "file.export",
        title: "Export Website",
        category: "File",
        icon: "download",
        keywords: ["html", "zip", "publish"],
        disabled: true,
        disabledReason: "soon",
        run: () => {
          NotificationService.info("Export arrives in a later milestone.");
        },
      },
      {
        id: "edit.undo",
        title: "Undo",
        category: "Edit",
        icon: "undo",
        accelerator: "mod+z",
        run: () => {
          void globalHistory.undo().then((ok) => {
            if (!ok) NotificationService.info("Nothing to undo");
          });
        },
      },
      {
        id: "edit.redo",
        title: "Redo",
        category: "Edit",
        icon: "redo",
        accelerator: "mod+y",
        run: () => {
          void globalHistory.redo().then((ok) => {
            if (!ok) NotificationService.info("Nothing to redo");
          });
        },
      },
      {
        id: "view.toggleTheme",
        title: `Toggle Theme (now ${resolvedTheme})`,
        category: "View",
        icon: "sun",
        keywords: ["dark", "light", "appearance"],
        run: toggleTheme,
      },
      {
        id: "view.toggleLeftSidebar",
        title: "Toggle Left Sidebar",
        category: "View",
        icon: "panel-left",
        run: ui.toggleLeftSidebar,
      },
      {
        id: "view.toggleRightPanel",
        title: "Toggle Properties Panel",
        category: "View",
        icon: "panel-right",
        run: ui.toggleRightPanel,
      },
      {
        id: "view.toggleBottomPanel",
        title: "Toggle Bottom Panel",
        category: "View",
        icon: "terminal",
        run: () => ui.toggleBottomPanel(),
      },
      {
        id: "view.search",
        title: "Search Project",
        category: "View",
        icon: "search",
        accelerator: "mod+p",
        run: () => ui.setSearchOpen(true),
      },
      {
        id: "navigate.home",
        title: "Go Home",
        category: "Navigate",
        icon: "home",
        run: () => void navigate({ to: "/" }),
      },
      {
        id: "navigate.settings",
        title: "Settings",
        category: "Navigate",
        icon: "settings",
        run: () => void navigate({ to: "/settings" }),
      },
      {
        id: "navigate.plugins",
        title: "Open Plugins",
        category: "Plugins",
        icon: "puzzle",
        run: () => void navigate({ to: "/plugins" }),
      },
      {
        id: "navigate.designSystem",
        title: "Open Design System",
        category: "Navigate",
        icon: "palette",
        run: () => void navigate({ to: "/design-system" }),
      },
      {
        id: "help.about",
        title: "About WebEazy",
        category: "Help",
        icon: "info",
        run: () => void navigate({ to: "/about" }),
      },
    ];

    const off = CommandRegistry.registerAll(commands);
    logger.debug(`registered ${commands.length} commands`);
    return off;
  }, [navigate, project, resolvedTheme, toggleTheme, ui]);

  /* -------- shortcuts (thin bindings onto commands) -------- */
  useEffect(() => {
    const run = (id: string) => () => void CommandRegistry.execute(id);
    const bindings: ShortcutDefinition[] = [
      {
        id: "project.new",
        accelerator: "mod+n",
        description: "New project",
        handler: run("project.new"),
      },
      {
        id: "project.open",
        accelerator: "mod+o",
        description: "Open project",
        handler: run("project.open"),
      },
      {
        id: "project.save",
        accelerator: "mod+s",
        description: "Save project",
        allowInInput: true,
        handler: run("project.save"),
      },
      {
        id: "project.saveAs",
        accelerator: "mod+shift+s",
        description: "Save project as",
        allowInInput: true,
        handler: run("project.saveAs"),
      },
      {
        id: "view.search",
        accelerator: "mod+p",
        description: "Quick search",
        allowInInput: true,
        handler: () => ui.setSearchOpen(true),
      },
      {
        id: "view.commandPalette",
        accelerator: "mod+shift+p",
        description: "Command palette",
        allowInInput: true,
        handler: () => ui.setPaletteOpen(true),
      },
      { id: "edit.undo", accelerator: "mod+z", description: "Undo", handler: run("edit.undo") },
      { id: "edit.redo", accelerator: "mod+y", description: "Redo", handler: run("edit.redo") },
      {
        id: "ui.escape",
        accelerator: "escape",
        description: "Close overlays",
        allowInInput: true,
        passive: true,
        handler: () => {
          ui.setPaletteOpen(false);
          ui.setSearchOpen(false);
        },
      },
    ];
    return ShortcutService.registerAll(bindings);
  }, [ui]);

  /* -------- announce readiness once -------- */
  useEffect(() => {
    bus.emit("app:ready", { at: new Date().toISOString() });
    log.scoped("app").info("WebEazy ready");
  }, []);

  return <>{children}</>;
}
