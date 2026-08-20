import type { ProjectLocation } from "../types";
import { idb, STORE_HANDLES } from "./idb";
import { FsError, splitPath, type DirEntry, type FsAdapter } from "./types";

type PermissionMode = { mode: "read" | "readwrite" };
interface DirHandle extends FileSystemDirectoryHandle { queryPermission?: (d: PermissionMode) => Promise<PermissionState>; requestPermission?: (d: PermissionMode) => Promise<PermissionState>; }
type PickerWindow = Window & { showDirectoryPicker?: (opts?: { mode?: "read" | "readwrite"; startIn?: string; id?: string }) => Promise<FileSystemDirectoryHandle>; };
export function isNativeFsSupported(): boolean { return typeof window !== "undefined" && typeof (window as PickerWindow).showDirectoryPicker === "function"; }
async function loadHandle(location: ProjectLocation): Promise<DirHandle> {
  if (!location.handleId) throw new FsError("not-found", "This project has no folder reference stored");
  const handle = await idb.get<DirHandle>(STORE_HANDLES, location.handleId);
  if (!handle) throw new FsError("not-found", `WebEazy lost access to "${location.path}"`, "Use Save As to pick the project folder again.");
  const state = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "granted";
  if (state !== "granted") {
    const granted = (await handle.requestPermission?.({ mode: "readwrite" })) ?? "denied";
    if (granted !== "granted") throw new FsError("permission", `WebEazy needs permission to write to "${location.path}"`, "Click Grant access when your browser asks, or choose the folder again with Save As.");
  }
  return handle;
}
async function resolveDir(location: ProjectLocation, segments: string[], create: boolean) {
  let dir = (await loadHandle(location)) as FileSystemDirectoryHandle;
  for (const segment of segments) {
    try { dir = await dir.getDirectoryHandle(segment, { create }); }
    catch { throw new FsError(create ? "io" : "not-found", `Folder "${segment}" is missing in ${location.path}`, create ? "Check that you still have write access to the folder." : undefined); }
  }
  return dir;
}
export const nativeAdapter: FsAdapter = {
  kind: "native", canPickFolder: true, canReveal: false,
  async pickDirectory(suggestedName) {
    const picker = (window as PickerWindow).showDirectoryPicker;
    if (!picker) throw new FsError("unsupported", "This browser cannot open the system folder picker");
    let handle: FileSystemDirectoryHandle;
    try { handle = await picker({ mode: "readwrite", id: "webeazy-projects", startIn: "documents" }); }
    catch { throw new FsError("cancelled", "Folder selection was cancelled"); }
    if (handle.name.startsWith(".")) throw new FsError("hidden-folder", `"${handle.name}" is a hidden folder`, "Pick a normal, visible folder such as Documents/WebEazy.");
    const handleId = `dir_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await idb.put(STORE_HANDLES, handleId, handle);
    return { kind: "native", path: suggestedName ? `${handle.name}/${suggestedName}` : handle.name, handleId };
  },
  async ensureDir(location, relativePath) { await resolveDir(location, splitPath(relativePath), true); },
  async writeText(location, relativePath, contents) {
    const segments = splitPath(relativePath); const fileName = segments.pop(); if (!fileName) throw new FsError("io", "A file name is required");
    const dir = await resolveDir(location, segments, true); const file = await dir.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable(); await writable.write(contents); await writable.close();
  },
  async readText(location, relativePath) {
    const segments = splitPath(relativePath); const fileName = segments.pop(); if (!fileName) throw new FsError("io", "A file name is required");
    const dir = await resolveDir(location, segments, false);
    try { const handle = await dir.getFileHandle(fileName); return await (await handle.getFile()).text(); }
    catch { throw new FsError("not-found", `Missing file: ${relativePath}`, "The project folder looks incomplete."); }
  },
  async exists(location, relativePath) {
    const segments = splitPath(relativePath); const last = segments.pop(); if (!last) return true;
    try { const dir = await resolveDir(location, segments, false); try { await dir.getFileHandle(last); return true; } catch { await dir.getDirectoryHandle(last); return true; } }
    catch { return false; }
  },
  async listDir(location, relativePath) {
    const dir = await resolveDir(location, splitPath(relativePath), false); const entries: DirEntry[] = [];
    for await (const entry of (dir as any).values()) entries.push({ name: entry.name, kind: entry.kind === "directory" ? "directory" : "file" });
    return entries;
  },
  async remove(location, relativePath) {
    const segments = splitPath(relativePath); const last = segments.pop(); if (!last) throw new FsError("io", "Refusing to delete the project root implicitly");
    const dir = await resolveDir(location, segments, false); await dir.removeEntry(last, { recursive: true });
  },
  async removeRoot(location) {
    const dir = await resolveDir(location, [], false); const names: string[] = [];
    for await (const entry of (dir as any).values()) names.push(entry.name);
    for (const name of names) await dir.removeEntry(name, { recursive: true });
  },
  async reveal(location) { throw new FsError("unsupported", `Browsers cannot open "${location.path}" in your file manager`, "The desktop build of WebEazy will reveal the folder directly."); },
};
