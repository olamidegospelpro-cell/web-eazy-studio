import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  ArrowLeft,
  Bot,
  Code2,
  Eye,
  GripVertical,
  Lock,
  LockOpen,
  Monitor,
  MousePointer2,
  Play,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWithAiPrototype, refineBlockLocally, type DemoBlock } from "@/lib/hackathon/ai-prototype";

type Viewport = "desktop" | "tablet" | "mobile";

const widths: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const samplePrompt =
  "Create a modern website for a Nigerian solar and electrical company called Vicky Tech Innovations. Use green and charcoal. Include a strong hero, services, trust-building copy and a clear contact CTA.";

export function HackathonStudio({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState(samplePrompt);
  const [blocks, setBlocks] = useState<DemoBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refine, setRefine] = useState("Make this more premium and modern");
  const [primary, setPrimary] = useState("#22c55e");
  const [businessName, setBusinessName] = useState("WebEazy Demo");
  const [engineMode, setEngineMode] = useState<"remote" | "local-prototype" | null>(null);

  const selected = useMemo(() => blocks.find((block) => block.id === selectedId) ?? null, [blocks, selectedId]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const result = await generateWithAiPrototype(prompt.trim());
      setBlocks(result.blocks);
      setBusinessName(result.businessName);
      setPrimary(result.primary);
      setEngineMode(result.mode);
      setSelectedId(result.blocks.find((block) => block.type === "heading")?.id ?? result.blocks[0]?.id ?? null);
    } finally {
      setGenerating(false);
    }
  };

  const updateBlock = (id: string, patch: Partial<DemoBlock>) => {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  };

  const refineSelected = () => {
    if (!selected || !refine.trim()) return;
    updateBlock(selected.id, refineBlockLocally(selected, refine, primary));
  };

  const exportHtml = () => {
    const html = buildExportHtml(businessName, blocks);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "webeazy-site"}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0d12] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#10131a] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500 font-bold">W.</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">WebEazy AI Studio</span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Hackathon MVP
              </span>
            </div>
            <p className="truncate text-[10px] text-white/45">AI handles the complexity. You keep the creativity.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 md:flex">
            <ViewportButton active={viewport === "desktop"} label="Desktop" onClick={() => setViewport("desktop")} icon={<Monitor className="size-3.5" />} />
            <ViewportButton active={viewport === "tablet"} label="Tablet" onClick={() => setViewport("tablet")} icon={<Tablet className="size-3.5" />} />
            <ViewportButton active={viewport === "mobile"} label="Mobile" onClick={() => setViewport("mobile")} icon={<Smartphone className="size-3.5" />} />
          </div>
          <Button variant="outline" size="sm" onClick={() => setPreview((value) => !value)} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Eye className="mr-1.5 size-3.5" /> {preview ? "Design" : "Preview"}
          </Button>
          <Button size="sm" onClick={exportHtml} disabled={!blocks.length} className="bg-white text-black hover:bg-white/90">
            <Code2 className="mr-1.5 size-3.5" /> Export HTML
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!preview && (
          <aside className="hidden w-[310px] shrink-0 flex-col border-r border-white/10 bg-[#10131a] lg:flex">
            <div className="border-b border-white/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                  <Bot className="size-4 text-violet-300" /> Ask WebEazy
                </div>
                {engineMode && (
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase text-white/40">
                    {engineMode === "remote" ? "AI endpoint" : "prototype engine"}
                  </span>
                )}
              </div>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-36 resize-none border-white/10 bg-black/20 text-xs text-white placeholder:text-white/25"
                placeholder="Describe the business, style, sections and goals..."
              />
              <Button className="mt-3 w-full bg-violet-500 text-white hover:bg-violet-400" onClick={() => void generate()} disabled={generating || !prompt.trim()}>
                {generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <WandSparkles className="mr-2 size-4" />}
                {generating ? "Generating..." : blocks.length ? "Regenerate website" : "Generate website"}
              </Button>
              <p className="mt-2 text-[10px] leading-relaxed text-white/35">
                The demo works without paid credits. Add <code>VITE_WEBEAZY_AI_ENDPOINT</code> later to swap the prototype engine for a live AI provider.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3">
              <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                <GripVertical className="size-3.5" /> Layers
              </div>
              {blocks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/35">Generate a website to create editable layers.</div>
              ) : (
                <div className="space-y-1">
                  {blocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedId(block.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${selectedId === block.id ? "bg-violet-500/20 text-violet-100" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
                    >
                      <MousePointer2 className="size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{block.name}</span>
                      {block.locked && <Lock className="size-3 text-white/35" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1 overflow-auto bg-[#090b10] p-5 md:p-8">
          <div className="mx-auto transition-all duration-300" style={{ width: `${Math.min(widths[viewport], typeof window !== "undefined" ? Math.max(320, window.innerWidth - (preview ? 80 : 680)) : widths[viewport])}px`, maxWidth: "100%" }}>
            {preview ? (
              <PreviewWebsite blocks={blocks} businessName={businessName} />
            ) : (
              <DesignCanvas blocks={blocks} selectedId={selectedId} onSelect={setSelectedId} onUpdate={updateBlock} onGenerate={() => void generate()} generating={generating} />
            )}
          </div>
        </main>

        {!preview && (
          <aside className="hidden w-[280px] shrink-0 flex-col border-l border-white/10 bg-[#10131a] xl:flex">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Properties</div>
            </div>
            {selected ? (
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-xs font-semibold">{selected.name}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-white/35">{selected.type}</div>
                </div>

                {selected.type !== "shape" && (
                  <InspectorField label="Text" value={selected.text} onChange={(text) => updateBlock(selected.id, { text })} multiline />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <InspectorField label="X" value={String(selected.x)} onChange={(value) => updateBlock(selected.id, { x: numberOr(value, selected.x) })} />
                  <InspectorField label="Y" value={String(selected.y)} onChange={(value) => updateBlock(selected.id, { y: numberOr(value, selected.y) })} />
                  <InspectorField label="Width" value={String(selected.width)} onChange={(value) => updateBlock(selected.id, { width: Math.max(50, numberOr(value, selected.width)) })} />
                  <InspectorField label="Height" value={String(selected.height)} onChange={(value) => updateBlock(selected.id, { height: Math.max(30, numberOr(value, selected.height)) })} />
                </div>
                <InspectorField label="Background" value={selected.background} onChange={(background) => updateBlock(selected.id, { background })} />
                <InspectorField label="Text colour" value={selected.color} onChange={(color) => updateBlock(selected.id, { color })} />
                <InspectorField label="Radius" value={String(selected.radius)} onChange={(value) => updateBlock(selected.id, { radius: Math.max(0, numberOr(value, selected.radius)) })} />

                <Button
                  variant="outline"
                  className="mb-5 w-full border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"
                  onClick={() => updateBlock(selected.id, { locked: !selected.locked })}
                >
                  {selected.locked ? <LockOpen className="mr-2 size-4" /> : <Lock className="mr-2 size-4" />}
                  {selected.locked ? "Unlock element" : "Lock element"}
                </Button>

                <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-100">
                    <Sparkles className="size-4" /> AI refine selection
                  </div>
                  <Textarea value={refine} onChange={(event) => setRefine(event.target.value)} className="min-h-20 resize-none border-white/10 bg-black/20 text-xs text-white" />
                  <Button size="sm" className="mt-2 w-full bg-violet-500 text-white hover:bg-violet-400" onClick={refineSelected}>
                    <Send className="mr-2 size-3.5" /> Apply instruction
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 text-xs leading-relaxed text-white/35">Select an element on the canvas to edit its position, size, content and appearance.</div>
            )}
          </aside>
        )}
      </div>

      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-white/10 bg-[#10131a] px-3 text-[10px] text-white/35">
        <span>{blocks.length ? `${blocks.length} editable elements · ${businessName}` : "Ready for your prompt"}</span>
        <span>Freeform canvas · move · resize · lock · preview · export</span>
      </footer>
    </div>
  );
}

function DesignCanvas({
  blocks,
  selectedId,
  onSelect,
  onUpdate,
  onGenerate,
  generating,
}: {
  blocks: DemoBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<DemoBlock>) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="relative min-h-[860px] overflow-hidden rounded-2xl bg-white shadow-[0_35px_90px_rgba(0,0,0,.5)]" onPointerDown={() => undefined}>
      {blocks.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-900">
          <div className="max-w-md">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Sparkles className="size-7" /></div>
            <h2 className="text-2xl font-bold">Turn a business idea into an editable website.</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">Generate the first draft, then drag, resize, rewrite, recolour and lock elements like a design tool.</p>
            <Button className="mt-5 bg-violet-600 text-white hover:bg-violet-500" onClick={onGenerate} disabled={generating}>
              {generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />} Generate demo website
            </Button>
          </div>
        </div>
      ) : (
        blocks.map((block) => <CanvasBlock key={block.id} block={block} selected={selectedId === block.id} onSelect={() => onSelect(block.id)} onUpdate={(patch) => onUpdate(block.id, patch)} />)
      )}
    </div>
  );
}

function CanvasBlock({ block, selected, onSelect, onUpdate }: { block: DemoBlock; selected: boolean; onSelect: () => void; onUpdate: (patch: Partial<DemoBlock>) => void }) {
  const dragRef = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ clientX: number; clientY: number; width: number; height: number } | null>(null);

  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onSelect();
    if (block.locked) return;
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, x: block.x, y: block.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || block.locked) return;
    onUpdate({ x: Math.max(0, Math.round(dragRef.current.x + event.clientX - dragRef.current.clientX)), y: Math.max(0, Math.round(dragRef.current.y + event.clientY - dragRef.current.clientY)) });
  };

  const endDrag = () => { dragRef.current = null; };

  const beginResize = (event: PointerEvent<HTMLDivElement>) => {
    if (block.locked) return;
    event.stopPropagation();
    resizeRef.current = { clientX: event.clientX, clientY: event.clientY, width: block.width, height: block.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resize = (event: PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || block.locked) return;
    onUpdate({ width: Math.max(60, Math.round(resizeRef.current.width + event.clientX - resizeRef.current.clientX)), height: Math.max(32, Math.round(resizeRef.current.height + event.clientY - resizeRef.current.clientY)) });
  };

  const style: CSSProperties = {
    position: "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    background: block.background,
    color: block.color,
    borderRadius: block.radius,
  };

  return (
    <div
      style={style}
      onPointerDown={beginDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      className={`group flex touch-none select-none items-center overflow-hidden transition-shadow ${block.type === "heading" ? "px-2 text-5xl font-black leading-none tracking-tight" : block.type === "text" ? "px-2 text-lg leading-relaxed" : block.type === "button" ? "justify-center px-5 text-sm font-semibold shadow-lg" : block.type === "card" ? "border border-slate-200 px-6 text-xl font-bold shadow-sm" : ""} ${selected ? "z-30 outline outline-2 outline-violet-500 outline-offset-2" : "z-10"} ${block.locked ? "cursor-not-allowed" : "cursor-move"}`}
    >
      {block.type !== "shape" && <span className="pointer-events-none">{block.text}</span>}
      {block.locked && <Lock className="pointer-events-none absolute right-2 top-2 size-3 opacity-50" />}
      {selected && !block.locked && (
        <div onPointerDown={beginResize} onPointerMove={resize} onPointerUp={() => { resizeRef.current = null; }} className="absolute bottom-0 right-0 size-4 cursor-se-resize rounded-tl-md border-l border-t border-violet-500 bg-white" />
      )}
    </div>
  );
}

function PreviewWebsite({ blocks, businessName }: { blocks: DemoBlock[]; businessName: string }) {
  if (!blocks.length) return <div className="flex min-h-[760px] items-center justify-center rounded-2xl bg-white text-sm text-slate-400">Generate a website before previewing.</div>;
  const heading = blocks.find((block) => block.type === "heading")?.text ?? businessName;
  const heroCopy = blocks.find((block) => block.name === "Hero copy")?.text ?? "A better way to move your business forward.";
  const heroButton = blocks.find((block) => block.name === "Primary CTA");
  const about = blocks.find((block) => block.name === "About copy")?.text;
  const cards = blocks.filter((block) => block.type === "card");
  const heroShape = blocks.find((block) => block.name === "Hero background");
  const primary = heroButton?.background ?? "#6d5dfc";
  const dark = heroShape?.background ?? "#111827";

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_35px_90px_rgba(0,0,0,.5)]">
      <section className="px-7 py-20 md:px-12 md:py-28" style={{ background: dark, color: "white" }}>
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Designed in WebEazy</div>
          <h1 className="text-4xl font-black tracking-tight md:text-7xl">{heading}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 md:text-xl">{heroCopy}</p>
          {heroButton && <button className="mt-8 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: primary }}>{heroButton.text}</button>}
        </div>
      </section>
      <section className="px-7 py-14 md:px-12 md:py-20">
        {about && <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-700 md:text-3xl">{about}</p>}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <div key={card.id} className="rounded-2xl border border-slate-200 p-6">
              <div className="mb-8 text-xs font-semibold" style={{ color: primary }}>0{index + 1}</div>
              <h3 className="text-xl font-bold">{card.text}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Flexible, customer-focused service designed around real business needs.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InspectorField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/35">{label}</span>
      {multiline ? (
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-20 resize-none border-white/10 bg-black/20 text-xs text-white" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-2.5 text-xs text-white outline-none focus:border-violet-400/50" />
      )}
    </label>
  );
}

function ViewportButton({ active, label, onClick, icon }: { active: boolean; label: string; onClick: () => void; icon: React.ReactNode }) {
  return <button title={label} onClick={onClick} className={`rounded-md p-1.5 transition ${active ? "bg-white/10 text-white" : "text-white/35 hover:text-white"}`}>{icon}</button>;
}

function numberOr(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildExportHtml(businessName: string, blocks: DemoBlock[]) {
  const heading = blocks.find((block) => block.type === "heading")?.text ?? businessName;
  const heroCopy = blocks.find((block) => block.name === "Hero copy")?.text ?? "Built for your business.";
  const about = blocks.find((block) => block.name === "About copy")?.text ?? "";
  const button = blocks.find((block) => block.name === "Primary CTA");
  const cards = blocks.filter((block) => block.type === "card");
  const dark = blocks.find((block) => block.name === "Hero background")?.background ?? "#111827";
  const primary = button?.background ?? "#6d5dfc";
  const escape = (value: string) => value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(businessName)}</title><style>body{margin:0;font-family:Inter,Arial,sans-serif;color:#0f172a}*{box-sizing:border-box}.hero{padding:110px 8%;background:${dark};color:#fff}.hero h1{font-size:clamp(48px,8vw,96px);line-height:.95;margin:0;max-width:900px}.hero p{font-size:20px;line-height:1.6;max-width:700px;color:#cbd5e1}.btn{display:inline-block;margin-top:24px;background:${primary};color:#fff;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700}.content{padding:80px 8%}.intro{font-size:clamp(24px,4vw,42px);line-height:1.35;max-width:1000px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:48px}.card{border:1px solid #e2e8f0;border-radius:18px;padding:28px}.card h3{margin:0;font-size:22px}</style></head><body><section class="hero"><h1>${escape(heading)}</h1><p>${escape(heroCopy)}</p>${button ? `<a class="btn" href="#contact">${escape(button.text)}</a>` : ""}</section><section class="content"><div class="intro">${escape(about)}</div><div class="cards">${cards.map((card) => `<div class="card"><h3>${escape(card.text)}</h3></div>`).join("")}</div></section></body></html>`;
}
