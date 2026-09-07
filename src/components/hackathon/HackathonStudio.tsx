import { useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bot, ChevronDown, ChevronRight, Code2, Copy, Crop, Eye,
  Frame, GripVertical, Image as ImageIcon, Layers as LayersIcon, Link2, Lock, LockOpen, Maximize2, Minimize2,
  Monitor, Move, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Redo2, RefreshCw,
  Scissors, Send, Smartphone, Sparkles, Square, Tablet, Trash2, Type, Undo2, WandSparkles, ZoomIn,
  LayoutTemplate, FolderOpen, MousePointer2, Settings2, Search, MoreHorizontal, Grid3X3, Palette, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWithAiPrototype, refineBlock, type DemoBlock } from "@/lib/hackathon/ai-prototype";
import { buildGeneratedSiteExportHtml, GeneratedSitePreview } from "./GeneratedSitePreview";

type Viewport = "desktop" | "tablet" | "mobile";
type Tool = "select" | "move" | "frame" | "crop" | "text" | "image" | "link" | "align-left" | "align-center" | "align-right";
type LeftTab = "layers" | "pages" | "assets" | "ai";
type ContextMenuState = { x: number; y: number; blockId: string } | null;

const widths: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const samplePrompt = "Create a modern website for a Nigerian solar and electrical company called Vicky Tech Innovations. Use green and charcoal. Include a strong hero, services, trust-building copy and a clear contact CTA.";

