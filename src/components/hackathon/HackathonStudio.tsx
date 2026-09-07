import { useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import {
  AlignCenter, AlignRight, ArrowLeft, Bot, ChevronDown, Code2, Copy, Crop, Eye, Frame,
  GripVertical, Image as ImageIcon, Layers as LayersIcon, Link2, Lock, LockOpen, Monitor,
  Move, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Scissors, Smartphone, Sparkles,
  Square, Tablet, Trash2, Type, Undo2, Redo2, WandSparkles, ZoomIn, LayoutTemplate,
  FolderOpen, MousePointer2, Settings2, Search, Grid3X3, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWithAiPrototype, refineBlock, type DemoBlock } from "@/lib/hackathon/ai-prototype";
import { buildGeneratedSiteExportHtml, GeneratedSitePreview } from "./GeneratedSitePreview";

type Viewport = "desktop" | "tablet" | "mobile";
type Tool = "select" | "move" | "frame" | "crop" | "text" | "image" | "link" | "align-left";
type LeftTab = "ai" | "layers" | "pages" | "assets";

const widths: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const samplePrompt = "Create a modern website for a Nigerian solar and electrical company called Vicky Tech Innovations. Use green and charcoal. Include a strong hero, services, trust-building copy and a clear contact CTA.";

const tools: Array<[Tool, string, typeof MousePointer2]> = [
  ["select", "Select", MousePointer2],
  ["move", "Move", Move],
  ["frame", "Frame", Frame],
  ["text", "Text", Type],
  ["image", "Image", ImageIcon],
  ["frame", "Shape", Square],
  ["crop", "Crop", Crop],
  ["link", "Link", Link2],
  ["align-left", "Align", AlignCenter],
];

export function HackathonStudio({ onClose, initialBusinessName = "Untitled project" }: { onClose: () => void; initialBusinessName?: string }) {
  const [prompt, setPrompt] = useState(samplePrompt);
  const [blocks, setBlocks] = useState<DemoBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refine, setRefine] = useState("Make this more premium and modern");
  const [primary, setPrimary] = useState("#22c55e");
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [engineMode, setEngineMode] = useState<"remote" | "local-prototype" | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [tool, setTool] = useState<Tool>("select");
  const [leftTab, setLeftTab] = useState<LeftTab>("ai");
  const [zoom, setZoom] = useState(100);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => blocks.find((block) => block.id === selectedId) ?? null, [blocks, selectedId]);
  const update = (id: string, patch: Partial<DemoBlock>) => setBlocks((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

  const addBlock = (block: DemoBlock) => {
    setBlocks((items) => [...items, block]);
    setSelectedId(block.id);
    setContext(null);
  };

  const addText = () => addBlock({ id: newId("text"), type: "text", name: "Text", text: "Double-click to edit this text", x: 120, y: 160, width: 420, height: 70, background: "transparent", color: "#f5f5e6", radius: 0, locked: false });
  const addShape = () => addBlock({ id: newId("shape"), type: "shape", name: "Shape", text: "", x: 140, y: 260, width: 300, height: 160, background: "#242728", color: "#f5f5e6", radius: 16, locked: false });

  const addImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => addBlock({ id: newId("image"), type: "image", name: file.name.replace(/\.[^.]+$/, "") || "Image", text: "", x: 120, y: 180, width: 420, height: 280, background: "#15191b", color: "#fff", radius: 16, locked: false, src: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const result = await generateWithAiPrototype(prompt.trim());
      setBlocks(result.blocks);
      setBusinessName(result.businessName || businessName);
      setPrimary(result.primary);
      setEngineMode(result.mode);
      setSelectedId(result.blocks.find((block) => block.type === "heading")?.id ?? result.blocks[0]?.id ?? null);
    } finally {
      setGenerating(false);
    }
  };

  const refineSelected = async () => {
    if (!selected || !refine.trim()) return;
    setRefining(true);
    try {
      update(selected.id, await refineBlock(selected, refine, primary));
    } finally {
      setRefining(false);
    }
  };

  const exportHtml = () => {
    const html = buildGeneratedSiteExportHtml(businessName, blocks);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "webeazy-site"}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const duplicate = () => {
    if (!selected) return;
    addBlock({ ...selected, id: newId("copy"), name: `${selected.name} copy`, x: selected.x + 24, y: selected.y + 24 });
  };

  const remove = () => {
    if (!selected) return;
    setBlocks((items) => items.filter((item) => item.id !== selected.id));
    setSelectedId(null);
    setContext(null);
  };

  const align = (kind: "left" | "center" | "right") => {
    if (!selected) return;
    const x = kind === "left" ? 40 : kind === "center" ? (widths[viewport] - selected.width) / 2 : widths[viewport] - selected.width - 40;
    update(selected.id, { x: Math.max(0, x) });
  };

  const toolClick = (next: Tool) => {
    setTool(next);
    if (next === "text") addText();
    if (next === "frame") addShape();
    if (next === "image") inputRef.current?.click();
    if (next === "link" && selected) {
      const href = window.prompt("Enter link URL", selected.href || "https://");
      if (href !== null) update(selected.id, { href });
    }
    if (next === "align-left") align("left");
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => {
    if (tool !== "move" || block.locked) return;
    event.stopPropagation();
    setSelectedId(block.id);
    setDragId(block.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveBlock = (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => {
    if (dragId !== block.id || tool !== "move") return;
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const scale = rect.width / widths[viewport];
    update(block.id, {
      x: Math.max(0, (event.clientX - rect.left) / scale - block.width / 2),
      y: Math.max(0, (event.clientY - rect.top) / scale - block.height / 2),
    });
  };

  const stopDrag = () => setDragId(null);

  return (
    <div className="webeazy-studio fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#090b0c] text-white" onPointerDown={() => context && setContext(null)}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) addImage(file); event.currentTarget.value = ""; }} />

      <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-white/[.08] bg-[#0f1217] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onClose} className="rounded-lg p-2 text-white/55 hover:bg-white/5 hover:text-white"><ArrowLeft className="size-4" /></button>
          <img src="/webeazy-logo.svg" alt="WebEazy" className="size-9 object-contain" />
          <div className="h-7 w-px bg-white/10" />
          <button className="flex min-w-[130px] items-center gap-2 rounded-lg border border-white/[.06] bg-[#151920] px-3 py-2 text-xs"><span className="truncate">{businessName}</span><ChevronDown className="ml-auto size-3 text-white/30" /></button>
          <span className="hidden items-center gap-1.5 pl-2 text-[11px] text-white/40 sm:flex"><i className="size-1.5 rounded-full bg-[#22c55e]" />Saved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex"><IconButton icon={<Undo2 />} label="Undo" /><IconButton icon={<Redo2 />} label="Redo" /></div>
          <button onClick={() => setLeftTab("ai")} className="hidden items-center gap-2 rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-[11px] text-[#dfffe8] lg:flex"><Bot className="size-3.5 text-[#a78bfa]" />AI Assistant<span className="h-4 w-7 rounded-full bg-[#22c55e] p-0.5"><span className="block size-3 translate-x-3 rounded-full bg-white" /></span></button>
          <div className="hidden rounded-lg border border-white/10 bg-black/20 p-0.5 md:flex">{(["desktop", "tablet", "mobile"] as Viewport[]).map((value) => <button key={value} onClick={() => setViewport(value)} className={`rounded-md p-1.5 ${viewport === value ? "bg-white/10 text-white" : "text-white/30"}`}>{value === "desktop" ? <Monitor className="size-3.5" /> : value === "tablet" ? <Tablet className="size-3.5" /> : <Smartphone className="size-3.5" />}</button>)}</div>
          <Button variant="outline" size="sm" onClick={() => setPreview((value) => !value)} className="h-9 border-white/10 bg-[#151920] text-white/80"><Eye className="mr-1.5 size-3.5" />{preview ? "Design" : "Preview"}</Button>
          <Button size="sm" onClick={exportHtml} disabled={!blocks.length} className="h-9 bg-[#22c55e] text-[#07110a] hover:bg-[#4ade80]"><Code2 className="mr-1.5 size-3.5" />Export</Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {!preview && leftOpen && (
          <aside className="hidden w-[356px] shrink-0 border-r border-white/[.08] bg-[#101318] lg:flex">
            <nav className="flex w-[76px] shrink-0 flex-col items-center border-r border-white/[.07] bg-[#0c0f14] py-3">
              <Rail active={leftTab === "ai"} icon={<Bot />} label="AI" onClick={() => setLeftTab("ai")} />
              <Rail active={leftTab === "layers"} icon={<LayersIcon />} label="Layers" onClick={() => setLeftTab("layers")} />
              <Rail active={leftTab === "pages"} icon={<LayoutTemplate />} label="Pages" onClick={() => setLeftTab("pages")} />
              <Rail active={leftTab === "assets"} icon={<FolderOpen />} label="Assets" onClick={() => setLeftTab("assets")} />
              <div className="mt-auto"><Rail icon={<Settings2 />} label="Settings" /></div>
            </nav>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex h-[48px] items-center justify-between border-b border-white/[.07] px-4"><span className="text-xs font-semibold">{leftTab === "ai" ? "AI Assistant" : leftTab[0].toUpperCase() + leftTab.slice(1)}</span><button onClick={() => setLeftOpen(false)} className="p-1.5 text-white/35"><PanelLeftClose className="size-4" /></button></div>
              {leftTab === "ai" && <div className="min-h-0 overflow-auto p-3"><div className="mb-3 rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/[.07] p-3"><div className="flex items-center gap-2 text-xs font-semibold"><WandSparkles className="size-4 text-[#a78bfa]" />Describe your website</div><p className="mt-1 text-[10px] text-white/40">AI creates editable website elements. You remain in control.</p></div><Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-32 border-white/10 bg-black/25 text-xs text-white" /><Button className="mt-2.5 w-full bg-[#8b5cf6]" onClick={() => void generate()} disabled={generating}>{generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}{generating ? "Generating..." : blocks.length ? "Regenerate website" : "Generate website"}</Button><div className="mt-2 text-[10px] text-white/35">{engineMode === "remote" ? "● Live AI connected" : engineMode === "local-prototype" ? "○ Prototype fallback" : "○ AI ready"}</div><div className="mt-4 border-t border-white/10 pt-3"><Label>Refine selected</Label><Textarea value={refine} onChange={(event) => setRefine(event.target.value)} className="mt-2 min-h-20 border-white/10 bg-black/20 text-xs" /><Button variant="outline" onClick={() => void refineSelected()} disabled={!selected || refining} className="mt-2 w-full border-white/10 bg-white/[.03]">{refining ? "Refining..." : "Apply AI refinement"}</Button></div></div>}
              {leftTab === "layers" && <LayersPanel blocks={blocks} selectedId={selectedId} onSelect={setSelectedId} />}
              {leftTab === "pages" && <div className="p-3"><div className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-xs">Home</div></div>}
              {leftTab === "assets" && <div className="p-3"><div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/35"><Search className="size-3.5" />Search assets</div><button onClick={() => inputRef.current?.click()} className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-white/40 hover:text-white"><ImageIcon /><span className="text-xs">Upload image</span></button></div>}
            </div>
          </aside>
        )}

        {!preview && !leftOpen && <button onClick={() => setLeftOpen(true)} className="absolute left-2 top-2 z-50 rounded-lg border border-white/10 bg-[#10131a] p-2"><PanelLeftOpen className="size-4" /></button>}

        <main className="relative min-w-0 flex-1 overflow-hidden bg-[#080a0c]">
          {preview ? <GeneratedSitePreview blocks={blocks} businessName={businessName} viewport={viewport} onBack={() => setPreview(false)} /> : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/[.08] bg-[#0e1116] px-2">
                <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
                  {tools.map(([toolName, label, Icon], index) => <button key={`${label}-${index}`} onClick={() => toolClick(toolName)} className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[9px] ${tool === toolName ? "bg-[#8b5cf6] text-white" : "text-white/45 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4" /><span>{label}</span></button>)}
                  <span className="mx-1 h-7 w-px bg-white/10" />
                  <IconButton icon={<AlignCenter />} label="Align center" onClick={() => align("center")} />
                  <IconButton icon={<AlignRight />} label="Align right" onClick={() => align("right")} />
                  <IconButton icon={<Plus />} label="Add text" onClick={addText} />
                  <IconButton icon={<Grid3X3 />} label="Grid" />
                </div>
                <div className="hidden items-center gap-1 sm:flex"><button onClick={() => setZoom((value) => Math.max(25, value - 10))}>−</button><span className="min-w-10 text-center text-[10px] text-white/50">{zoom}%</span><button onClick={() => setZoom((value) => Math.min(150, value + 10))}>+</button><ZoomIn className="ml-1 size-3.5 text-white/25" /><button onClick={duplicate} className="ml-2 p-1.5 text-white/40"><Copy className="size-3.5" /></button><button onClick={remove} className="p-1.5 text-white/40 hover:text-red-300"><Trash2 className="size-3.5" /></button></div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-auto bg-[#0b0e11]">
                <div className="min-h-full min-w-max p-8">
                  <div className="relative mx-auto overflow-hidden border border-white/[.08] bg-[#15191b] shadow-2xl" style={{ width: widths[viewport] * zoom / 100, minHeight: 760 * zoom / 100 }}>
                    <div className="relative" style={{ width: widths[viewport], minHeight: 760, transform: `scale(${zoom / 100})`, transformOrigin: "top left", marginBottom: `${760 * (zoom / 100 - 1)}px`, marginRight: `${widths[viewport] * (zoom / 100 - 1)}px` }}>
                      <div className="absolute inset-0 opacity-[.18]" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.12) 1px,transparent 1px)", backgroundSize: `${16 * zoom / 100}px ${16 * zoom / 100}px` }} />
                      <InnerCanvas blocks={blocks} selectedId={selectedId} tool={tool} onSelect={setSelectedId} onContext={(event, block) => { event.preventDefault(); event.stopPropagation(); setSelectedId(block.id); setContext({ x: event.clientX, y: event.clientY }); }} onDragStart={startDrag} onDragMove={moveBlock} onDragEnd={stopDrag} onGenerate={() => void generate()} generating={generating} businessName={businessName} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {!preview && rightOpen && <aside className="hidden w-[286px] shrink-0 border-l border-white/[.08] bg-[#101318] xl:flex"><Properties selected={selected} update={update} primary={primary} setPrimary={setPrimary} /></aside>}
      </div>

      {context && <div className="fixed z-[200] w-48 rounded-xl border border-white/10 bg-[#14181e] p-1.5 text-xs shadow-2xl" style={{ left: context.x, top: context.y }} onPointerDown={(event) => event.stopPropagation()}><MenuItem icon={<Copy />} label="Duplicate" onClick={duplicate} /><MenuItem icon={<Scissors />} label="Delete" onClick={remove} danger /><MenuItem icon={selected?.locked ? <LockOpen /> : <Lock />} label={selected?.locked ? "Unlock" : "Lock"} onClick={() => selected && update(selected.id, { locked: !selected.locked })} /></div>}
    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) { return <button title={label} onClick={onClick} className="rounded-md p-2 text-white/35 hover:bg-white/5 hover:text-white">{icon}</button>; }
function Rail({ icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) { return <button onClick={onClick} title={label} className={`flex w-full flex-col items-center gap-1.5 px-1 py-3 text-[9px] ${active ? "text-white" : "text-white/35 hover:text-white"}`}><span className={`rounded-lg p-2 ${active ? "bg-[#8b5cf6]/15 text-[#b99cff]" : ""}`}>{icon}</span>{label}</button>; }
function Label({ children }: { children: React.ReactNode }) { return <div className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/38">{children}</div>; }
function MenuItem({ icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] ${danger ? "text-red-300" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>{icon}<span>{label}</span></button>; }

function LayersPanel({ blocks, selectedId, onSelect }: { blocks: DemoBlock[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <div className="min-h-0 flex-1 overflow-auto p-2.5">{blocks.length ? blocks.map((block) => <button key={block.id} onClick={() => onSelect(block.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] ${selectedId === block.id ? "bg-[#8b5cf6]/15 text-white" : "text-white/55 hover:bg-white/5"}`}><GripVertical className="size-3.5 text-white/20" /><span className="min-w-0 flex-1 truncate">{block.name}</span>{block.locked && <Lock className="size-3" />}</button>) : <div className="mt-6 p-5 text-center text-[11px] text-white/35">Your generated layers will appear here.</div>}</div>;
}

function InnerCanvas({ blocks, selectedId, tool, onSelect, onContext, onDragStart, onDragMove, onDragEnd, onGenerate, generating, businessName }: { blocks: DemoBlock[]; selectedId: string | null; tool: Tool; onSelect: (id: string) => void; onContext: (event: MouseEvent<HTMLDivElement>, block: DemoBlock) => void; onDragStart: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void; onDragMove: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void; onDragEnd: () => void; onGenerate: () => void; generating: boolean; businessName: string }) {
  return <div className="relative min-h-[760px] overflow-hidden bg-[#0c1011]" style={{ width: 1120 }}>
    {!blocks.length && <div className="absolute inset-0 z-20 flex items-center justify-center p-10"><div className="text-center"><WandSparkles className="mx-auto size-8 text-[#a78bfa]" /><h2 className="mt-4 text-2xl font-semibold">Start designing {businessName}</h2><button onClick={onGenerate} disabled={generating} className="mt-5 rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#07110a]">{generating ? "Generating..." : "Generate with AI"}</button></div></div>}
    {blocks.map((block, index) => <CanvasBlock key={block.id} block={block} selected={selectedId === block.id} z={index + 1} tool={tool} onSelect={onSelect} onContext={onContext} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} />)}
  </div>;
}

function CanvasBlock({ block, selected, z, tool, onSelect, onContext, onDragStart, onDragMove, onDragEnd }: { block: DemoBlock; selected: boolean; z: number; tool: Tool; onSelect: (id: string) => void; onContext: (event: MouseEvent<HTMLDivElement>, block: DemoBlock) => void; onDragStart: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void; onDragMove: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void; onDragEnd: () => void }) {
  const style: CSSProperties = { position: "absolute", left: block.x, top: block.y, width: block.width, height: block.height, background: block.background, color: block.color, borderRadius: block.radius, zIndex: z, boxSizing: "border-box", cursor: block.locked ? "not-allowed" : tool === "move" ? "grab" : "default" };
  const down = (event: PointerEvent<HTMLDivElement>) => { event.stopPropagation(); if (tool === "move") onDragStart(event, block); else onSelect(block.id); };
  const doubleClick = (event: MouseEvent<HTMLDivElement>) => { if (tool === "move") { event.stopPropagation(); onDragEnd(); } };
  let content: React.ReactNode;
  if (block.type === "image" && block.src) content = <img src={block.src} alt={block.name} className="h-full w-full object-cover" />;
  else if (block.type === "heading") content = <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words text-[48px] font-bold leading-[1.05]">{block.text}</div>;
  else if (block.type === "button") content = <div className="flex h-full w-full items-center justify-center gap-2 px-5 text-sm font-semibold">{block.text}<span>→</span></div>;
  else if (block.type === "card") content = <div className="flex h-full flex-col justify-end p-5 text-base font-semibold">{block.text}</div>;
  else if (block.type === "shape") content = null;
  else content = <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words text-base leading-6">{block.text}</div>;

  return <div onPointerDown={down} onPointerMove={(event) => onDragMove(event, block)} onPointerUp={onDragEnd} onDoubleClick={doubleClick} onContextMenu={(event) => onContext(event, block)} style={style} className={`group border ${selected ? "border-[#8b5cf6] shadow-[0_0_0_1px_rgba(139,92,246,.55)]" : "border-transparent hover:border-white/20"}`}>{content}{selected && !block.locked && <><span className="absolute -left-1.5 -top-1.5 size-3 rounded-sm bg-[#8b5cf6]" /><span className="absolute -right-1.5 -top-1.5 size-3 rounded-sm bg-[#8b5cf6]" /><span className="absolute -bottom-1.5 -left-1.5 size-3 rounded-sm bg-[#8b5cf6]" /><span className="absolute -bottom-1.5 -right-1.5 size-3 rounded-sm bg-[#8b5cf6]" /></>}</div>;
}

function Properties({ selected, update, primary, setPrimary }: { selected: DemoBlock | null; update: (id: string, patch: Partial<DemoBlock>) => void; primary: string; setPrimary: (value: string) => void }) {
  if (!selected) return <div className="flex flex-1 flex-col"><div className="border-b border-white/[.07] px-4 py-4 text-xs font-semibold">Properties</div><div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-white/35"><SlidersHorizontal className="mr-2 size-5" />Select an element</div></div>;
  const patch = (key: keyof DemoBlock, value: any) => update(selected.id, { [key]: value } as Partial<DemoBlock>);
  return <div className="min-h-0 flex-1 overflow-auto"><div className="flex h-[48px] items-center gap-4 border-b border-white/[.07] px-4 text-[11px]"><span className="border-b-2 border-[#8b5cf6] py-4 font-semibold">Properties</span><span className="text-white/35">Style</span><span className="text-white/35">Effects</span></div><section className="border-b border-white/[.07] p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] text-white/35">Element</p><p className="mt-1 text-xs font-medium">{selected.name}</p></div><button onClick={() => patch("locked", !selected.locked)}>{selected.locked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}</button></div></section><section className="border-b border-white/[.07] p-4"><Label>Position &amp; Size</Label><div className="mt-2 grid grid-cols-2 gap-2">{([["X", "x"], ["Y", "y"], ["W", "width"], ["H", "height"]] as const).map(([label, key]) => <label key={key} className="rounded-md border border-white/[.08] bg-white/[.025] px-2 py-1.5"><span className="mr-1 text-[9px] text-white/30">{label}</span><input type="number" value={Math.round(selected[key])} onChange={(event) => patch(key, Number(event.target.value))} className="w-16 bg-transparent text-xs outline-none" /></label>)}</div></section><section className="border-b border-white/[.07] p-4"><Label>Colors</Label><div className="mt-2 flex justify-between"><span className="text-[10px] text-white/35">Text</span><input type="color" value={selected.color.startsWith("#") ? selected.color : "#ffffff"} onChange={(event) => patch("color", event.target.value)} /></div><div className="mt-2 flex justify-between"><span className="text-[10px] text-white/35">Background</span><input type="color" value={selected.background.startsWith("#") ? selected.background : "#151818"} onChange={(event) => patch("background", event.target.value)} /></div></section><section className="p-4"><Label>Radius</Label><input type="range" min="0" max="48" value={selected.radius} onChange={(event) => patch("radius", Number(event.target.value))} className="mt-3 w-full accent-[#8b5cf6]" /><div className="text-right text-[10px] text-white/35">{selected.radius}px</div></section><section className="border-t border-white/[.07] p-4"><Label>Brand accent</Label><div className="mt-2 flex gap-2"><input type="color" value={primary} onChange={(event) => setPrimary(event.target.value)} /><input value={primary} onChange={(event) => setPrimary(event.target.value)} className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[.025] px-2 text-xs" /></div></section></div>;
}
