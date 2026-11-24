import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import type { DemoBlock } from "@/lib/hackathon/ai-prototype";

type Viewport = "desktop" | "tablet" | "mobile";
const viewportWidths: Record<Viewport, number> = { desktop: 1280, tablet: 768, mobile: 375 };

function canvasHeight(blocks: DemoBlock[]) {
  return Math.max(900, ...blocks.map((block) => block.y + block.height + 100));
}

function blockStyle(block: DemoBlock, blocks: DemoBlock[]): CSSProperties {
  const parent = block.parentId ? blocks.find((item) => item.id === block.parentId) : undefined;
  const isAutoLayoutChild = parent?.type === "section" || parent?.type === "container";
  return {
    position: isAutoLayoutChild ? "relative" : "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    background: block.shapeKind === "custom" ? "transparent" : block.background,
    color: block.color,
    borderRadius: block.shapeKind === "circle" ? "50%" : block.radius,
    border: block.stroke ? `1px solid ${block.stroke}` : undefined,
    fontSize: block.fontSize,
    fontWeight: block.fontWeight,
    fontFamily: block.fontFamily,
    display: block.type === "section" || block.type === "container" ? "flex" : undefined,
    flexDirection:
      block.type === "section" || block.type === "container"
        ? (block.layoutDirection ?? "column")
        : undefined,
    gap: block.gap,
    zIndex: 1,
    overflow: "hidden",
    boxSizing: "border-box",
  };
}

function blockContent(block: DemoBlock): ReactNode {
  if (block.type === "image" && block.src)
    return <img src={block.src} alt={block.name} className="h-full w-full object-cover" />;
  if (block.type === "shape" && block.shapeKind === "custom" && block.svgPath)
    return (
      <svg viewBox="0 0 400 240" className="h-full w-full overflow-visible">
        <path
          d={block.svgPath}
          fill="none"
          stroke={block.stroke ?? block.color}
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  if (block.type === "heading")
    return (
      <h1 className="h-full overflow-hidden whitespace-pre-wrap break-words text-[48px] font-bold leading-[1.05]">
        {block.text}
      </h1>
    );
  if (block.type === "button")
    return (
      <a
        href={safeHref(block.href)}
        className="flex h-full items-center justify-center gap-2 px-5 text-sm font-semibold"
      >
        {block.text}
      </a>
    );
  if (block.type === "card")
    return (
      <div className="flex h-full flex-col justify-end p-5 text-base font-semibold">
        {block.text}
      </div>
    );
  if (block.type === "section" || block.type === "container" || block.type === "shape") return null;
  return (
    <p className="h-full overflow-hidden whitespace-pre-wrap break-words text-base leading-6">
      {block.text}
    </p>
  );
}

export function GeneratedSitePreview({
  blocks,
  businessName,
  viewport,
  onBack,
}: {
  blocks: DemoBlock[];
  businessName: string;
  viewport: Viewport;
  onBack: () => void;
}) {
  const width = viewportWidths[viewport];
  const height = canvasHeight(blocks);
  const DeviceIcon = viewport === "desktop" ? Monitor : viewport === "tablet" ? Tablet : Smartphone;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101114] text-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#18191d] px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-md p-1.5 text-white/55 hover:bg-white/5 hover:text-white"
            aria-label="Return to editor"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="text-xs font-semibold">Preview</div>
            <div className="text-[10px] text-white/35">{businessName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] capitalize text-white/45">
          <DeviceIcon className="size-3.5" />
          {viewport}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-8">
        <main
          className="relative mx-auto overflow-hidden bg-white text-black shadow-[0_24px_72px_rgba(0,0,0,.4)]"
          style={{ width, minHeight: height }}
        >
          {blocks
            .filter(
              (block) =>
                !block.parentId || !blocks.some((candidate) => candidate.id === block.parentId),
            )
            .map((block) => (
              <PreviewBlock key={block.id} block={block} blocks={blocks} />
            ))}
        </main>
      </div>
    </div>
  );
}