const TOOL_ITEMS: Array<{ id: Tool; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "move", label: "Move", icon: Move },
  { id: "frame", label: "Frame", icon: Frame },
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "frame", label: "Shape", icon: Square },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "link", label: "Link", icon: Link2 },
  { id: "align-left", label: "Align", icon: AlignLeft },
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
  const [aiOpen, setAiOpen] = useState(true);
  const [immersive, setImmersive] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [leftTab, setLeftTab] = useState<LeftTab>("layers");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);
  const updateBlock = (id: string, patch: Partial<DemoBlock>) => setBlocks((current) => current.map((b) => b.id === id ? { ...b, ...patch } : b));
  const addBlock = (block: DemoBlock) => { setBlocks((current) => [...current, block]); setSelectedId(block.id); setContextMenu(null); };
  const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

  const addText = () => addBlock({ id: newId("text"), type: "text", name: "Text", text: "Double-click to edit this text", x: 120, y: 160, width: 420, height: 70, background: "transparent", color: "#f5f5e6", radius: 0, locked: false });
  const addShape = () => addBlock({ id: newId("shape"), type: "shape", name: "Shape", text: "", x: 140, y: 260, width: 300, height: 160, background: "#242728", color: "#f5f5e6", radius: 16, locked: false });
  const duplicateSelected = () => { if (!selected) return; addBlock({ ...selected, id: newId("copy"), name: `${selected.name} copy`, x: selected.x + 24, y: selected.y + 24 }); };
  const deleteSelected = () => { if (!selected) return; setBlocks((current) => current.filter((b) => b.id !== selected.id)); setSelectedId(null); setContextMenu(null); };
  const moveLayer = (id: string, direction: "front" | "back" | "forward" | "backward") => {
    setBlocks((current) => {
      const index = current.findIndex((b) => b.id === id); if (index < 0) return current;
      const next = [...current]; const [item] = next.splice(index, 1);
      if (direction === "front") next.push(item); else if (direction === "back") next.unshift(item);
      else if (direction === "forward") next.splice(Math.min(index + 1, next.length), 0, item); else next.splice(Math.max(index - 1, 0), 0, item);
      return next;
    });
    setSelectedId(id); setContextMenu(null);
  };
  const openContextMenu = (event: MouseEvent<HTMLDivElement>, id: string) => { event.preventDefault(); event.stopPropagation(); setSelectedId(id); setContextMenu({ x: event.clientX, y: event.clientY, blockId: id }); };

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const r = await generateWithAiPrototype(prompt.trim());
      setBlocks(r.blocks); setBusinessName(r.businessName || businessName); setPrimary(r.primary); setEngineMode(r.mode);
      setSelectedId(r.blocks.find((b) => b.type === "heading")?.id ?? r.blocks[0]?.id ?? null);
    } finally { setGenerating(false); }
  };

  const refineSelected = async () => {
    if (!selected || !refine.trim()) return;
    setRefining(true);
    try { updateBlock(selected.id, await refineBlock(selected, refine, primary)); } finally { setRefining(false); }
  };

  const exportHtml = () => {
    const html = buildGeneratedSiteExportHtml(businessName, blocks);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "webeazy-site"}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const toolClick = (next: Tool) => { setTool(next); if (next === "text") addText(); if (next === "frame") addShape(); };

  const onCanvasPointerMove = (event: PointerEvent<HTMLDivElement>, id: string) => {
    if (!selected || selected.id !== id || selected.locked || (tool !== "move" && tool !== "select")) return;
    const target = event.currentTarget;
    const parent = target.parentElement?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const scale = rect.width / widths[viewport];
    updateBlock(id, { x: Math.max(0, (event.clientX - rect.left) / scale - selected.width / 2), y: Math.max(0, (event.clientY - rect.top) / scale - selected.height / 2) });
  };

  return (
    <div className="webeazy-studio fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#090b0c] text-white" onPointerDown={() => contextMenu && setContextMenu(null)}>
      {!immersive && <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0f1217] px-3 shadow-[0_8px_30px_rgba(0,0,0,.22)]">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onClose} className="mr-1 rounded-lg p-2 text-white/55 transition hover:bg-white/5 hover:text-white" title="Back to projects"><ArrowLeft className="size-4" /></button>
          <img src="/webeazy-logo.svg" alt="WebEazy" className="size-9 object-contain" />
          <div className="mr-3 h-7 w-px bg-white/10" />
          <button className="flex min-w-[130px] items-center gap-2 rounded-lg border border-white/[0.06] bg-[#151920] px-3 py-2 text-left text-xs hover:bg-white/[0.07]"><span className="truncate">{businessName}</span><ChevronDown className="ml-auto size-3 text-white/30" /></button>
          <div className="hidden items-center gap-1.5 pl-2 text-[11px] text-white/40 sm:flex"><span className="size-1.5 rounded-full bg-[#22c55e]" />Saved</div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <IconButton icon={<Undo2 />} label="Undo" /> <IconButton icon={<Redo2 />} label="Redo" />
          </div>
          <div className="mx-1 hidden h-6 w-px bg-white/10 md:block" />
          <button onClick={() => setAiOpen((v) => !v)} className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium lg:flex ${aiOpen ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#dfffe8]" : "border-white/10 bg-white/5 text-white/45"}`}><Bot className="size-3.5 text-[#a78bfa]" />AI Assistant<span className={`ml-1 h-4 w-7 rounded-full p-0.5 ${aiOpen ? "bg-[#22c55e]" : "bg-white/15"}`}><span className={`block size-3 rounded-full bg-white transition-transform ${aiOpen ? "translate-x-3" : "translate-x-0"}`} /></span></button>
          <div className="hidden items-center rounded-lg border border-white/10 bg-black/20 p-0.5 md:flex">{(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => <button key={v} title={v} onClick={() => setViewport(v)} className={`rounded-md p-1.5 ${viewport === v ? "bg-white/10 text-white" : "text-white/30 hover:text-white"}`}>{v === "desktop" ? <Monitor className="size-3.5" /> : v === "tablet" ? <Tablet className="size-3.5" /> : <Smartphone className="size-3.5" />}</button>)}</div>
          <Button variant="outline" size="sm" onClick={() => setPreview((v) => !v)} className="h-9 border-white/10 bg-[#151920] text-white/80 hover:bg-white/10 hover:text-white"><Eye className="mr-1.5 size-3.5" />{preview ? "Design" : "Preview"}</Button>
          <Button size="sm" onClick={exportHtml} disabled={!blocks.length} className="h-9 bg-[#22c55e] px-3 text-[#07110a] hover:bg-[#4ade80]"><Code2 className="mr-1.5 size-3.5" />Export</Button>
          <button className="ml-1 rounded-full border border-white/15 p-1.5 text-white/50"><div className="size-4 rounded-full border border-white/40" /></button>
        </div>
      </header>}

      {immersive && <button onClick={() => setImmersive(false)} className="absolute right-3 top-3 z-[120] rounded-lg border border-white/15 bg-[#10131a]/95 p-2 text-white shadow-xl"><Minimize2 className="size-4" /></button>}

      <div className="relative flex min-h-0 flex-1">
        {!preview && leftOpen && <aside className="hidden w-[356px] shrink-0 border-r border-white/[0.08] bg-[#101318] lg:flex">
          <nav className="flex w-[76px] shrink-0 flex-col items-center border-r border-white/[0.07] bg-[#0c0f14] py-3">
            <RailItem active={leftTab === "layers"} icon={<LayersIcon />} label="Layers" onClick={() => setLeftTab("layers")} />
            <RailItem active={leftTab === "pages"} icon={<LayoutTemplate />} label="Pages" onClick={() => setLeftTab("pages")} />
            <RailItem active={leftTab === "assets"} icon={<FolderOpen />} label="Assets" onClick={() => setLeftTab("assets")} />
            <RailItem active={leftTab === "ai"} icon={<Bot />} label="AI Assistant" onClick={() => setLeftTab("ai")} />
            <div className="mt-auto"><RailItem icon={<Settings2 />} label="Settings" /></div>
          </nav>
          <div className="min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-[48px] items-center justify-between border-b border-white/[0.07] px-4">
              <span className="text-xs font-semibold tracking-tight">{leftTab === "layers" ? "Layers" : leftTab === "pages" ? "Pages" : leftTab === "assets" ? "Assets" : "AI Assistant"}</span>
              <div className="flex items-center gap-1"><button className="rounded-md p-1.5 text-white/35 hover:bg-white/5 hover:text-white"><Plus className="size-4" /></button><button onClick={() => setLeftOpen(false)} className="rounded-md p-1.5 text-white/35 hover:bg-white/5 hover:text-white"><PanelLeftClose className="size-4" /></button></div>
            </div>
            {leftTab === "layers" && <LayersPanel blocks={blocks} selectedId={selectedId} onSelect={setSelectedId} />}
            {leftTab === "pages" && <div className="p-3"><div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="flex items-center justify-between"><span className="text-xs font-medium">Home</span><MoreHorizontal className="size-4 text-white/30" /></div><p className="mt-1 text-[10px] text-white/35">Main website page</p></div><button className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-xs text-white/35 hover:text-white"><Plus className="size-3.5" />Add page</button></div>}
            {leftTab === "assets" && <div className="p-3"><div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/35"><Search className="size-3.5" />Search assets</div><div className="grid grid-cols-2 gap-2"><AssetTile label="Logo" icon={<ImageIcon />} /><AssetTile label="Images" icon={<ImageIcon />} /><AssetTile label="Icons" icon={<Grid3X3 />} /><AssetTile label="Colors" icon={<Palette />} /></div></div>}
            {leftTab === "ai" && <div className="flex min-h-0 flex-1 flex-col p-3"><div className="mb-3 rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/[0.07] p-3"><div className="flex items-center gap-2 text-xs font-semibold"><WandSparkles className="size-4 text-[#a78bfa]" />Describe your website</div><p className="mt-1 text-[10px] leading-4 text-white/40">AI creates editable website elements. You remain in control.</p></div><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-32 resize-none border-white/10 bg-black/25 text-xs text-white placeholder:text-white/25" placeholder="Describe the business, style, pages and goals..." /><Button className="mt-2.5 w-full bg-[#8b5cf6] text-white hover:bg-[#a78bfa]" onClick={() => void generate()} disabled={generating || !prompt.trim()}>{generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}{generating ? "Generating..." : blocks.length ? "Regenerate website" : "Generate website"}</Button><div className="mt-2 text-[10px] text-white/35">{engineMode === "remote" ? "● Live AI connected" : engineMode === "local-prototype" ? "○ Prototype fallback" : "○ AI ready"}</div><div className="mt-4 border-t border-white/10 pt-3"><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/35">Refine selected</div><Textarea value={refine} onChange={(e) => setRefine(e.target.value)} className="min-h-20 resize-none border-white/10 bg-black/20 text-xs" /><Button variant="outline" onClick={() => void refineSelected()} disabled={!selected || refining} className="mt-2 w-full border-white/10 bg-white/[0.03] text-white hover:bg-white/10">{refining ? "Refining..." : "Apply AI refinement"}</Button></div></div>}
          </div>
        </aside>}

        {!preview && !leftOpen && <button title="Open left panel" onClick={() => setLeftOpen(true)} className="absolute left-2 top-2 z-50 rounded-lg border border-white/10 bg-[#10131a]/95 p-2 text-white/60 shadow-lg backdrop-blur hover:text-white"><PanelLeftOpen className="size-4" /></button>}

        <main className="relative min-w-0 flex-1 overflow-hidden bg-[#080a0c]">
          {preview ? <GeneratedSitePreview blocks={blocks} businessName={businessName} viewport={viewport} onBack={() => setPreview(false)} /> : <div className="flex h-full min-h-0 flex-col">
            <StudioToolbar tool={tool} onTool={toolClick} onDuplicate={duplicateSelected} onDelete={deleteSelected} zoom={zoom} setZoom={setZoom} />
            <div ref={canvasRef} className="relative min-h-0 flex-1 overflow-auto bg-[#0b0e11]" onPointerDown={() => setSelectedId(null)}>
              <div className="min-h-full min-w-max p-8 sm:p-10 lg:p-12">
                <div className="relative mx-auto overflow-hidden border border-white/[0.08] bg-[#15191b] shadow-[0_30px_100px_rgba(0,0,0,.55)]" style={{ width: widths[viewport] * zoom / 100, minHeight: 760 * zoom / 100 }}>
                  <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: `${16 * zoom / 100}px ${16 * zoom / 100}px` }} />
                  <div className="relative" style={{ width: widths[viewport], minHeight: 760, transform: `scale(${zoom / 100})`, transformOrigin: "top left", marginBottom: `${760 * (zoom / 100 - 1)}px`, marginRight: `${widths[viewport] * (zoom / 100 - 1)}px` }}>
                    <InnerDesignCanvas blocks={blocks} selectedId={selectedId} viewport={viewport} tool={tool} onSelect={(id) => setSelectedId(id)} onUpdate={updateBlock} onContextMenu={openContextMenu} onPointerMove={onCanvasPointerMove} onGenerate={() => void generate()} generating={generating} businessName={businessName} />
                  </div>
                </div>
              </div>
            </div>
          </div>}
        </main>

        {!preview && rightOpen && <aside className="hidden w-[286px] shrink-0 border-l border-white/[0.08] bg-[#101318] xl:flex">
          <PropertiesPanel selected={selected} updateBlock={updateBlock} primary={primary} setPrimary={setPrimary} />
        </aside>}
        {!preview && !rightOpen && <button title="Open properties" onClick={() => setRightOpen(true)} className="absolute right-2 top-2 z-50 rounded-lg border border-white/10 bg-[#10131a]/95 p-2 text-white/60 shadow-lg hover:text-white"><PanelRightOpen className="size-4" /></button>}
      </div>

      {contextMenu && <div className="fixed z-[200] w-48 rounded-xl border border-white/10 bg-[#14181e] p-1.5 text-xs shadow-2xl" style={{ left: contextMenu.x, top: contextMenu.y }} onPointerDown={(e) => e.stopPropagation()}>
        <ContextItem icon={<Copy />} label="Duplicate" onClick={duplicateSelected} /><ContextItem icon={<Scissors />} label="Cut" onClick={deleteSelected} /><div className="my-1 border-t border-white/10" />
        <ContextItem icon={<Send />} label="Bring to front" onClick={() => moveLayer(contextMenu.blockId, "front")} /><ContextItem icon={<Send className="rotate-180" />} label="Send to back" onClick={() => moveLayer(contextMenu.blockId, "back")} />
        <ContextItem icon={selected?.locked ? <LockOpen /> : <Lock />} label={selected?.locked ? "Unlock" : "Lock"} onClick={() => selected && updateBlock(selected.id, { locked: !selected.locked })} />
        <ContextItem icon={<Trash2 />} label="Delete" danger onClick={deleteSelected} />
      </div>}
    </div>
  );
}

function IconButton({ icon, label }: { icon: React.ReactNode; label: string }) { return <button title={label} className="rounded-md p-2 text-white/35 hover:bg-white/5 hover:text-white">{icon}</button>; }

function RailItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} title={label} className={`flex w-full flex-col items-center gap-1.5 px-1 py-3 text-[9px] transition ${active ? "text-white" : "text-white/35 hover:text-white/75"}`}><span className={`rounded-lg p-2 ${active ? "bg-[#8b5cf6]/15 text-[#b99cff]" : ""}`}>{icon}</span><span>{label}</span></button>;
}

