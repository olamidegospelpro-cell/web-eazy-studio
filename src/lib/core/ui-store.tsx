/**
 * UI state provider — the "window manager" + palette/search state.
 *
 * Owns panel geometry (sidebar collapse, right panel, bottom panel) and
 * persists it through PreferencesService so layout survives reloads. Also
 * holds the open/closed state of the command palette and global search so any
 * module can toggle them via `useUi()` or the event bus.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PreferencesService,
  type AppPreferencesState,
  type PanelLayoutPreferences,
} from "./preferences";
import { bus } from "./event-bus";
import { log } from "./logger";

export interface UiState {
  layout: PanelLayoutPreferences;
  preferences: AppPreferencesState;
  setLayout: (patch: Partial<PanelLayoutPreferences>) => void;
  setPreferences: (patch: Partial<AppPreferencesState>) => void;
  resetLayout: () => void;

  toggleLeftSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: (open?: boolean) => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const UiContext = createContext<UiState | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<AppPreferencesState>(
    PreferencesService.get(),
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Hydrate from localStorage after mount to keep SSR markup stable.
  useEffect(() => {
    setPreferencesState(PreferencesService.hydrate());
    const off = PreferencesService.subscribe(setPreferencesState);
    log.scoped("ui").debug("layout preferences hydrated");
    return off;
  }, []);

  useEffect(() => {
    log.setLevel(preferences.logging.level as never);
  }, [preferences.logging.level]);

  const setLayout = useCallback((patch: Partial<PanelLayoutPreferences>) => {
    PreferencesService.setLayout(patch);
  }, []);

  const setPreferences = useCallback((patch: Partial<AppPreferencesState>) => {
    PreferencesService.set(patch);
  }, []);

  const resetLayout = useCallback(() => {
    PreferencesService.setLayout(PreferencesService.get().layout);
    PreferencesService.reset();
  }, []);

  const value = useMemo<UiState>(() => {
    const layout = preferences.layout;
    return {
      layout,
      preferences,
      setLayout,
      setPreferences,
      resetLayout,
      toggleLeftSidebar: () => setLayout({ leftSidebarCollapsed: !layout.leftSidebarCollapsed }),
      toggleRightPanel: () => setLayout({ rightPanelVisible: !layout.rightPanelVisible }),
      toggleBottomPanel: (open?: boolean) =>
        setLayout({ bottomPanelOpen: open ?? !layout.bottomPanelOpen }),
      paletteOpen,
      setPaletteOpen: (open: boolean) => {
        setPaletteOpen(open);
        bus.emit("ui:command-palette", { open });
      },
      searchOpen,
      setSearchOpen: (open: boolean) => {
        setSearchOpen(open);
        bus.emit("ui:search", { open });
      },
    };
  }, [preferences, setLayout, setPreferences, resetLayout, paletteOpen, searchOpen]);

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiState {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within <UiProvider>");
  return ctx;
}
