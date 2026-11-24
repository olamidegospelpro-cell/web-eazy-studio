import type { WebsiteNode } from "../../lib/project/types";

export type WebsiteBreakpoints = { desktop: number; tablet: number; mobile: number };
export const DEFAULT_WEBSITE_BREAKPOINTS: WebsiteBreakpoints = {
  desktop: 1120,
  tablet: 760,
  mobile: 390,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function canvasHeight(nodes: WebsiteNode[]) {
  return Math.max(900, ...nodes.map((node) => node.y + node.height + 100));
}

function exportNodeContent(node: WebsiteNode) {
  const text = escapeHtml(node.text);
  if (node.type === "image" && node.src) {
    return `<img src="${escapeHtml(node.src)}" alt="${escapeHtml(node.name)}" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }
  if (node.type === "shape" || node.type === "section" || node.type === "container") return "";
  if (node.type === "heading")
    return `<h1 style="margin:0;height:100%;white-space:pre-wrap;line-height:1.05">${text}</h1>`;
  if (node.type === "button")
    return `<a href="${escapeHtml(node.href || "#")}" style="height:100%;display:flex;align-items:center;justify-content:center;color:inherit;text-decoration:none">${text}</a>`;
  if (node.type === "card")
    return `<div style="height:100%;display:flex;align-items:flex-end">${text}</div>`;
  return `<p style="margin:0;height:100%;white-space:pre-wrap;line-height:1.5">${text}</p>`;
}

function nodeOverrides(
  node: WebsiteNode,
  index: number,
  parent: WebsiteNode | undefined,
  breakpoints: WebsiteBreakpoints,
) {
  return (["tablet", "mobile"] as const)
    .map((viewport) => {
      const nodeLayout = {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        ...node.responsive?.[viewport],
      };
      const parentLayout = parent
        ? {
            x: parent.x,
            y: parent.y,
            width: parent.width,
            height: parent.height,
            ...parent.responsive?.[viewport],
          }
        : { x: 0, y: 0, width: 0, height: 0 };
      const changes: Array<[string, number]> = [];
      if (
        node.responsive?.[viewport]?.x !== undefined ||
        parent?.responsive?.[viewport]?.x !== undefined
      ) {
        changes.push(["left", nodeLayout.x - parentLayout.x]);
      }
      if (
        node.responsive?.[viewport]?.y !== undefined ||
        parent?.responsive?.[viewport]?.y !== undefined
      ) {
        changes.push(["top", nodeLayout.y - parentLayout.y]);
      }
      if (node.responsive?.[viewport]?.width !== undefined)
        changes.push(["width", nodeLayout.width]);
      if (node.responsive?.[viewport]?.height !== undefined)
        changes.push(["height", nodeLayout.height]);
      if (!changes.length) return "";
      const declarations = changes.map(([key, value]) => `${key}:${value}px`).join(";");
      return `@media(max-width:${breakpoints[viewport]}px){.node-${index}{${declarations}}}`;
    })
    .join("");
}

export function buildGeneratedSiteExportHtml(
  businessName: string,
  nodes: WebsiteNode[],
  breakpoints: WebsiteBreakpoints = DEFAULT_WEBSITE_BREAKPOINTS,
) {
  const height = canvasHeight(nodes);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const visited = new Set<string>();
  const renderNode = (node: WebsiteNode, parent?: WebsiteNode): string => {
    if (visited.has(node.id)) return "";
    visited.add(node.id);
    const index = indexById.get(node.id) ?? 0;
    const parentX = parent?.x ?? 0;
    const parentY = parent?.y ?? 0;
    const overrides = nodeOverrides(node, index, parent, breakpoints);
    const padding = node.padding ?? (node.type === "card" ? 20 : 0);
    const css = `position:absolute;left:${node.x - parentX}px;top:${node.y - parentY}px;width:${node.width}px;height:${node.height}px;background:${node.background};color:${node.color};border:${node.border || "none"};border-radius:${node.radius}px;box-sizing:border-box;overflow:hidden;z-index:${index + 1};padding:${padding}px;text-align:${node.textAlign || "left"};font-size:${node.fontSize || (node.type === "heading" ? 48 : 14)}px;font-weight:${node.fontWeight || (node.type === "heading" ? 800 : 400)};line-height:${node.lineHeight || 1.45};${node.shadow ? "box-shadow:0 20px 50px rgba(0,0,0,.35);" : ""}${node.visible ? "" : "display:none;"}`;
    const tag = node.type === "section" ? "section" : "div";
    const children = node.childIds
      .map((childId) => {
        const child = nodesById.get(childId);
        return child ? renderNode(child, node) : "";
      })
      .join("");
    return `<${tag} class="node-${index}" style="${escapeHtml(css)}">${exportNodeContent(node)}${children}</${tag}>${overrides}`;
  };
  const body = nodes
    .filter((node) => node.parentId === null)
    .map((node) => renderNode(node))
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(businessName)}</title><style>*{box-sizing:border-box}body{margin:0;background:#080a0c;color:white}main{position:relative;width:100%;max-width:${breakpoints.desktop}px;min-height:${height}px;margin:0 auto;background:#0c1011}@media(max-width:${breakpoints.tablet}px){main{max-width:${breakpoints.tablet}px}}@media(max-width:${breakpoints.mobile}px){main{max-width:${breakpoints.mobile}px}}</style></head><body><main>${body}</main></body></html>`;
}
