/**
 * FileSystemService — the only filesystem entry point services may use.
 *
 * It routes each call to the adapter matching the project's location kind, so
 * a project stored in a real OS folder and one stored in the built-in
 * workspace behave identically to callers.
 */
import type { ProjectLocation } from "../types";
import { nativeAdapter, isNativeFsSupported } from "./native-adapter";
import { virtualAdapter } from "./virtual-adapter";
import { FsError, type DirEntry, type FsAdapter } from "./types";

export { FsError, isNativeFsSupported };
export type { DirEntry };

function adapterFor(location: ProjectLocation): FsAdapter {
  return location.kind === "native" ? nativeAdapter : virtualAdapter;
}

export const FileSystemService = {
  get capabilities() {
    return {
      nativePicker: isNativeFsSupported(),
      reveal: false,
    };
  },

  /** Opens the OS folder picker when available, otherwise the workspace folder. */
  async chooseLocation(suggestedName?: string): Promise<ProjectLocation> {
    if (isNativeFsSupported()) return nativeAdapter.pickDirectory(suggestedName);
    return virtualAdapter.pickDirectory(suggestedName);
  },

  async virtualLocation(suggestedName: string): Promise<ProjectLocation> {
    return virtualAdapter.pickDirectory(suggestedName);
  },

  ensureDir(location: ProjectLocation, relativePath: string) {
    return adapterFor(location).ensureDir(location, relativePath);
  },
  writeText(location: ProjectLocation, relativePath: string, contents: string) {
    return adapterFor(location).writeText(location, relativePath, contents);
  },
  writeJson(location: ProjectLocation, relativePath: string, value: unknown) {
    // Pretty-printed on purpose: project files must stay human-readable.
    return adapterFor(location).writeText(
      location,
      relativePath,
      `${JSON.stringify(value, null, 2)}\n`,
    );
  },
  readText(location: ProjectLocation, relativePath: string) {
    return adapterFor(location).readText(location, relativePath);
  },
  async readJson<T>(location: ProjectLocation, relativePath: string): Promise<T> {
    const raw = await adapterFor(location).readText(location, relativePath);
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new FsError(
        "io",
        `${relativePath} is not valid JSON`,
        "Restore the file from the project's /backups folder.",
      );
    }
  },
  exists(location: ProjectLocation, relativePath: string) {
    return adapterFor(location).exists(location, relativePath);
  },
  listDir(location: ProjectLocation, relativePath = "") {
    return adapterFor(location).listDir(location, relativePath);
  },
  remove(location: ProjectLocation, relativePath: string) {
    return adapterFor(location).remove(location, relativePath);
  },
  removeRoot(location: ProjectLocation) {
    return adapterFor(location).removeRoot(location);
  },
  reveal(location: ProjectLocation) {
    return adapterFor(location).reveal(location);
  },
};
