import type { DocumentSnapshot, EditorDocument } from "./document-types";

export interface HistoryState {
  past: DocumentSnapshot[];
  present: DocumentSnapshot;
  future: DocumentSnapshot[];
}

export interface HistoryOptions {
  maxEntries?: number;
}

export class HistoryManager {
  private state: HistoryState;
  private readonly maxEntries: number;
  private listeners = new Set<(state: HistoryState) => void>();

  constructor(initial: EditorDocument, options: HistoryOptions = {}) {
    this.maxEntries = Math.max(10, options.maxEntries ?? 100);
    this.state = {
      past: [],
      present: this.snapshot(initial, "Initial state"),
      future: [],
    };
  }

  getState(): HistoryState {
    return {
      past: [...this.state.past],
      present: this.state.present,
      future: [...this.state.future],
    };
  }

  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  commit(document: EditorDocument, label: string): void {
    this.state = {
      past: [...this.state.past, this.state.present].slice(-this.maxEntries),
      present: this.snapshot(document, label),
      future: [],
    };
    this.emit();
  }

  undo(): EditorDocument | null {
    if (!this.canUndo()) return null;
    const previous = this.state.past[this.state.past.length - 1];
    this.state = {
      past: this.state.past.slice(0, -1),
      present: previous,
      future: [this.state.present, ...this.state.future],
    };
    this.emit();
    return previous.document;
  }

  redo(): EditorDocument | null {
    if (!this.canRedo()) return null;
    const [next, ...remaining] = this.state.future;
    this.state = {
      past: [...this.state.past, this.state.present],
      present: next,
      future: remaining,
    };
    this.emit();
    return next.document;
  }

  clear(document: EditorDocument): void {
    this.state = { past: [], present: this.snapshot(document, "Reset history"), future: [] };
    this.emit();
  }

  subscribe(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private snapshot(document: EditorDocument, label: string): DocumentSnapshot {
    return {
      document: structuredClone(document),
      label,
      timestamp: Date.now(),
    };
  }

  private emit(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
