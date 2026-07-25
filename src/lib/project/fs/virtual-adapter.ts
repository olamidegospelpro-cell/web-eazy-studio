/**
 * Virtual filesystem adapter — the always-available fallback.
 *
 * Files are stored in IndexedDB under their full path
 * (`<root>/pages/home.json`), so the folder layout on "disk" is identical to
 * the native adapter. This keeps every service path-based and lets the same
 * project be exported to a real folder later without conversion.
 */
import type { ProjectLocation } from "../types";
import { idb, STORE_FILES } from "./idb";
import { FsError, splitPath, type DirEntry, type FsAdapter } from "./types";

const INDEX_KEY = "__index__";

type FileIndex = Record<string, true>;

async function readIndex(): Promise<FileIndex> {
  return (await idb.get<FileIndex>(STORE_FILES, INDEX_KEY)) ?? {};
}

async function writeIndex(index: FileIndex) {
  await idb.put(STORE_FILES, INDEX_KEY, index);
}

function join(location: ProjectLocation, relativePath: string) {
  const segments = splitPath(relativePath);
  return [location.path, ...segments].join("/");
}

export const virtualAdapter: FsAdapter = {
  kind: "virtual",
  canPickFolder: false,
  canReveal: false,

  async pickDirectory(suggestedName = "WebEazy Project") {
    const safe = suggestedName.replace(/^\.+/, "").trim() || "WebEazy Project";
    return { kind: "virtual", path: `WebEazy/${safe}` };
  },

  async ensureDir(location, relativePath) {
    // Directories are implicit; record a marker so listDir can report them.
    const index = await readIndex();
    const path = join(location, relativePath);
    index[`${path}/`] = true;
    await writeIndex(index);
  },

  async writeText(location, relativePath, contents) {
    const path = join(location, relativePath);
    await idb.put(STORE_FILES, path, contents);
    const index = await readIndex();
    index[path] = true;
    await writeIndex(index);
  },

  async readText(location, relativePath) {
    const path = join(location, relativePath);
    const value = await idb.get<string>(STORE_FILES, path);
    if (typeof value !== "string") {
      throw new FsError("not-found", `Missing file: ${relativePath}`, "The project may be incomplete.");
    }
    return value;
  },

  async exists(location, relativePath) {
    const path = join(location, relativePath);
    const index = await readIndex();
    return Boolean(index[path] || index[`${path}/`]);
  },

  async listDir(location, relativePath) {
    const prefix = relativePath ? `${join(location, relativePath)}/` : `${location.path}/`;
    const index = await readIndex();
    const entries = new Map<string, DirEntry>();
    for (const key of Object.keys(index)) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length).replace(/\/$/, "");
      if (!rest) continue;
      const [head, ...tail] = rest.split("/");
      entries.set(head, { name: head, kind: tail.length || key.endsWith("/") ? "directory" : "file" });
    }
    return [...entries.values()];
  },

  async remove(location, relativePath) {
    const path = join(location, relativePath);
    const index = await readIndex();
    for (const key of Object.keys(index)) {
      if (key === path || key === `${path}/` || key.startsWith(`${path}/`)) {
        delete index[key];
        await idb.del(STORE_FILES, key);
      }
    }
    await writeIndex(index);
  },

  async removeRoot(location) {
    const index = await readIndex();
    for (const key of Object.keys(index)) {
      if (key === location.path || key.startsWith(`${location.path}/`)) {
        delete index[key];
        await idb.del(STORE_FILES, key);
      }
    }
    await writeIndex(index);
  },

  async reveal() {
    throw new FsError(
      "unsupported",
      "This workspace has no OS folder to reveal",
      "Save the project to a real folder to enable Reveal in folder.",
    );
  },
};
