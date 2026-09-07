import type { CSSProperties } from "react";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import type { DemoBlock } from "@/lib/hackathon/ai-prototype";

type Viewport = "desktop" | "tablet" | "mobile";

const DESIGN_WIDTH = 1120;
const viewportWidths: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };

function canvasHeight(blocks: DemoBlock[]) {
  return Math.max(900, ...blocks.map((block) => block.y + block.height + 100));
}

function blockStyle(block: DemoBlock): CSSProperties {
  return {
    position: "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    background: block.background,
    color: block.color,
    borderRadius: block.radius,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    boxSizing: "border-box",
  };
}

function blockClass(block: DemoBlock) {
  if (block.type === "heading") return "px-2 text-5xl font-black leading-none tracking-tight";
  if (block.type === "text") return "px-2 text-lg leading-relaxed";
  if (block.type === "button") return "justify-center px-5 text-sm font-semibold shadow-lg";
  if (block.type === "card") return "border border-black/10 px-6 text-xl font-bold shadow-sm";
  return "";
}

function renderBlock(block: DemoBlock) {
  if (block.type === "shape") return null;
  return <span className="w-full outline-none">{block.text}</span>;
}

function PreviewCanvas({ blocks, viewport }: { blocks: DemoBlock[]; viewport: Viewport }) {
  const targetWidth = viewportWidths[viewport];
  const scale = Math.min(1, targetWidth / DESIGN_WIDTH);
  const height = canvasHeight(blocks);

  return (
    <div className="min-w-full overflow-auto px-4 pb-12 pt-4 sm:px-6">
      <div
        className="mx-auto origin-top-left shadow-[0_30px_100px_rgba(0,0,0,.45)]"
        style={{
          width: DESIGN_WIDTH * scale,
          height: height * scale,
        }}
      >
        <div
          className="relative overflow-hidden bg-white"
          style={{ width: DESIGN_WIDTH, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className={`absolute ${blockClass(block)}`}
              style={{ ...blockStyle(block), zIndex: index + 10 }}
            >
              {renderBlock(block)}
            </div>
          ))}
        </div>
      </div>
    </div>
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
  if (!blocks.length) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-[#090b0c] text-sm text-white/40">
        Generate or add elements before previewing.
      </div>
    );
  }

  return (
    <div className="webeazy-preview-shell flex h-full min-h-0 flex-col bg-[#090b0c] text-white">
      <div className="sticky top-0 z-40 flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#101313]/95 px-3 shadow-lg backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onBack}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
            title="Return to design"
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold text-white">{businessName}</div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-white/30">Live website preview</div>
          </div>
        </div>
        <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 sm:flex">
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-300">
            {viewport === "desktop" ? <Monitor className="size-3" /> : viewport === "tablet" ? <Tablet className="size-3" /> : <Smartphone className="size-3" />}
            {viewport}
          </span>
          <span className="px-1.5 text-[9px] text-white/30">Layout preserved from canvas</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <PreviewCanvas blocks={blocks} viewport={viewport} />
      </div>
    </div>
  );
}

function esc(value: string) {
  return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
}

function blockHtml(block: DemoBlock, index: number) {
  const text = block.type === "shape" ? "" : esc(block.text);
  const classes = block.type === "heading"
    ? "font-size:56px;font-weight:900;line-height:.95;letter-spacing:-.04em;padding:0 8px;"
    : block.type === "text"
      ? "font-size:18px;line-height:1.65;padding:0 8px;"
      : block.type === "button"
        ? "display:flex;align-items:center;justify-content:center;padding:0 20px;font-size:14px;font-weight:700;box-shadow:0 14px 30px rgba(0,0,0,.16);"
        : block.type === "card"
          ? "display:flex;align-items:center;padding:0 24px;font-size:20px;font-weight:700;border:1px solid rgba(0,0,0,.10);box-shadow:0 8px 22px rgba(0,0,0,.06);"
          : "";
  return `<div style="position:absolute;left:${block.x}px;top:${block.y}px;width:${block.width}px;height:${block.height}px;background:${esc(block.background)};color:${esc(block.color)};border-radius:${block.radius}px;z-index:${index + 10};box-sizing:border-box;display:flex;align-items:center;overflow:hidden;${classes}">${text}</div>`;
}

export function buildGeneratedSiteExportHtml(name: string, blocks: DemoBlock[]) {
  const height = canvasHeight(blocks);
  const safeName = esc(name || "WebEazy site");
  const elements = blocks.map(blockHtml).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeName}</title>
<style>
:root{color-scheme:light}*{box-sizing:border-box}html,body{margin:0;padding:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#0b0d0d}body{overflow-x:auto}.webeazy-page{position:relative;width:${DESIGN_WIDTH}px;min-height:${height}px;margin:0 auto;background:#fff;overflow:hidden}.webeazy-watermark{position:fixed;right:18px;bottom:14px;font-size:10px;color:rgba(0,0,0,.28);font-weight:700;letter-spacing:.12em;text-transform:uppercase}@media(max-width:${DESIGN_WIDTH}px){.webeazy-page{margin:0;transform-origin:top left;transform:scale(calc(100vw / ${DESIGN_WIDTH}));margin-bottom:calc(-${height}px + (${height}px * (100vw / ${DESIGN_WIDTH})));}.webeazy-watermark{display:none}}
</style>
</head>
<body><main class="webeazy-page">${elements}</main><div class="webeazy-watermark">Designed with WebEazy</div></body></html>`;
}
