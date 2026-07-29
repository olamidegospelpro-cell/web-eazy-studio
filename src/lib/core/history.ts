/**
 * HistoryManager — reusable undo/redo engine (architecture only).
 *
 * Design
 * ------
 * Command-based, not snapshot-based: each entry knows how to `undo` and `redo`
 * itself, so the future editor can push cheap, granular operations instead of
 * cloning the whole page tree. Entries may `coalesceKey` to merge rapid edits
 * (e.g. dragging a slider) into one undo step.
 *
 * Scopes let several independent stacks coexist (global app, one per open
 * page) without extra plumbing: `history.scope("page:home")`.
 */
import { bus } from "./event-bus";
import { log } from "./logger";

const logger = log.scoped("history");

export interface HistoryEntry {
  label: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
  /** Entries pushed back-to-back with the same key merge into one step. */
  coalesceKey?: string;
  at?: number;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
  depth: number;
}

const COALESCE_WINDOW_MS = 600;

export class HistoryStack {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private listeners = new Set<(state: HistoryState) => void>();
  private busy = false;

  constructor(
    readonly scope: string,
    private readonly limit = 100,
  ) {}

  push(entry: HistoryEntry): void {
    // Ignore pushes triggered by our own undo/redo execution.
    if (this.busy) return;
    const stamped = { ...entry, at: entry.at ?? Date.now() };
    const previous = this.past[this.past.length - 1];
    const mergeable =
      stamped.coalesceKey &&
      previous?.coalesceKey === stamped.coalesceKey &&
      stamped.at - (previous.at ?? 0) < COALESCE_WINDOW_MS;

    if (mergeable && previous) {
      // Keep the oldest undo (restores the original state) and newest redo.
      this.past[this.past.length - 1] = { ...stamped, undo: previous.undo, at: stamped.at };
    } else {
      this.past.push(stamped);
      if (this.past.length > this.limit) this.past.shift();
    }
    this.future = [];
    this.emit();
  }

  async undo(): Promise<boolean> {
    const entry = this.past.pop();
    if (!entry) return false;
    this.busy = true;
    try {
      await entry.undo();
      this.future.push(entry);
      return true;
    } catch (error) {
      logger.error(`undo "${entry.label}" failed`, error);
      this.past.push(entry);
      return false;
    } finally {
      this.busy = false;
      this.emit();
    }
  }

  async redo(): Promise<boolean> {
    const entry = this.future.pop();
    if (!entry) return false;
    this.busy = true;
    try {
      await entry.redo();
      this.past.push(entry);
      return true;
    } catch (error) {
      logger.error(`redo "${entry.label}" failed`, error);
      this.future.push(entry);
      return false;
    } finally {
      this.busy = false;
      this.emit();
    }
  }

  /** Runs `apply` and records the inverse in one call. */
  run(entry: HistoryEntry): void {
    void entry.redo();
    this.push(entry);
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.emit();
  }

  getState(): HistoryState {
    return {
      canUndo: this.past.length > 0,
      canRedo: this.future.length > 0,
      undoLabel: this.past[this.past.length - 1]?.label,
      redoLabel: this.future[this.future.length - 1]?.label,
      depth: this.past.length,
    };
  }

  subscribe(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
    bus.emit("history:changed", {
      scope: this.scope,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
    });
  }
}

class HistoryRegistry {
  private stacks = new Map<string, HistoryStack>();

  scope(name = "global"): HistoryStack {
    let stack = this.stacks.get(name);
    if (!stack) {
      stack = new HistoryStack(name);
      this.stacks.set(name, stack);
    }
    return stack;
  }

  dispose(name: string): void {
    this.stacks.delete(name);
  }

  clearAll(): void {
    for (const stack of this.stacks.values()) stack.clear();
  }
}

export const HistoryService = new HistoryRegistry();
/** Convenience handle for app-level undo/redo (toolbar + shortcuts). */
export const globalHistory = HistoryService.scope("global");
