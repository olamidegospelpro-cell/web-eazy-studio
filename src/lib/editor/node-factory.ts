import type { EditorNode, EditorNodeType, NodeId } from "./document-types";

export function createNodeId(prefix = "node"): NodeId {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}_${cryptoApi.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreateNodeOptions {
  id?: NodeId;
  name?: string;
  parentId?: NodeId | null;
  props?: Record<string, unknown>;
  styles?: Record<string, unknown>;
}

export function createEditorNode(
  type: EditorNodeType,
  options: CreateNodeOptions = {},
): EditorNode {
  return {
    id: options.id ?? createNodeId(),
    type,
    name: options.name ?? defaultNodeName(type),
    parentId: options.parentId ?? null,
    childIds: [],
    props: options.props ?? defaultProps(type),
    styles: options.styles ?? {},
  };
}

export function defaultNodeName(type: EditorNodeType): string {
  const names: Record<EditorNodeType, string> = {
    root: "Page",
    section: "Section",
    container: "Container",
    grid: "Grid",
    columns: "Columns",
    text: "Text",
    heading: "Heading",
    image: "Image",
    video: "Video",
    button: "Button",
    icon: "Icon",
    spacer: "Spacer",
    divider: "Divider",
    form: "Form",
    custom: "Custom",
  };
  return names[type];
}

function defaultProps(type: EditorNodeType): Record<string, unknown> {
  switch (type) {
    case "heading":
      return { text: "Heading", level: 2 };
    case "text":
      return { text: "Start writing..." };
    case "button":
      return { text: "Button", href: "#" };
    case "image":
      return { src: "", alt: "" };
    case "video":
      return { src: "" };
    default:
      return {};
  }
}

export function appendChild(
  nodes: Record<NodeId, EditorNode>,
  parentId: NodeId,
  childId: NodeId,
): Record<NodeId, EditorNode> {
  const parent = nodes[parentId];
  if (!parent || parent.childIds.includes(childId)) return nodes;
  return {
    ...nodes,
    [parentId]: { ...parent, childIds: [...parent.childIds, childId] },
  };
}

export function detachChild(
  nodes: Record<NodeId, EditorNode>,
  parentId: NodeId,
  childId: NodeId,
): Record<NodeId, EditorNode> {
  const parent = nodes[parentId];
  if (!parent) return nodes;
  return {
    ...nodes,
    [parentId]: {
      ...parent,
      childIds: parent.childIds.filter((id) => id !== childId),
    },
  };
}

export function collectDescendants(
  nodes: Record<NodeId, EditorNode>,
  nodeId: NodeId,
): NodeId[] {
  const node = nodes[nodeId];
  if (!node) return [];
  return node.childIds.flatMap((childId) => [childId, ...collectDescendants(nodes, childId)]);
}
