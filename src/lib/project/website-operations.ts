import type { WebsiteNode } from "./types";

export function insertWebsiteNode(
  nodes: WebsiteNode[],
  node: WebsiteNode,
  parentId: string | null = node.parentId,
): WebsiteNode[] {
  if (nodes.some((current) => current.id === node.id)) {
    throw new Error(`A node with id "${node.id}" already exists.`);
  }
  if (parentId) {
    const parent = nodes.find((current) => current.id === parentId);
    if (!parent || (parent.type !== "section" && parent.type !== "container")) {
      throw new Error("New nodes can only be inserted into a section or container.");
    }
    if (node.childIds.includes(parentId)) {
      throw new Error("The new node cannot contain its parent.");
    }
  }

  const inserted = { ...node, parentId };
  return [
    ...nodes.map((current) =>
      current.id === parentId ? { ...current, childIds: [...current.childIds, node.id] } : current,
    ),
    inserted,
  ];
}

export function removeWebsiteNodeTree(nodes: WebsiteNode[], nodeId: string): WebsiteNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const removed = new Set<string>();
  const collect = (id: string) => {
    if (removed.has(id)) return;
    removed.add(id);
    byId.get(id)?.childIds.forEach(collect);
  };
  collect(nodeId);
  const root = byId.get(nodeId);
  return nodes
    .filter((node) => !removed.has(node.id))
    .map((node) =>
      node.id === root?.parentId
        ? { ...node, childIds: node.childIds.filter((id) => !removed.has(id)) }
        : node,
    );
}

export function reorderWebsiteSibling(
  nodes: WebsiteNode[],
  nodeId: string,
  direction: -1 | 1,
): WebsiteNode[] {
  const node = nodes.find((current) => current.id === nodeId);
  if (!node) return nodes;
  const siblings = node.parentId
    ? nodes.find((current) => current.id === node.parentId)?.childIds
    : nodes.filter((current) => current.parentId === null).map((current) => current.id);
  if (!siblings) return nodes;

  const index = siblings.indexOf(nodeId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= siblings.length) return nodes;
  const reordered = [...siblings];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  if (!node.parentId) {
    const rank = new Map(reordered.map((id, order) => [id, order]));
    const roots = nodes
      .filter((current) => current.parentId === null)
      .sort((left, right) => rank.get(left.id)! - rank.get(right.id)!);
    let rootIndex = 0;
    return nodes.map((current) => (current.parentId === null ? roots[rootIndex++] : current));
  }
  return nodes.map((current) =>
    current.id === node.parentId ? { ...current, childIds: reordered } : current,
  );
}
