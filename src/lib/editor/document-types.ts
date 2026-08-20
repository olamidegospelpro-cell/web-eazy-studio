export const DOCUMENT_SCHEMA_VERSION = 1 as const;

export type NodeId = string;
export type PageId = string;

export type EditorNodeType =
  | "root"
  | "section"
  | "container"
  | "grid"
  | "columns"
  | "text"
  | "heading"
  | "image"
  | "video"
  | "button"
  | "icon"
  | "spacer"
  | "divider"
  | "form"
  | "custom";

export type ResponsiveValue<T> = {
  desktop?: T;
  tablet?: T;
  mobile?: T;
};

export interface EditorNode {
  id: NodeId;
  type: EditorNodeType;
  name: string;
  parentId: NodeId | null;
  childIds: NodeId[];
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  responsive?: Record<string, ResponsiveValue<unknown>>;
  locked?: boolean;
  hidden?: ResponsiveValue<boolean>;
  metadata?: Record<string, unknown>;
}

export interface EditorPage {
  id: PageId;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  rootNodeId: NodeId;
  nodeIds: NodeId[];
  isHome?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EditorDocument {
  schemaVersion: typeof DOCUMENT_SCHEMA_VERSION;
  pageId: PageId;
  nodes: Record<NodeId, EditorNode>;
  rootNodeId: NodeId;
  selectedNodeIds: NodeId[];
  updatedAt: string;
}

export interface DocumentSnapshot {
  document: EditorDocument;
  label: string;
  timestamp: number;
}

export interface EditorBreakpoint {
  id: "desktop" | "tablet" | "mobile";
  label: string;
  minWidth: number;
  maxWidth?: number;
}

export const EDITOR_BREAKPOINTS: readonly EditorBreakpoint[] = [
  { id: "desktop", label: "Desktop", minWidth: 1024 },
  { id: "tablet", label: "Tablet", minWidth: 768, maxWidth: 1023 },
  { id: "mobile", label: "Mobile", minWidth: 0, maxWidth: 767 },
];

export interface EditorSelection {
  nodeIds: NodeId[];
  primaryNodeId: NodeId | null;
}

export interface EditorViewport {
  breakpoint: EditorBreakpoint["id"];
  zoom: number;
  scrollX: number;
  scrollY: number;
}
