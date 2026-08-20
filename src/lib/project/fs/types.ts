/**
 * Filesystem abstraction.
 *
 * Every project read/write in WebEazy goes through this interface. Two
 * adapters implement it today (native folder picker, virtual IndexedDB
 * workspace) and a Tauri adapter can be added later without touching a single
 * service or component — that is the entire point of this boundary.
 */
import type { ProjectLocation } from "../types";

export type FsErrorCode =
  "cancelled" | "unsupported" | "permission" | "not-found" | "hidden-folder" | "io";

export class FsError extends Error {
  code: FsErrorCode;
  suggestion?: string;

  constructor(code: FsErrorCode, message: string, suggestion?: string) {
    super(message);
    this.name = "FsError";
    this.code = code;
    this.suggestion = suggestion;
  }
}

export interface DirEntry {
  name: string;
  kind: "file" | "directory";
}

export interface FsAdapter {
  readonly kind: ProjectLocation["kind"];
  readonly canPickFolder: boolean;
  readonly canReveal: boolean;
  pickDirectory(suggestedName?: string): Promise<ProjectLocation>;
  ensureDir(location: ProjectLocation, relativePath: string): Promise<void>;
  writeText(location: ProjectLocation, relativePath: string, contents: string): Promise<void>;
  readText(location: ProjectLocation, relativePath: string): Promise<string>;
  exists(location: ProjectLocation, relativePath: string): Promise<boolean>;
  listDir(location: ProjectLocation, relativePath: string): Promise<DirEntry[]>;
  remove(location: ProjectLocation, relativePath: string): Promise<void>;
  removeRoot(location: ProjectLocation): Promise<void>;
  reveal(location: ProjectLocation): Promise<void>;
}

/** Normalises "a//b/" → ["a","b"]; rejects traversal and hidden segments. */
export function splitPath(relativePath: string): string[] {
  const segments = relativePath.split("/").filter((s) => s.length > 0 && s !== ".");
  if (segments.some((s) => s === "..")) {
    throw new FsError(
      "io",
      `Illegal path "${relativePath}"`,
      "Paths may not escape the project folder.",
    );
  }
  if (segments.some((s) => s.startsWith("."))) {
    throw new FsError(
      "hidden-folder",
      `WebEazy does not write into hidden paths ("${relativePath}")`,
      "Choose a visible folder or file name.",
    );
  }
  return segments;
}
