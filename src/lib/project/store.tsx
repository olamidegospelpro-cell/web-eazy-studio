/**
 * Project store — the single stateful bridge between services and UI.
 *
 * Everything here is orchestration: which project is open, whether it has
 * unsaved changes, and which service call to make. No filesystem logic, no
 * validation logic, no rendering logic. The future editor will mutate pages
 * through `updatePage`/`markDirty` and never talk to services directly.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AutosaveService } from "./autosave";
import { FileSystemService, FsError } from "./fs";
import { ProjectError, ProjectService, type CreateProjectInput } from "./project-service";
import { RecentProjectsService } from "./recents";
import { StorageService, type SessionSnapshot } from "./storage";
import { DEFAULT_PREFERENCES, nowIso } from "./defaults";
import { notify } from "@/components/ds/toast";
import type {
  AppPreferences,
  PageDocument,
  ProjectBundle,
  ProjectLocation,
  RecentProject,
  SaveState,
  ValidationReport,
} from "./types";

type ChangeSet = { theme: boolean; manifest: boolean; pageIds: Set<string> };

const emptyChanges = (): ChangeSet => ({ theme: false, manifest: false, pageIds: new Set() });

export interface ProjectStore {
  ready: boolean;
  bundle: ProjectBundle | null;
  location: ProjectLocation | null;
  saveState: SaveState;
  lastSavedAt: string | null;
  lastError: { message: string; suggestion?: string; report?: ValidationReport } | null;
  dirty: boolean;
  preferences: AppPreferences;
  recents: RecentProject[];
  pendingRecovery: SessionSnapshot | null;
  capabilities: { nativePicker: boolean };

  createProject(input: CreateProjectInput): Promise<ProjectBundle>;
  openLocation(location: ProjectLocation): Promise<void>;
  openFromPicker(): Promise<void>;
  save(): Promise<void>;
  saveAs(): Promise<void>;
  closeProject(): void;
  renameProject(name: string): void;
  updatePage(pageId: string, patch: Partial<PageDocument>): void;
  markDirty(change?: Partial<{ theme: boolean; manifest: boolean; pageId: string }>): void;

  refreshRecents(): Promise<void>;
  removeRecent(id: string): Promise<void>;
  renameRecent(id: string, name: string): Promise<void>;
  duplicateRecent(recent: RecentProject, name: string): Promise<void>;
  deleteRecentFolder(recent: RecentProject): Promise<void>;
  revealRecent(recent: RecentProject): Promise<void>;

  updatePreferences(patch: Partial<AppPreferences>): Promise<void>;
  recoverSession(): Promise<void>;
  discardSession(): Promise<void>;
  clearError(): void;
}

const ProjectContext = createContext<ProjectStore | null>(null);

function describe(error: unknown): {
  message: string;
  suggestion?: string;
  report?: ValidationReport;
} {
  if (error instanceof ProjectError)
    return { message: error.message, suggestion: error.suggestion, report: error.report };
  if (error instanceof FsError) return { message: error.message, suggestion: error.suggestion };
  if (error instanceof Error) return { message: error.message };
  return { message: "Something went wrong." };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [location, setLocation] = useState<ProjectLocation | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<ProjectStore["lastError"]>(null);
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [recents, setRecents] = useState<RecentProject[]>([]);
  const [pendingRecovery, setPendingRecovery] = useState<SessionSnapshot | null>(null);

  const changes = useRef<ChangeSet>(emptyChanges());
  const bundleRef = useRef<ProjectBundle | null>(null);
  const locationRef = useRef<ProjectLocation | null>(null);
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  bundleRef.current = bundle;
  locationRef.current = location;

  const setDirtyFlag = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirty(value);
    setSaveState((prev) => (value ? "dirty" : prev === "dirty" ? "idle" : prev));
  }, []);

  /* ---------------- boot ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prefs, list, session] = await Promise.all([
        StorageService.getPreferences(),
        RecentProjectsService.list(),
        StorageService.getSession(),
      ]);
      if (cancelled) return;
      setPreferences(prefs);
      setRecents(list);
      if (session && !session.clean) setPendingRecovery(session);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- session snapshot (crash recovery) ---------------- */
  const snapshot = useCallback(async (clean: boolean) => {
    const current = bundleRef.current;
    if (!current) return;
    await StorageService.setSession({ savedAt: nowIso(), clean, bundle: current });
  }, []);

  const refreshRecents = useCallback(async () => {
    setRecents(await RecentProjectsService.list());
  }, []);

  /* ---------------- saving ---------------- */
  const persist = useCallback(
    async (target: ProjectLocation, mode: "full" | "incremental") => {
      const current = bundleRef.current;
      if (!current) return;
      setSaveState("saving");
      setLastError(null);
      try {
        const next =
          mode === "full"
            ? await ProjectService.writeAll(current, target)
            : await ProjectService.writeChanged(current, target, {
                theme: changes.current.theme,
                manifest: changes.current.manifest,
                pageIds: [...changes.current.pageIds],
              });
        changes.current = emptyChanges();
        setBundle(next);
        bundleRef.current = next;
        setLocation(target);
        locationRef.current = target;
        setDirtyFlag(false);
        setSaveState("saved");
        setLastSavedAt(nowIso());
        await RecentProjectsService.touch(next, target);
        await refreshRecents();
        await StorageService.setSession({ savedAt: nowIso(), clean: true, bundle: next });
      } catch (error) {
        const described = describe(error);
        setLastError(described);
        setSaveState("error");
        notify.error("Save failed", described.suggestion ?? described.message);
        throw error;
      }
    },
    [refreshRecents, setDirtyFlag],
  );

  const chooseLocationFor = useCallback(async (name: string) => {
    const suggested = ProjectService.suggestFolderName(name);
    if (FileSystemService.capabilities.nativePicker)
      return FileSystemService.chooseLocation(suggested);
    return FileSystemService.virtualLocation(suggested);
  }, []);

  const save = useCallback(async () => {
    const current = bundleRef.current;
    if (!current) return;
    let target = locationRef.current;
    if (!target) {
      // First save — this is where the user picks the folder.
      target = await chooseLocationFor(current.manifest.name).catch((error) => {
        const described = describe(error);
        if (error instanceof FsError && error.code === "cancelled") return null;
        setLastError(described);
        notify.error("Could not choose a folder", described.suggestion ?? described.message);
        return null;
      });
      if (!target) return;
    }
    await persist(target, "full").then(() => notify.success("Project saved", target?.path));
  }, [chooseLocationFor, persist]);

  const saveAs = useCallback(async () => {
    const current = bundleRef.current;
    if (!current) return;
    try {
      const target = await chooseLocationFor(current.manifest.name);
      await persist(target, "full");
      notify.success("Project saved", target.path);
    } catch (error) {
      if (error instanceof FsError && error.code === "cancelled") return;
      /* persist already surfaced the error */
    }
  }, [chooseLocationFor, persist]);

  /* ---------------- autosave ---------------- */
  const autosave = useRef<AutosaveService | null>(null);
  if (!autosave.current) {
    autosave.current = new AutosaveService(
      {
        isDirty: () => dirtyRef.current && Boolean(locationRef.current),
        save: async () => {
          const target = locationRef.current;
          if (!target) return;
          await persist(target, "incremental");
        },
        onError: (error) => console.error("[autosave]", error),
      },
      DEFAULT_PREFERENCES.autosaveIntervalMs,
    );
  }

  useEffect(() => {
    const service = autosave.current!;
    if (bundle && preferences.autosaveEnabled) service.start(preferences.autosaveIntervalMs);
    else service.stop();
    return () => service.stop();
  }, [bundle, preferences.autosaveEnabled, preferences.autosaveIntervalMs]);

  /* ---------------- unload guard ----------------
   * Save shortcuts (Ctrl/⌘+S, Ctrl/⌘+Shift+S) are owned by ShortcutService
   * in `@/lib/core` and dispatched via the "project.save" command, so this
   * store no longer binds keyboard handlers itself. */

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      void snapshot(false);
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [snapshot]);

  /* ---------------- lifecycle actions ---------------- */
  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      const created = ProjectService.createBundle(input);
      setBundle(created);
      bundleRef.current = created;
      setLocation(null);
      locationRef.current = null;
      changes.current = {
        theme: true,
        manifest: true,
        pageIds: new Set(created.pages.map((p) => p.id)),
      };
      setDirtyFlag(true);
      setSaveState("dirty");
      setLastError(null);
      await StorageService.setSession({ savedAt: nowIso(), clean: false, bundle: created });
      return created;
    },
    [setDirtyFlag],
  );

  const openLocation = useCallback(
    async (target: ProjectLocation) => {
      try {
        const opened = await ProjectService.open(target);
        setBundle(opened);
        bundleRef.current = opened;
        setLocation(target);
        locationRef.current = target;
        changes.current = emptyChanges();
        setDirtyFlag(false);
        setSaveState("idle");
        setLastError(null);
        await RecentProjectsService.touch(opened, target);
        await refreshRecents();
        await StorageService.setSession({ savedAt: nowIso(), clean: true, bundle: opened });
        notify.success("Project opened", opened.manifest.name);
      } catch (error) {
        const described = describe(error);
        setLastError(described);
        notify.error("Could not open project", described.message);
        throw error;
      }
    },
    [refreshRecents, setDirtyFlag],
  );

  const openFromPicker = useCallback(async () => {
    try {
      const target = await FileSystemService.chooseLocation();
      await openLocation(target);
    } catch (error) {
      if (error instanceof FsError && error.code === "cancelled") return;
      if (error instanceof FsError) {
        setLastError(describe(error));
        notify.error("Could not open folder", error.suggestion ?? error.message);
      }
    }
  }, [openLocation]);

  const closeProject = useCallback(() => {
    setBundle(null);
    bundleRef.current = null;
    setLocation(null);
    locationRef.current = null;
    changes.current = emptyChanges();
    setDirtyFlag(false);
    setSaveState("idle");
    void StorageService.clearSession();
  }, [setDirtyFlag]);

  const markDirty = useCallback(
    (change?: Partial<{ theme: boolean; manifest: boolean; pageId: string }>) => {
      if (change?.theme) changes.current.theme = true;
      if (change?.manifest) changes.current.manifest = true;
      if (change?.pageId) changes.current.pageIds.add(change.pageId);
      setDirtyFlag(true);
      void snapshot(false);
    },
    [setDirtyFlag, snapshot],
  );

  const renameProject = useCallback(
    (name: string) => {
      const current = bundleRef.current;
      if (!current) return;
      const next = ProjectService.rename(current, name);
      setBundle(next);
      bundleRef.current = next;
      markDirty({ manifest: true });
    },
    [markDirty],
  );

  const updatePage = useCallback(
    (pageId: string, patch: Partial<PageDocument>) => {
      const current = bundleRef.current;
      if (!current) return;
      const next: ProjectBundle = {
        ...current,
        pages: current.pages.map((p) =>
          p.id === pageId ? { ...p, ...patch, lastModified: nowIso() } : p,
        ),
      };
      setBundle(next);
      bundleRef.current = next;
      markDirty({ pageId });
    },
    [markDirty],
  );

  /* ---------------- recents actions ---------------- */
  const removeRecent = useCallback(async (id: string) => {
    setRecents(await RecentProjectsService.remove(id));
    notify.info("Removed from recents", "The project files were not deleted.");
  }, []);

  const renameRecent = useCallback(
    async (id: string, name: string) => {
      setRecents(await RecentProjectsService.rename(id, name));
      const current = bundleRef.current;
      if (current?.manifest.id === id) renameProject(name);
    },
    [renameProject],
  );

  const duplicateRecent = useCallback(
    async (recent: RecentProject, name: string) => {
      try {
        const destination = await chooseLocationFor(name);
        const copy = await ProjectService.duplicate(recent.location, destination, name);
        await RecentProjectsService.touch(copy, destination);
        await refreshRecents();
        notify.success("Project duplicated", destination.path);
      } catch (error) {
        if (error instanceof FsError && error.code === "cancelled") return;
        const described = describe(error);
        setLastError(described);
        notify.error("Duplicate failed", described.suggestion ?? described.message);
      }
    },
    [chooseLocationFor, refreshRecents],
  );

  const deleteRecentFolder = useCallback(
    async (recent: RecentProject) => {
      try {
        await ProjectService.deleteFolder(recent.location);
        setRecents(await RecentProjectsService.remove(recent.id));
        if (bundleRef.current?.manifest.id === recent.id) closeProject();
        notify.success("Project folder deleted", recent.location.path);
      } catch (error) {
        const described = describe(error);
        setLastError(described);
        notify.error("Delete failed", described.suggestion ?? described.message);
      }
    },
    [closeProject],
  );

  const revealRecent = useCallback(async (recent: RecentProject) => {
    try {
      await FileSystemService.reveal(recent.location);
    } catch (error) {
      const described = describe(error);
      notify.info(described.message, described.suggestion);
    }
  }, []);

  /* ---------------- preferences + recovery ---------------- */
  const updatePreferences = useCallback(async (patch: Partial<AppPreferences>) => {
    const next = await StorageService.setPreferences(patch);
    setPreferences(next);
    if (patch.recentLimit) setRecents(await RecentProjectsService.trim(patch.recentLimit));
  }, []);

  const recoverSession = useCallback(async () => {
    const session = pendingRecovery;
    if (!session) return;
    setBundle(session.bundle);
    bundleRef.current = session.bundle;
    const target = session.bundle.location ?? session.bundle.manifest.settings.location ?? null;
    setLocation(target);
    locationRef.current = target;
    changes.current = {
      theme: true,
      manifest: true,
      pageIds: new Set(session.bundle.pages.map((p) => p.id)),
    };
    setDirtyFlag(true);
    setPendingRecovery(null);
    notify.success("Session recovered", "Your unsaved work was restored.");
  }, [pendingRecovery, setDirtyFlag]);

  const discardSession = useCallback(async () => {
    setPendingRecovery(null);
    await StorageService.clearSession();
  }, []);

  const value = useMemo<ProjectStore>(
    () => ({
      ready,
      bundle,
      location,
      saveState,
      lastSavedAt,
      lastError,
      dirty,
      preferences,
      recents,
      pendingRecovery,
      capabilities: { nativePicker: FileSystemService.capabilities.nativePicker },
      createProject,
      openLocation,
      openFromPicker,
      save,
      saveAs,
      closeProject,
      renameProject,
      updatePage,
      markDirty,
      refreshRecents,
      removeRecent,
      renameRecent,
      duplicateRecent,
      deleteRecentFolder,
      revealRecent,
      updatePreferences,
      recoverSession,
      discardSession,
      clearError: () => setLastError(null),
    }),
    [
      ready,
      bundle,
      location,
      saveState,
      lastSavedAt,
      lastError,
      dirty,
      preferences,
      recents,
      pendingRecovery,
      createProject,
      openLocation,
      openFromPicker,
      save,
      saveAs,
      closeProject,
      renameProject,
      updatePage,
      markDirty,
      refreshRecents,
      removeRecent,
      renameRecent,
      duplicateRecent,
      deleteRecentFolder,
      revealRecent,
      updatePreferences,
      recoverSession,
      discardSession,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectStore {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within <ProjectProvider>");
  return ctx;
}
