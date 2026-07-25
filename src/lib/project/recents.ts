/**
 * RecentProjectsService — ordered, de-duplicated list of recently used
 * projects. Removing an entry here is metadata-only and never touches files;
 * deleting files is a separate, explicit ProjectService operation.
 */
import { StorageService } from "./storage";
import { nowIso } from "./defaults";
import type { ProjectBundle, ProjectLocation, RecentProject } from "./types";

function toRecent(bundle: ProjectBundle, location: ProjectLocation): RecentProject {
  return {
    id: bundle.manifest.id,
    name: bundle.manifest.name,
    websiteName: bundle.manifest.websiteName,
    websiteType: bundle.manifest.websiteType,
    location,
    createdAt: bundle.manifest.createdAt,
    lastOpened: nowIso(),
  };
}

export const RecentProjectsService = {
  list: () => StorageService.getRecents(),

  async touch(bundle: ProjectBundle, location: ProjectLocation): Promise<RecentProject[]> {
    const prefs = await StorageService.getPreferences();
    const existing = await StorageService.getRecents();
    const entry = toRecent(bundle, location);
    const previous = existing.find((r) => r.id === entry.id);
    const next = [
      { ...entry, createdAt: previous?.createdAt ?? entry.createdAt },
      ...existing.filter((r) => r.id !== entry.id),
    ].slice(0, Math.max(1, prefs.recentLimit));
    await StorageService.setRecents(next);
    return next;
  },

  async rename(id: string, name: string): Promise<RecentProject[]> {
    const next = (await StorageService.getRecents()).map((r) => (r.id === id ? { ...r, name } : r));
    await StorageService.setRecents(next);
    return next;
  },

  /** Metadata-only removal — project files stay on disk. */
  async remove(id: string): Promise<RecentProject[]> {
    const next = (await StorageService.getRecents()).filter((r) => r.id !== id);
    await StorageService.setRecents(next);
    return next;
  },

  async clear(): Promise<RecentProject[]> {
    await StorageService.setRecents([]);
    return [];
  },

  async trim(limit: number): Promise<RecentProject[]> {
    const next = (await StorageService.getRecents()).slice(0, Math.max(1, limit));
    await StorageService.setRecents(next);
    return next;
  },
};
