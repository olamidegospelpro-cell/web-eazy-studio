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

function exportNodeContent(node: WebsiteNode, assetSources: Record<string, string>) {
  const text = escapeHtml(node.text);
  const imageSrc = node.assetId ? assetSources[node.assetId] : node.src;
  if (node.type === "image" && imageSrc) {
    return `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(node.alt ?? node.name)}" style="width:100%;height:100%;object-fit:${node.imageFit ?? "cover"};display:block">`;
  }
  if (node.type === "shape" || node.type === "section" || node.type === "container") return "";
  if (node.type === "heading")
    return `<h1 style="margin:0;height:100%;white-space:pre-wrap;line-height:${node.lineHeight ?? 1.05}">${text}</h1>`;
  if (node.type === "button")
    return `<a href="${escapeHtml(node.href || "#")}" style="height:100%;display:flex;align-items:center;justify-content:center;color:inherit;text-decoration:none">${text}</a>`;
  if (node.type === "card")
    return `<div style="height:100%;display:flex;align-items:flex-end">${text}</div>`;
  return `<p style="margin:0;height:100%;white-space:pre-wrap;line-height:${node.lineHeight ?? 1.5}">${text}</p>`;
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
  assetSources: Record<string, string> = {},
) {
  const height = canvasHeight(nodes);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const visited = new Set<string>();
  const responsiveRules: string[] = [];
  const renderNode = (node: WebsiteNode, parent?: WebsiteNode): string => {
    if (visited.has(node.id)) return "";
    visited.add(node.id);
    const index = indexById.get(node.id) ?? 0;
    const parentX = parent?.x ?? 0;
    const parentY = parent?.y ?? 0;
    responsiveRules.push(nodeOverrides(node, index, parent, breakpoints));
    const isContainer = node.type === "section" || node.type === "container";
    const flowChild = parent?.layoutMode === "flow";
    const padding = node.padding ?? (node.type === "card" ? 20 : 0);
    const declarations = [
      `position:${flowChild ? "relative" : "absolute"}`,
      `left:${node.x - parentX}px`,
      `top:${node.y - parentY}px`,
      `width:${node.width}px`,
      `height:${node.height}px`,
      `background:${node.shapeKind === "line" ? node.borderColor || node.color : node.background}`,
      `color:${node.color}`,
      `border:${node.borderWidth ? `${node.borderWidth}px solid ${node.borderColor || node.color}` : node.border || "none"}`,
      `border-radius:${node.shapeKind === "ellipse" ? "50%" : `${node.radius}px`}`,
      "box-sizing:border-box",
      "overflow:hidden",
      `z-index:${index + 1}`,
      `padding:${padding}px`,
      `text-align:${node.textAlign || "left"}`,
      `font-size:${node.fontSize || (node.type === "heading" ? 48 : 14)}px`,
      `font-family:${node.fontFamily ? `"${node.fontFamily.replace(/["\\]/g, "")}",sans-serif` : "inherit"}`,
      `font-weight:${node.fontWeight || (node.type === "heading" ? 800 : 400)}`,
      `line-height:${node.lineHeight || 1.45}`,
      `opacity:${node.opacity ?? 1}`,
      `display:${node.visible ? (isContainer ? "flex" : "block") : "none"}`,
      ...(isContainer
        ? [
            `flex-direction:${node.flowDirection || "column"}`,
            `align-items:${node.flowDirection === "row" ? "center" : "flex-start"}`,
            `gap:${node.gap ?? 0}px`,
          ]
        : []),
      ...(node.shadow ? ["box-shadow:0 20px 50px rgba(0,0,0,.2)"] : []),
    ];
    const tag = node.type === "section" ? "section" : "div";
    const children = node.childIds
      .map((childId) => {
        const child = nodesById.get(childId);
        return child ? renderNode(child, node) : "";
      })
      .join("");
    return `<${tag} class="node-${index}" style="${escapeHtml(declarations.join(";"))}">${exportNodeContent(node, assetSources)}${children}</${tag}>`;
  };
  const body = nodes
    .filter((node) => node.parentId === null)
    .map((node) => renderNode(node))
    .join("");
  const rules = responsiveRules.filter(Boolean).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(businessName)}</title><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#111827;font-family:Arial,sans-serif}main{position:relative;width:100%;max-width:${breakpoints.desktop}px;min-height:${height}px;margin:0 auto;background:#fff;overflow:hidden}@media(max-width:${breakpoints.desktop}px){main{width:100%}}${rules}</style></head><body><main>${body}</main></body></html>`;
}
