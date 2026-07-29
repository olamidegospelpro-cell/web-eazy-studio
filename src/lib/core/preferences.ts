/**
 * PreferencesService — centralized, synchronous app preferences.
 *
 * Scope: *application* preferences (UI/window/editor/shortcuts), not project
 * data and not the project-level `AppPreferences` in `@/lib/project` (which
 * covers autosave/backup defaults tied to project files). This service is the
 * single place later milestones add user-facing settings.
 *
 * Storage: localStorage (synchronous, survives reloads, avoids hydration
 * flicker). Reads are SSR-safe and fall back to defaults.
 */
import { log } from "./logger";
import { bus } from "./event-bus";

const STORAGE_KEY = "webeazy.preferences.v1";
const logger = log.scoped("preferences");

export interface PanelLayoutPreferences {
  leftSidebarCollapsed: boolean;
  leftSidebarWidth: number;
  rightPanelVisible: boolean;
  rightPanelWidth: number;
  bottomPanelOpen: boolean;
  bottomPanelHeight: number;
  bottomPanelTab: string;
  statusBarVisible: boolean;
}

export interface AppPreferencesState {
  /** "light" | "dark" | "system" — mirrored by the ThemeProvider. */
  theme: string;
  layout: PanelLayoutPreferences;
  autosave: { enabled: boolean; intervalMs: number };
  /** commandId → accelerator override, e.g. { "project.save": "mod+s" } */
  shortcuts: Record<string, string>;
  /** Recent file paths (project-level recents live in IndexedDB). */
  recentFiles: string[];
  logging: { level: string };
  /** Forward-compat bucket so future prefs need no migration. */
  extensions: Record<string, unknown>;
}

export const DEFAULT_APP_PREFERENCES: AppPreferencesState = {
  theme: "system",
  layout: {
    leftSidebarCollapsed: true,
    leftSidebarWidth: 208,
    rightPanelVisible: true,
    rightPanelWidth: 288,
    bottomPanelOpen: false,
    bottomPanelHeight: 176,
    bottomPanelTab: "console",
    statusBarVisible: true,
  },
  autosave: { enabled: true, intervalMs: 30_000 },
  shortcuts: {},
  recentFiles: [],
  logging: { level: import.meta.env.PROD ? "warn" : "debug" },
  extensions: {},
};

function merge(stored: Partial<AppPreferencesState>): AppPreferencesState {
  return {
    ...DEFAULT_APP_PREFERENCES,
    ...stored,
    layout: { ...DEFAULT_APP_PREFERENCES.layout, ...(stored.layout ?? {}) },
    autosave: { ...DEFAULT_APP_PREFERENCES.autosave, ...(stored.autosave ?? {}) },
    shortcuts: { ...DEFAULT_APP_PREFERENCES.shortcuts, ...(stored.shortcuts ?? {}) },
    logging: { ...DEFAULT_APP_PREFERENCES.logging, ...(stored.logging ?? {}) },
    extensions: { ...DEFAULT_APP_PREFERENCES.extensions, ...(stored.extensions ?? {}) },
  };
}

class Preferences {
  private state: AppPreferencesState = DEFAULT_APP_PREFERENCES;
  private hydrated = false;
  private listeners = new Set<(state: AppPreferencesState) => void>();

  /** Reads localStorage once; safe to call repeatedly and during SSR. */
  hydrate(): AppPreferencesState {
    if (this.hydrated || typeof window === "undefined") return this.state;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) this.state = merge(JSON.parse(raw) as Partial<AppPreferencesState>);
    } catch (error) {
      logger.warn("failed to read preferences, using defaults", error);
    }
    this.notify();
    return this.state;
  }

  get(): AppPreferencesState {
    return this.state;
  }

  set(patch: Partial<AppPreferencesState>): AppPreferencesState {
    this.state = merge({ ...this.state, ...patch });
    this.persist();
    this.notify();
    return this.state;
  }

  /** Patch just the layout slice — the window manager's write path. */
  setLayout(patch: Partial<PanelLayoutPreferences>): AppPreferencesState {
    const next = this.set({ layout: { ...this.state.layout, ...patch } });
    bus.emit("ui:layout-changed", { key: Object.keys(patch).join(",") });
    return next;
  }

  reset(): AppPreferencesState {
    this.state = DEFAULT_APP_PREFERENCES;
    this.persist();
    this.notify();
    return this.state;
  }

  subscribe(listener: (state: AppPreferencesState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      logger.warn("failed to persist preferences", error);
    }
  }

  private notify() {
    for (const listener of this.listeners) listener(this.state);
  }
}

export const PreferencesService = new Preferences();
