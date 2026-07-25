/**
 * StorageService — app-level (not project-level) persistence.
 *
 * Holds preferences, the recent-projects list and the crash-recovery session
 * snapshot. Project *content* never lives here; it belongs in the project
 * folder. Keeping the split strict means clearing app state can never destroy
 * a user's website.
 */
import { idb, STORE_KV } from "./fs/idb";
import { DEFAULT_PREFERENCES } from "./defaults";
import type { AppPreferences, ProjectBundle, RecentProject } from "./types";

const KEY_PREFS = "preferences";
const KEY_RECENTS = "recents";
const KEY_SESSION = "session";

export interface SessionSnapshot {
  savedAt: string;
  clean: boolean;
  bundle: ProjectBundle;
}

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await idb.get<T>(STORE_KV, key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

async function write<T>(key: string, value: T): Promise<void> {
  try {
    await idb.put(STORE_KV, key, value);
  } catch (error) {
    console.error(`[StorageService] failed to persist ${key}`, error);
  }
}

export const StorageService = {
  async getPreferences(): Promise<AppPreferences> {
    const stored = await read<Partial<AppPreferences>>(KEY_PREFS, {});
    return { ...DEFAULT_PREFERENCES, ...stored };
  },
  async setPreferences(next: Partial<AppPreferences>): Promise<AppPreferences> {
    const merged = { ...(await StorageService.getPreferences()), ...next };
    await write(KEY_PREFS, merged);
    return merged;
  },

  getRecents(): Promise<RecentProject[]> {
    return read<RecentProject[]>(KEY_RECENTS, []);
  },
  setRecents(list: RecentProject[]): Promise<void> {
    return write(KEY_RECENTS, list);
  },

  getSession(): Promise<SessionSnapshot | undefined> {
    return read<SessionSnapshot | undefined>(KEY_SESSION, undefined);
  },
  setSession(snapshot: SessionSnapshot): Promise<void> {
    return write(KEY_SESSION, snapshot);
  },
  async clearSession(): Promise<void> {
    try {
      await idb.del(STORE_KV, KEY_SESSION);
    } catch {
      /* non-fatal */
    }
  },
};
