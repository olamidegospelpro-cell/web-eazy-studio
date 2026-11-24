import type { CSSProperties } from "react";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import type { WebsiteNode } from "@/lib/project/types";
import { DEFAULT_WEBSITE_BREAKPOINTS, type WebsiteBreakpoints } from "./site-export";

type Viewport = "desktop" | "tablet" | "mobile";

function nodeLayout(node: WebsiteNode, viewport: Viewport) {
  return { ...node, ...(viewport === "desktop" ? {} : node.responsive?.[viewport]) };
}

function canvasHeight(nodes: WebsiteNode[]) {
  return Math.max(900, ...nodes.map((node) => node.y + node.height + 100));
}

function nodeStyle(
  node: WebsiteNode,
  index: number,
  viewport: Viewport,
  parent?: WebsiteNode,
): CSSProperties {
  const layout = nodeLayout(node, viewport);
  const parentLayout = parent ? nodeLayout(parent, viewport) : null;
  return {
    position: "absolute",
    left: layout.x - (parentLayout?.x ?? 0),
    top: layout.y - (parentLayout?.y ?? 0),
    width: layout.width,
    height: layout.height,
    background: node.background,
    color: node.color,
    borderRadius: node.radius,
    border: node.border,
    zIndex: index + 1,
    overflow: "hidden",
    boxSizing: "border-box",
    padding: node.padding ?? (node.type === "card" ? 20 : 0),
    textAlign: node.textAlign || "left",
    fontSize: node.fontSize || (node.type === "heading" ? 48 : 14),
    fontWeight: node.fontWeight || (node.type === "heading" ? 800 : 400),
    lineHeight: node.lineHeight || 1.45,
    boxShadow: node.shadow ? "0 20px 50px rgba(0,0,0,.35)" : undefined,
    display: node.visible ? undefined : "none",
  };
}

function nodeContent(node: WebsiteNode) {
  if (node.type === "image" && node.src) {
    return <img src={node.src} alt={node.name} className="h-full w-full object-cover" />;
  }
  if (node.type === "shape" || node.type === "section" || node.type === "container") return null;
  if (node.type === "heading")
    return (
      <h1 className="m-0 h-full overflow-hidden whitespace-pre-wrap break-words">{node.text}</h1>
    );
  if (node.type === "button")
    return (
      <a
        href={node.href || "#"}
        className="flex h-full items-center justify-center text-inherit no-underline"
      >
        {node.text}
      </a>
    );
  if (node.type === "card")
    return <div className="flex h-full flex-col justify-end font-semibold">{node.text}</div>;
  return <p className="m-0 h-full overflow-hidden whitespace-pre-wrap break-words">{node.text}</p>;
}

function renderNode(
  node: WebsiteNode,
  nodesById: Map<string, WebsiteNode>,
  indexById: Map<string, number>,
  viewport: Viewport,
  parent?: WebsiteNode,
  visited = new Set<string>(),
) {
  if (visited.has(node.id)) return null;
  visited.add(node.id);
  const Element = node.type === "section" ? "section" : "div";
  return (
    <Element key={node.id} style={nodeStyle(node, indexById.get(node.id) ?? 0, viewport, parent)}>
      {nodeContent(node)}
      {node.childIds.map((childId) => {
        const child = nodesById.get(childId);
        return child ? renderNode(child, nodesById, indexById, viewport, node, visited) : null;
      })}
    </Element>
  );
}

export function GeneratedSitePreview({
  blocks,
  businessName,
  viewport,
  breakpoints = DEFAULT_WEBSITE_BREAKPOINTS,
  onBack,
}: {
  blocks: WebsiteNode[];
  businessName: string;
  viewport: Viewport;
  breakpoints?: WebsiteBreakpoints;
  onBack: () => void;
}) {
  const width = breakpoints[viewport];
  const height = canvasHeight(blocks);
  const nodesById = new Map(blocks.map((node) => [node.id, node]));
  const indexById = new Map(blocks.map((node, index) => [node.id, index]));
  const visited = new Set<string>();
  return (
    <div className="webeazy-preview-shell flex h-full min-h-0 flex-col bg-[#080a0c] text-white">
      <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0f1217]/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-2 text-white/55 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="text-xs font-semibold">WebEazy Preview</div>
            <div className="text-[10px] text-white/35">{businessName} · Saved page</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/45">
          {viewport === "desktop" ? (
            <Monitor className="size-3.5" />
          ) : viewport === "tablet" ? (
            <Tablet className="size-3.5" />
          ) : (
            <Smartphone className="size-3.5" />
          )}
          {viewport}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto min-w-max p-8">
          <main
            className="relative overflow-hidden bg-[#0c1011] text-white shadow-[0_30px_100px_rgba(0,0,0,.55)]"
            style={{ width, height }}
          >
            {blocks
              .filter((node) => node.parentId === null)
              .map((node) => renderNode(node, nodesById, indexById, viewport, undefined, visited))}
          </main>
        </div>
      </div>
    </div>
  );
}