function PreviewBlock({ block, blocks }: { block: DemoBlock; blocks: DemoBlock[] }) {
  return (
    <div id={block.id} data-webeazy-id={block.id} style={blockStyle(block, blocks)}>
      {blockContent(block)}
      {blocks
        .filter((child) => child.parentId === block.id)
        .map((child) => (
          <PreviewBlock key={child.id} block={child} blocks={blocks} />
        ))}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(value?: string) {
  return value && /^(https?:|mailto:|tel:|#)/i.test(value) ? value : "#";
}

function elementTag(block: DemoBlock) {
  if (block.type === "section") return "section";
  if (block.type === "heading") return "h1";
  if (block.type === "text") return "p";
  if (block.type === "button") return "a";
  if (block.type === "image") return "figure";
  return "div";
}

function elementContent(block: DemoBlock) {
  const text = escapeHtml(block.text);
  if (block.type === "image" && block.src)
    return `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.name)}">`;
  if (block.type === "button") return text;
  if (block.type === "shape" && block.shapeKind === "custom" && block.svgPath)
    return `<svg viewBox="0 0 400 240" aria-hidden="true"><path d="${escapeHtml(block.svgPath)}" fill="none" stroke="${safeCssColor(block.stroke ?? block.color, "#111827")}" stroke-width="4" vector-effect="non-scaling-stroke"></path></svg>`;
  if (block.type === "shape" || block.type === "section" || block.type === "container") return "";
  return text;
}

export function buildGeneratedSiteExportCss(blocks: DemoBlock[]) {
  const rules = blocks.map((block) => {
    const parent = block.parentId ? blocks.find((item) => item.id === block.parentId) : undefined;
    const isAutoLayoutChild = parent?.type === "section" || parent?.type === "container";
    const tagRules =
      block.type === "heading" || block.type === "text"
        ? `font-family:${safeCssFont(block.fontFamily)};font-size:${finite(block.fontSize, block.type === "heading" ? 48 : 16)}px;font-weight:${finite(block.fontWeight, block.type === "heading" ? 700 : 400)};line-height:${block.type === "heading" ? 1.05 : 1.5};white-space:pre-wrap;`
        : block.type === "card"
          ? `display:flex;align-items:flex-end;padding:20px;font-family:${safeCssFont(block.fontFamily)};font-size:${finite(block.fontSize, 16)}px;font-weight:${finite(block.fontWeight, 600)};white-space:pre-wrap;`
          : block.type === "button"
            ? `display:flex;align-items:center;justify-content:center;font-family:${safeCssFont(block.fontFamily)};font-size:${finite(block.fontSize, 14)}px;font-weight:${finite(block.fontWeight, 600)};text-decoration:none;`
            : block.type === "image"
              ? "padding:0;"
              : block.type === "section" || block.type === "container"
                ? `display:flex;flex-direction:${block.layoutDirection === "row" ? "row" : "column"};gap:${finite(block.gap, 0)}px;`
                : "";
    const radius = block.shapeKind === "circle" ? "50%" : `${finite(block.radius, 0)}px`;
    const background =
      block.shapeKind === "custom" ? "transparent" : safeCssColor(block.background, "transparent");
    const stroke = block.stroke ? `1px solid ${safeCssColor(block.stroke, "#000000")}` : "0";
    return `[data-webeazy-id="${cssString(block.id)}"]{position:${isAutoLayoutChild ? "relative" : "absolute"};left:${finite(block.x, 0)}px;top:${finite(block.y, 0)}px;width:${finite(block.width, 0)}px;height:${finite(block.height, 0)}px;background:${background};color:${safeCssColor(block.color, "#111827")};border:${stroke};border-radius:${radius};box-sizing:border-box;overflow:hidden;${tagRules}}`;
  });
  return `*{box-sizing:border-box}body{margin:0;background:#f4f4f5;font-family:system-ui,sans-serif}main{position:relative;width:1280px;min-height:${canvasHeight(blocks)}px;margin:0 auto;background:#fff;color:#111}h1,p{margin:0}img,svg{display:block;width:100%;height:100%;object-fit:cover}figure{margin:0}${rules.join("")}`;
}

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function cssString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]/g, "");
}

function safeCssColor(value: string, fallback: string) {
  return /^(#[\da-f]{3,8}|[a-z]{1,24}|rgba?\([\d.%\s,]+\)|hsla?\([\d.%\s,a-z-]+\))$/i.test(value)
    ? value
    : fallback;
}

function safeCssFont(value = "system-ui") {
  return /^[\w\s,"'-]+$/.test(value) ? value : "system-ui,sans-serif";
}

export function buildGeneratedSiteExportHtml(businessName: string, blocks: DemoBlock[]) {
  const renderBlock = (block: DemoBlock): string => {
    const tag = elementTag(block);
    const href = block.type === "button" ? ` href="${escapeHtml(safeHref(block.href))}"` : "";
    const content =
      elementContent(block) +
      blocks
        .filter((child) => child.parentId === block.id)
        .map(renderBlock)
        .join("");
    return `<${tag} id="${escapeHtml(block.id)}" data-webeazy-id="${escapeHtml(block.id)}" data-element-type="${block.type}"${href}>${content}</${tag}>`;
  };
  const ids = new Set(blocks.map((block) => block.id));
  const body = blocks
    .filter((block) => !block.parentId || !ids.has(block.parentId))
    .map(renderBlock)
    .join("\n");
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(businessName)}</title><link rel="stylesheet" href="${escapeHtml(businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "webeazy-site")}.css"></head><body><main>${body}</main></body></html>`;
}
