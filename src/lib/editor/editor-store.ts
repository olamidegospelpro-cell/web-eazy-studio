import { useSyncExternalStore } from "react";
import { HistoryManager } from "./history-manager";
import { createStarterDocument } from "./document-factory";
import type { EditorDocument, EditorSelection, EditorViewport, NodeId } from "./document-types";

export interface EditorState {
  document: EditorDocument;
  selection: EditorSelection;
  viewport: EditorViewport;
  dirty: boolean;
  history: { canUndo: boolean; canRedo: boolean };
}

class EditorStore {
  private document = createStarterDocument();
  private selection: EditorSelection = { nodeIds: [], primaryNodeId: null };
  private viewport: EditorViewport = { breakpoint: "desktop", zoom: 1, scrollX: 0, scrollY: 0 };
  private dirty = false;
  private historyManager = new HistoryManager(this.document);
  private listeners = new Set<() => void>();

  getSnapshot = (): EditorState => ({
    document: this.document,
    selection: this.selection,
    viewport: this.viewport,
    dirty: this.dirty,
    history: {
      canUndo: this.historyManager.canUndo(),
      canRedo: this.historyManager.canRedo(),
    },
  });

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  select(nodeIds: NodeId[], primaryNodeId: NodeId | null = nodeIds[0] ?? null) {
    this.selection = { nodeIds: [...new Set(nodeIds)], primaryNodeId };
    this.emit();
  }

  setViewport(patch: Partial<EditorViewport>) {
    this.viewport = { ...this.viewport, ...patch };
    this.emit();
  }

  commit(document: EditorDocument, label: string) {
    this.document = { ...document, updatedAt: new Date().toISOString() };
    this.historyManager.commit(this.document, label);
    this.dirty = true;
    this.emit();
  }

  toggleLock(nodeId: NodeId) {
    const node = this.document.nodes[nodeId];
    if (!node || node.type === "root") return;
    this.commit(
      {
        ...this.document,
        nodes: { ...this.document.nodes, [nodeId]: { ...node, locked: !node.locked } },
      },
      node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`,
    );
  }

  updateNode(
    nodeId: NodeId,
    patch: Partial<Pick<import("./document-types").EditorNode, "props" | "styles" | "name">>,
  ) {
    const node = this.document.nodes[nodeId];
    if (!node) return;
    this.commit(
      { ...this.document, nodes: { ...this.document.nodes, [nodeId]: { ...node, ...patch } } },
      `Update ${node.name}`,
    );
  }

  undo() {
    const document = this.historyManager.undo();
    if (!document) return;
    this.document = document;
    this.dirty = true;
    this.emit();
  }

  redo() {
    const document = this.historyManager.redo();
    if (!document) return;
    this.document = document;
    this.dirty = true;
    this.emit();
  }

  markSaved() {
    this.dirty = false;
    this.emit();
  }

  replaceDocument(document: EditorDocument) {
    this.document = document;
    this.selection = { nodeIds: [], primaryNodeId: null };
    this.historyManager = new HistoryManager(document);
    this.dirty = false;
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const editorStore = new EditorStore();

export function useEditorStore(): EditorState {
  return useSyncExternalStore(
    editorStore.subscribe,
    editorStore.getSnapshot,
    editorStore.getSnapshot,
  );
}