function LayersPanel({ blocks, selectedId, onSelect }: { blocks: DemoBlock[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const groups = blocks.length ? [
    { name: "Header", children: blocks.filter((b) => b.name.toLowerCase().includes("hero") || b.name.toLowerCase().includes("title") || b.name.toLowerCase().includes("heading")) },
    { name: "Hero Section", children: blocks.filter((b) => !b.name.toLowerCase().includes("hero") && !b.name.toLowerCase().includes("title") && !b.name.toLowerCase().includes("heading") && b.y < 520) },
    { name: "Content", children: blocks.filter((b) => b.y >= 520) },
  ].filter((g) => g.children.length) : [];
  return <div className="min-h-0 flex-1 overflow-auto p-2.5">
    {groups.length ? groups.map((group) => <div key={group.name} className="mb-2"><div className="flex items-center gap-1 px-1 py-1.5 text-[10px] font-medium text-white/45"><ChevronDown className="size-3" />{group.name}<span className="ml-auto text-[9px] text-white/20">{group.children.length}</span></div>{group.children.map((b) => <button key={b.id} onClick={() => onSelect(b.id)} className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] ${selectedId === b.id ? "bg-[#8b5cf6]/15 text-[#efe9ff] ring-1 ring-[#8b5cf6]/20" : "text-white/55 hover:bg-white/5 hover:text-white"}`}><span className="text-white/25">{b.type === "heading" ? <Type className="size-3.5" /> : b.type === "button" ? <Square className="size-3.5" /> : b.type === "shape" ? <Frame className="size-3.5" /> : <GripVertical className="size-3.5" />}</span><span className="min-w-0 flex-1 truncate">{b.name}</span><span className="text-white/20">{b.locked ? <Lock className="size-3" /> : "◉"}</span></button>)}</div>) : <div className="mt-6 rounded-xl border border-dashed border-white/10 p-5 text-center"><LayersIcon className="mx-auto size-6 text-white/15" /><p className="mt-2 text-[11px] text-white/35">Your generated layers will appear here.</p></div>}
  </div>;
}

function AssetTile({ label, icon }: { label: string; icon: React.ReactNode }) { return <button className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] text-white/35 hover:border-white/20 hover:text-white/70">{icon}<span className="text-[10px]">{label}</span></button>; }

function StudioToolbar({ tool, onTool, onDuplicate, onDelete, zoom, setZoom }: { tool: Tool; onTool: (tool: Tool) => void; onDuplicate: () => void; onDelete: () => void; zoom: number; setZoom: (value: number) => void }) {
  return <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0e1116] px-2 sm:px-3">
    <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">{TOOL_ITEMS.map((item, index) => { const Icon = item.icon; return <button key={`${item.label}-${index}`} title={item.label} onClick={() => onTool(item.id)} className={`group flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[9px] ${tool === item.id ? "bg-[#8b5cf6] text-white shadow-[0_5px_18px_rgba(139,92,246,.25)]" : "text-white/45 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4" /><span>{item.label}</span></button>; })}<div className="mx-1 hidden h-7 w-px bg-white/10 md:block" /><IconButton icon={<AlignCenter className="size-4" />} label="Center" /><IconButton icon={<AlignRight className="size-4" />} label="Right" /><IconButton icon={<Plus className="size-4" />} label="Add" /><IconButton icon={<Grid3X3 className="size-4" />} label="Grid" /><IconButton icon={<MoreHorizontal className="size-4" />} label="More" /></div>
    <div className="ml-2 hidden shrink-0 items-center gap-1 border-l border-white/10 pl-2 sm:flex"><button onClick={() => setZoom(Math.max(25, zoom - 10))} className="rounded-md p-1.5 text-white/35 hover:text-white">−</button><span className="min-w-10 text-center text-[10px] text-white/55">{zoom}%</span><button onClick={() => setZoom(Math.min(150, zoom + 10))} className="rounded-md p-1.5 text-white/35 hover:text-white">+</button><ZoomIn className="ml-1 size-3.5 text-white/25" /><button onClick={onDuplicate} title="Duplicate" className="ml-1 rounded-md p-1.5 text-white/35 hover:text-white"><Copy className="size-3.5" /></button><button onClick={onDelete} title="Delete" className="rounded-md p-1.5 text-white/35 hover:text-red-300"><Trash2 className="size-3.5" /></button></div>
  </div>;
}

function InnerDesignCanvas({ blocks, selectedId, viewport, tool, onSelect, onUpdate, onContextMenu, onPointerMove, onGenerate, generating, businessName }: { blocks: DemoBlock[]; selectedId: string | null; viewport: Viewport; tool: Tool; onSelect: (id: string) => void; onUpdate: (id: string, patch: Partial<DemoBlock>) => void; onContextMenu: (event: MouseEvent<HTMLDivElement>, id: string) => void; onPointerMove: (event: PointerEvent<HTMLDivElement>, id: string) => void; onGenerate: () => void; generating: boolean; businessName: string }) {
  return <div className="relative min-h-[760px] overflow-hidden bg-[#0c1011]" style={{ width: widths[viewport] }}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(34,197,94,.10),transparent_27%),radial-gradient(circle_at_20%_90%,rgba(139,92,246,.08),transparent_25%)]" />
    {!blocks.length && <div className="absolute inset-0 z-20 flex items-center justify-center p-10"><div className="max-w-md text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/10"><WandSparkles className="size-6 text-[#a78bfa]" /></div><h2 className="mt-4 text-2xl font-semibold">Start designing {businessName}</h2><p className="mt-2 text-sm leading-6 text-white/40">Use AI Assistant to generate a complete starting website, or add text and shapes from the toolbar.</p><button onClick={onGenerate} disabled={generating} className="mt-5 rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#07110a] hover:bg-[#4ade80]">{generating ? "Generating..." : "Generate with AI"}</button></div></div>}
    {blocks.map((b, index) => <CanvasBlock key={b.id} block={b} selected={selectedId === b.id} z={index + 1} tool={tool} onSelect={onSelect} onUpdate={onUpdate} onContextMenu={onContextMenu} onPointerMove={onPointerMove} />)}
  </div>;
}

function CanvasBlock({ block, selected, z, tool, onSelect, onUpdate, onContextMenu, onPointerMove }: { block: DemoBlock; selected: boolean; z: number; tool: Tool; onSelect: (id: string) => void; onUpdate: (id: string, patch: Partial<DemoBlock>) => void; onContextMenu: (event: MouseEvent<HTMLDivElement>, id: string) => void; onPointerMove: (event: PointerEvent<HTMLDivElement>, id: string) => void }) {
  const style: CSSProperties = { position: "absolute", left: block.x, top: block.y, width: block.width, height: block.height, background: block.background, color: block.color, borderRadius: block.radius, zIndex: z, cursor: block.locked ? "not-allowed" : tool === "move" ? "move" : "pointer", boxSizing: "border-box" };
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); onSelect(block.id); };
  const inner = block.type === "heading" ? <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words text-[48px] font-bold leading-[1.05] tracking-[-.035em]">{block.text}</div> : block.type === "button" ? <div className="flex h-full w-full items-center justify-center gap-2 overflow-hidden px-5 text-sm font-semibold"><span>{block.text}</span><span>→</span></div> : block.type === "card" ? <div className="flex h-full w-full flex-col justify-between overflow-hidden p-5"><div className="flex size-9 items-center justify-center rounded-lg bg-black/5"><Square className="size-4 opacity-50" /></div><span className="text-base font-semibold">{block.text}</span></div> : block.type === "shape" ? null : <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words text-base leading-6">{block.text}</div>;
  return <div ref={(node) => { if (node) node.onpointermove = (ev) => onPointerMove(ev as unknown as PointerEvent<HTMLDivElement>, block.id); }} onPointerDown={handlePointerDown} onContextMenu={(e) => onContextMenu(e, block.id)} style={style} className={`group border ${selected ? "border-[#8b5cf6] shadow-[0_0_0_1px_rgba(139,92,246,.55),0_0_24px_rgba(139,92,246,.08)]" : "border-transparent hover:border-white/20"}`}>
    {inner}
    {selected && !block.locked && <><span className="absolute -left-1.5 -top-1.5 size-3 rounded-sm border border-white bg-[#8b5cf6]" /><span className="absolute -right-1.5 -top-1.5 size-3 rounded-sm border border-white bg-[#8b5cf6]" /><span className="absolute -bottom-1.5 -left-1.5 size-3 rounded-sm border border-white bg-[#8b5cf6]" /><span className="absolute -bottom-1.5 -right-1.5 size-3 rounded-sm border border-white bg-[#8b5cf6]" /><span className="absolute -top-6 left-0 rounded bg-[#8b5cf6] px-1.5 py-0.5 text-[9px] text-white">{block.name} · {Math.round(block.width)}×{Math.round(block.height)}</span></>}
    {selected && block.locked && <span className="absolute -right-7 top-0 rounded bg-[#101318] p-1 text-white/50"><Lock className="size-3" /></span>}
  </div>;
}

function PropertiesPanel({ selected, updateBlock, primary, setPrimary }: { selected: DemoBlock | null; updateBlock: (id: string, patch: Partial<DemoBlock>) => void; primary: string; setPrimary: (value: string) => void }) {
  if (!selected) return <div className="flex flex-1 flex-col"><div className="flex h-[48px] items-center border-b border-white/[0.07] px-4"><span className="text-xs font-semibold">Properties</span></div><div className="flex flex-1 flex-col items-center justify-center p-6 text-center"><SlidersHorizontal className="size-7 text-white/15" /><p className="mt-3 text-xs text-white/35">Select an element to edit its properties.</p></div></div>;
  const patch = (key: keyof DemoBlock, value: string | number | boolean) => updateBlock(selected.id, { [key]: value } as Partial<DemoBlock>);
  return <div className="min-h-0 flex-1 overflow-auto"><div className="flex h-[48px] items-center border-b border-white/[0.07] px-4"><div className="flex h-full items-center gap-4 text-[11px]"><span className="border-b-2 border-[#8b5cf6] py-4 font-semibold text-white">Properties</span><span className="text-white/35">Style</span><span className="text-white/35">Effects</span></div></div>
    <section className="border-b border-white/[0.07] p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] text-white/35">Element</p><p className="mt-1 text-xs font-medium">{selected.type === "heading" ? "Heading (H1)" : selected.name}</p></div><button title={selected.locked ? "Unlock" : "Lock"} onClick={() => patch("locked", !selected.locked)} className="rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-white">{selected.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}</button></div><div className="grid grid-cols-6 gap-1">{[AlignLeft, AlignCenter, AlignRight, AlignLeft, AlignCenter, AlignRight].map((I, i) => <button key={i} className="rounded-md border border-transparent p-1.5 text-white/30 hover:border-white/10 hover:text-white"><I className="mx-auto size-3.5" /></button>)}</div></section>
    <section className="border-b border-white/[0.07] p-4"><Label>Position & Size</Label><div className="mt-2 grid grid-cols-2 gap-2">{([["X", "x"], ["Y", "y"], ["W", "width"], ["H", "height"]] as const).map(([label, key]) => <label key={key} className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1.5"><span className="text-[9px] text-white/30">{label}</span><input type="number" value={Math.round(selected[key])} onChange={(e) => patch(key, Number(e.target.value))} className="w-full bg-transparent text-xs text-white outline-none" /></label>)}</div></section>
    <section className="border-b border-white/[0.07] p-4"><Label>Typography</Label><div className="mt-2 space-y-2"><div className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px]"><span>Inter</span><ChevronDown className="size-3 text-white/30" /></div><div className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px]"><span>{selected.type === "heading" ? "Bold" : "Regular"}</span><ChevronDown className="size-3 text-white/30" /></div><div className="flex items-center justify-between"><span className="text-[10px] text-white/35">Color</span><input aria-label="Text color" type="color" value={selected.color.startsWith("#") ? selected.color : "#ffffff"} onChange={(e) => patch("color", e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-white/10 bg-transparent" /></div></div></section>
    <section className="border-b border-white/[0.07] p-4"><Label>Background</Label><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-white/35">Fill</span><input aria-label="Background color" type="color" value={selected.background.startsWith("#") ? selected.background : "#151818"} onChange={(e) => patch("background", e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-white/10 bg-transparent" /></div></section>
    <section className="p-4"><Label>Border radius</Label><input type="range" min="0" max="48" value={selected.radius} onChange={(e) => patch("radius", Number(e.target.value))} className="mt-3 w-full accent-[#8b5cf6]" /><div className="mt-1 text-right text-[10px] text-white/35">{selected.radius}px</div></section>
    <section className="border-t border-white/[0.07] p-4"><Label>Brand accent</Label><div className="mt-2 flex gap-2"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-8 w-10 rounded border border-white/10 bg-transparent" /><input value={primary} onChange={(e) => setPrimary(e.target.value)} className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.025] px-2 text-xs text-white outline-none" /></div></section>
  </div>;
}

function Label({ children }: { children: React.ReactNode }) { return <div className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/38">{children}</div>; }
function ContextItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] ${danger ? "text-red-300 hover:bg-red-500/10" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>{icon}<span>{label}</span></button>; }
