import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bot, Code2, Copy, Crop, Eye, Frame, GripVertical, Image, Link2, Lock, LockOpen,
  Maximize2, Minimize2, Monitor, MousePointer2, Move, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Plus, Redo2, RefreshCw, Scissors, Send, Smartphone, Sparkles, Square, Tablet, Trash2, Type, Undo2, WandSparkles, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWithAiPrototype, refineBlock, type DemoBlock } from "@/lib/hackathon/ai-prototype";

type Viewport = "desktop" | "tablet" | "mobile";
type Tool = "select" | "move" | "frame" | "crop" | "text" | "image" | "link" | "align-left" | "align-center" | "align-right";
type ContextMenuState = { x: number; y: number; blockId: string } | null;
const widths: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const samplePrompt = "Create a modern website for a Nigerian solar and electrical company called Vicky Tech Innovations. Use green and charcoal. Include a strong hero, services, trust-building copy and a clear contact CTA.";

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
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);
  const updateBlock = (id: string, patch: Partial<DemoBlock>) => setBlocks((current) => current.map((b) => b.id === id ? { ...b, ...patch } : b));
  const addBlock = (block: DemoBlock) => { setBlocks((current) => [...current, block]); setSelectedId(block.id); setContextMenu(null); };
  const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

  const addText = () => addBlock({ id: newId("text"), type: "text", name: "Text", text: "Double-click to edit this text", x: 120, y: 160, width: 420, height: 70, background: "transparent", color: "#111827", radius: 0, locked: false });
  const addShape = () => addBlock({ id: newId("shape"), type: "shape", name: "Shape", text: "", x: 140, y: 260, width: 300, height: 160, background: "#e5e7eb", color: "#111827", radius: 16, locked: false });
  const duplicateSelected = () => { if (!selected) return; const copy = { ...selected, id: newId("copy"), name: `${selected.name} copy`, x: selected.x + 24, y: selected.y + 24 }; addBlock(copy); };
  const deleteSelected = () => { if (!selected) return; setBlocks((current) => current.filter((b) => b.id !== selected.id)); setSelectedId(null); setContextMenu(null); };
  const moveLayer = (id: string, direction: "front" | "back" | "forward" | "backward") => {
    setBlocks((current) => {
      const index = current.findIndex((b) => b.id === id);
      if (index < 0) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (direction === "front") next.push(item);
      else if (direction === "back") next.unshift(item);
      else if (direction === "forward") next.splice(Math.min(index + 1, next.length), 0, item);
      else next.splice(Math.max(index - 1, 0), 0, item);
      return next;
    });
    setSelectedId(id);
    setContextMenu(null);
  };
  const openContextMenu = (event: PointerEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(id);
    setContextMenu({ x: event.clientX, y: event.clientY, blockId: id });
  };

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
    const html = buildExportHtml(businessName, blocks);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "webeazy-site"}.html`; a.click(); URL.revokeObjectURL(url);
  };

  const toolClick = (next: Tool) => {
    setTool(next);
    if (next === "text") addText();
    if (next === "frame") addShape();
  };

  return <div className="fixed inset-0 z-[100] flex flex-col bg-[#090b10] text-white" onPointerDown={() => contextMenu && setContextMenu(null)}>
    {!immersive && <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#10131a] px-2 sm:px-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="size-4" /></Button>
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500 font-bold">W.</div>
        <div className="min-w-0"><div className="truncate text-sm font-semibold">{businessName}</div><p className="truncate text-[10px] text-white/40">WebEazy Studio · AI-assisted visual website builder</p></div>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setAiOpen((v) => !v)} className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium lg:flex ${aiOpen ? "border-violet-400/40 bg-violet-500/15 text-violet-200" : "border-white/10 bg-white/5 text-white/55"}`} title="Toggle AI assistant"><Bot className="size-3.5" />AI {aiOpen ? "On" : "Off"}</button>
        <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 md:flex">{(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => <button key={v} title={v} onClick={() => setViewport(v)} className={`rounded-md p-1.5 ${viewport === v ? "bg-white/10 text-white" : "text-white/35 hover:text-white"}`}>{v === "desktop" ? <Monitor className="size-3.5" /> : v === "tablet" ? <Tablet className="size-3.5" /> : <Smartphone className="size-3.5" />}</button>)}</div>
        <Button variant="outline" size="sm" onClick={() => setPreview((v) => !v)} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"><Eye className="mr-1.5 size-3.5" />{preview ? "Design" : "Preview"}</Button>
        <Button variant="outline" size="sm" onClick={() => setImmersive((v) => !v)} className="hidden border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">{immersive ? <Minimize2 className="mr-1.5 size-3.5" /> : <Maximize2 className="mr-1.5 size-3.5" />}{immersive ? "Exit focus" : "Focus"}</Button>
        <Button size="sm" onClick={exportHtml} disabled={!blocks.length} className="bg-white text-black hover:bg-white/90"><Code2 className="mr-1.5 size-3.5" />Export</Button>
      </div>
    </header>}

    {immersive && <button onClick={() => setImmersive(false)} title="Exit focus" className="absolute right-3 top-3 z-[120] flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#10131a]/95 px-3 py-2 text-xs font-medium text-white shadow-xl backdrop-blur hover:bg-white/10"><Minimize2 className="size-3.5" />Exit focus</button>}

    <div className="relative flex min-h-0 flex-1">
      {!preview && aiOpen && leftOpen && <aside className="hidden w-[255px] shrink-0 flex-col border-r border-white/10 bg-[#10131a] lg:flex">
        <div className="border-b border-white/10 p-3">
          <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-white/65"><Bot className="size-4 text-violet-300" />Ask WebEazy</div><button title="Collapse AI" onClick={() => setLeftOpen(false)} className="rounded-md p-1 text-white/35 hover:bg-white/5 hover:text-white"><PanelLeftClose className="size-4" /></button></div>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-28 resize-none border-white/10 bg-black/20 text-xs text-white placeholder:text-white/25" placeholder="Describe the business, style, pages and goals..." />
          <Button className="mt-2.5 w-full bg-violet-500 text-white hover:bg-violet-400" onClick={() => void generate()} disabled={generating || !prompt.trim()}>{generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <WandSparkles className="mr-2 size-4" />}{generating ? "Generating..." : blocks.length ? "Regenerate" : "Generate website"}</Button>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/35"><span>{engineMode === "remote" ? "● Live AI connected" : engineMode === "local-prototype" ? "○ Prototype fallback" : "○ AI ready"}</span><span>Human editable</span></div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"><GripVertical className="size-3.5" />Layers</div>
          {blocks.length ? <div className="space-y-1">{blocks.map((b) => <button key={b.id} onClick={() => setSelectedId(b.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${selectedId === b.id ? "bg-violet-500/20 text-violet-100" : "text-white/55 hover:bg-white/5 hover:text-white"}`}><MousePointer2 className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">{b.name}</span>{b.locked && <Lock className="size-3 text-white/35" />}</button>)}</div> : <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/35">Your layers will appear here.</div>}
        </div>
      </aside>}
      {!preview && (!aiOpen || !leftOpen) && <button title={aiOpen ? "Open AI and layers" : "Turn on AI assistant"} onClick={() => { if (!aiOpen) setAiOpen(true); else setLeftOpen(true); }} className="absolute left-2 top-2 z-50 rounded-lg border border-white/10 bg-[#10131a]/95 p-2 text-white/60 shadow-lg backdrop-blur hover:text-white">{aiOpen ? <PanelLeftOpen className="size-4" /> : <Bot className="size-4" />}</button>}

      <main className="relative min-w-0 flex-1 overflow-auto bg-[#080a0f]">
        {preview ? <PreviewWebsite blocks={blocks} businessName={businessName} /> : <div className="flex min-h-full w-full flex-col">
          <StudioToolbar tool={tool} onTool={toolClick} onDuplicate={duplicateSelected} onDelete={deleteSelected} />
          <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3 lg:p-4"><div className="relative mx-auto min-h-[700px] overflow-auto bg-white shadow-[0_20px_80px_rgba(0,0,0,.45)]" style={{ width: "100%", maxWidth: widths[viewport], height: "calc(100vh - 118px)" }}>
            <DesignCanvas blocks={blocks} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setContextMenu(null); }} onUpdate={updateBlock} onAdd={addBlock} onContextMenu={openContextMenu} onGenerate={() => void generate()} generating={generating} />
          </div></div>
        </div>}
      </main>

      {!preview && rightOpen && <aside className="hidden w-[250px] shrink-0 flex-col border-l border-white/10 bg-[#10131a] xl:flex">
        <div className="flex h-10 items-center justify-between border-b border-white/10 px-3"><div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Properties</div><button title="Collapse properties" onClick={() => setRightOpen(false)} className="rounded-md p-1 text-white/35 hover:bg-white/5 hover:text-white"><PanelRightClose className="size-4" /></button></div>
        {selected ? <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5"><div className="text-xs font-semibold">{selected.name}</div><div className="mt-1 text-[10px] uppercase tracking-wide text-white/35">{selected.type} · editable</div></div>
          {selected.type !== "shape" && <Field label="Text" value={selected.text} onChange={(text) => updateBlock(selected.id, { text })} multiline />}
          <div className="grid grid-cols-2 gap-2"><Field label="X" value={String(selected.x)} onChange={(v) => updateBlock(selected.id, { x: num(v, selected.x) })} /><Field label="Y" value={String(selected.y)} onChange={(v) => updateBlock(selected.id, { y: num(v, selected.y) })} /><Field label="Width" value={String(selected.width)} onChange={(v) => updateBlock(selected.id, { width: Math.max(50, num(v, selected.width)) })} /><Field label="Height" value={String(selected.height)} onChange={(v) => updateBlock(selected.id, { height: Math.max(30, num(v, selected.height)) })} /></div>
          <Field label="Background" value={selected.background} onChange={(v) => updateBlock(selected.id, { background: v })} /><Field label="Text colour" value={selected.color} onChange={(v) => updateBlock(selected.id, { color: v })} /><Field label="Radius" value={String(selected.radius)} onChange={(v) => updateBlock(selected.id, { radius: Math.max(0, num(v, selected.radius)) })} />
          <Button variant="outline" className="mb-4 w-full border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white" onClick={() => updateBlock(selected.id, { locked: !selected.locked })}>{selected.locked ? <LockOpen className="mr-2 size-4" /> : <Lock className="mr-2 size-4" />}{selected.locked ? "Unlock" : "Lock"}</Button>
          <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-2.5"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-100"><Sparkles className="size-4" />AI refine</div><Textarea value={refine} onChange={(e) => setRefine(e.target.value)} className="min-h-16 resize-none border-white/10 bg-black/20 text-xs text-white" /><Button size="sm" className="mt-2 w-full bg-violet-500 text-white hover:bg-violet-400" onClick={() => void refineSelected()} disabled={refining || !aiOpen}>{refining ? <RefreshCw className="mr-2 size-3.5 animate-spin" /> : <Send className="mr-2 size-3.5" />}{aiOpen ? (refining ? "Applying..." : "Apply AI") : "AI is off"}</Button></div>
        </div> : <div className="p-4 text-xs leading-relaxed text-white/35">Select an element to edit its content, position, size and appearance. Right-click any element for layer actions.</div>}
      </aside>}
      {!preview && !rightOpen && <button title="Open properties" onClick={() => setRightOpen(true)} className="absolute right-2 top-12 z-50 rounded-lg border border-white/10 bg-[#10131a]/95 p-2 text-white/60 shadow-lg backdrop-blur hover:text-white"><PanelRightOpen className="size-4" /></button>}
    </div>
    {!immersive && <footer className="flex h-7 shrink-0 items-center justify-between border-t border-white/10 bg-[#10131a] px-3 text-[10px] text-white/35"><span>{blocks.length ? `${blocks.length} elements · ${businessName}` : "Blank canvas"}</span><span className="hidden sm:inline">Visual studio · human editable · AI optional</span></footer>}

    {contextMenu && !preview && <CanvasContextMenu menu={contextMenu} block={blocks.find((b) => b.id === contextMenu.blockId) ?? null} onAction={moveLayer} onDuplicate={() => { const block = blocks.find((b) => b.id === contextMenu.blockId); if (!block) return; const copy = { ...block, id: newId("copy"), name: `${block.name} copy`, x: block.x + 24, y: block.y + 24 }; addBlock(copy); }} onDelete={() => { setBlocks((current) => current.filter((b) => b.id !== contextMenu.blockId)); setSelectedId(null); setContextMenu(null); }} onClose={() => setContextMenu(null)} />}
  </div>;
}

function StudioToolbar({ tool, onTool, onDuplicate, onDelete }: { tool: Tool; onTool: (tool: Tool) => void; onDuplicate: () => void; onDelete: () => void }) {
  const tools: { id: Tool; label: string; icon: typeof MousePointer2 }[] = [
    { id: "select", label: "Select", icon: MousePointer2 }, { id: "move", label: "Move", icon: Move }, { id: "frame", label: "Frame / shape", icon: Frame },
    { id: "crop", label: "Crop", icon: Crop }, { id: "text", label: "Text", icon: Type }, { id: "image", label: "Image", icon: Image }, { id: "link", label: "Link", icon: Link2 },
    { id: "align-left", label: "Align left", icon: AlignLeft }, { id: "align-center", label: "Align center", icon: AlignCenter }, { id: "align-right", label: "Align right", icon: AlignRight },
  ];
  return <div className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-[#10131a] px-2">
    <ToolButton label="Undo" icon={Undo2} onClick={() => {}} /><ToolButton label="Redo" icon={Redo2} onClick={() => {}} />
    <span className="mx-1 h-5 w-px bg-white/10" />
    {tools.map((item) => <ToolButton key={item.id} label={item.label} icon={item.icon} active={tool === item.id} onClick={() => onTool(item.id)} />)}
    <span className="mx-1 h-5 w-px bg-white/10" />
    <ToolButton label="Duplicate" icon={Copy} onClick={onDuplicate} /><ToolButton label="Delete" icon={Trash2} onClick={onDelete} /><ToolButton label="Zoom" icon={ZoomIn} onClick={() => {}} /><ToolButton label="Cut" icon={Scissors} onClick={() => {}} /><ToolButton label="Add element" icon={Plus} onClick={() => onTool("frame")} />
    <div className="ml-auto hidden items-center gap-1 pr-1 text-[10px] text-white/30 lg:flex"><Square className="size-3" />Canvas tools</div>
  </div>;
}

function ToolButton({ label, icon: Icon, onClick, active }: { label: string; icon: typeof MousePointer2; onClick: () => void; active?: boolean }) {
  return <button title={label} aria-label={label} onClick={onClick} className={`flex size-8 shrink-0 items-center justify-center rounded-md transition ${active ? "bg-violet-500/20 text-violet-200" : "text-white/45 hover:bg-white/5 hover:text-white"}`}><Icon className="size-3.5" /></button>;
}

function DesignCanvas({ blocks, selectedId, onSelect, onUpdate, onAdd, onContextMenu, onGenerate, generating }: { blocks: DemoBlock[]; selectedId: string | null; onSelect: (id: string) => void; onUpdate: (id: string, patch: Partial<DemoBlock>) => void; onAdd: (block: DemoBlock) => void; onContextMenu: (event: PointerEvent<HTMLDivElement>, id: string) => void; onGenerate: () => void; generating: boolean }) {
  const addEmptyShape = () => onAdd({ id: `shape-${Math.random().toString(36).slice(2, 9)}`, type: "shape", name: "Shape", text: "", x: 180, y: 180, width: 300, height: 160, background: "#e5e7eb", color: "#111827", radius: 16, locked: false });
  return <div className="relative min-h-full w-full bg-white" onContextMenu={(e) => e.preventDefault()}>
    {blocks.length === 0 ? <div className="flex min-h-[700px] items-center justify-center p-8 text-center text-slate-900"><div className="max-w-md"><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Sparkles className="size-6" /></div><h2 className="text-xl font-bold">Start designing</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Create freely with the toolbar, or turn on AI and generate a first draft.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={addEmptyShape}><Square className="mr-2 size-4" />Add shape</Button><Button className="bg-violet-600 text-white hover:bg-violet-500" onClick={onGenerate} disabled={generating}>{generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <WandSparkles className="mr-2 size-4" />}Generate with AI</Button></div></div></div> : blocks.map((b, index) => <CanvasBlock key={b.id} block={b} layerIndex={index} selected={selectedId === b.id} onSelect={() => onSelect(b.id)} onUpdate={(p) => onUpdate(b.id, p)} onContextMenu={onContextMenu} />)}
  </div>;
}

function CanvasBlock({ block, layerIndex, selected, onSelect, onUpdate, onContextMenu }: { block: DemoBlock; layerIndex: number; selected: boolean; onSelect: () => void; onUpdate: (patch: Partial<DemoBlock>) => void; onContextMenu: (event: PointerEvent<HTMLDivElement>, id: string) => void }) {
  const drag = useRef<{ cx: number; cy: number; x: number; y: number } | null>(null);
  const resize = useRef<{ cx: number; cy: number; w: number; h: number } | null>(null);
  const style: CSSProperties = { position: "absolute", left: block.x, top: block.y, width: block.width, height: block.height, background: block.background, color: block.color, borderRadius: block.radius, zIndex: layerIndex + 10 };
  const down = (e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); onSelect(); if (block.locked) return; drag.current = { cx: e.clientX, cy: e.clientY, x: block.x, y: block.y }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (!drag.current || block.locked) return; onUpdate({ x: Math.max(0, Math.round(drag.current.x + e.clientX - drag.current.cx)), y: Math.max(0, Math.round(drag.current.y + e.clientY - drag.current.cy)) }); };
  const resizeDown = (e: PointerEvent<HTMLDivElement>) => { if (block.locked) return; e.stopPropagation(); resize.current = { cx: e.clientX, cy: e.clientY, w: block.width, h: block.height }; e.currentTarget.setPointerCapture(e.pointerId); };
  const resizeMove = (e: PointerEvent<HTMLDivElement>) => { if (!resize.current || block.locked) return; onUpdate({ width: Math.max(60, Math.round(resize.current.w + e.clientX - resize.current.cx)), height: Math.max(32, Math.round(resize.current.h + e.clientY - resize.current.cy)) }); };
  const cls = block.type === "heading" ? "px-2 text-5xl font-black leading-none tracking-tight" : block.type === "text" ? "px-2 text-lg leading-relaxed" : block.type === "button" ? "justify-center px-5 text-sm font-semibold shadow-lg" : block.type === "card" ? "border border-slate-200 px-6 text-xl font-bold shadow-sm" : "";
  return <div style={style} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onContextMenu={(e) => onContextMenu(e, block.id)} className={`group flex touch-none select-none items-center overflow-hidden ${cls} ${selected ? "outline outline-2 outline-violet-500 outline-offset-2" : ""} ${block.locked ? "cursor-not-allowed" : "cursor-move"}`}>{block.type !== "shape" && <span contentEditable={!block.locked} suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onBlur={(e) => onUpdate({ text: e.currentTarget.textContent || "" })} className="w-full outline-none">{block.text}</span>}{block.locked && <Lock className="pointer-events-none absolute right-2 top-2 size-3 opacity-50" />}{selected && !block.locked && <div onPointerDown={resizeDown} onPointerMove={resizeMove} onPointerUp={() => { resize.current = null; }} className="absolute bottom-0 right-0 size-4 cursor-se-resize rounded-tl-md border-l border-t border-violet-500 bg-white" />}</div>;
}

function CanvasContextMenu({ menu, block, onAction, onDuplicate, onDelete, onClose }: { menu: { x: number; y: number; blockId: string }; block: DemoBlock | null; onAction: (id: string, direction: "front" | "back" | "forward" | "backward") => void; onDuplicate: () => void; onDelete: () => void; onClose: () => void }) {
  if (!block) return null;
  const items = [
    { label: "Bring to front", action: () => onAction(block.id, "front") },
    { label: "Bring forward", action: () => onAction(block.id, "forward") },
    { label: "Send backward", action: () => onAction(block.id, "backward") },
    { label: "Send to back", action: () => onAction(block.id, "back") },
  ];
  return <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "fixed", left: Math.min(menu.x, window.innerWidth - 210), top: Math.min(menu.y, window.innerHeight - 260), zIndex: 200 }} className="w-52 overflow-hidden rounded-xl border border-white/10 bg-[#10131a] p-1.5 text-white shadow-2xl backdrop-blur-xl">
    <div className="border-b border-white/10 px-2.5 py-2"><div className="text-xs font-semibold">{block.name}</div><div className="text-[9px] uppercase tracking-wider text-white/35">WebEazy canvas</div></div>
    {items.map((item) => <button key={item.label} onClick={item.action} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/75 hover:bg-violet-500/15 hover:text-white"><span>{item.label}</span></button>)}
    <div className="my-1 h-px bg-white/10" />
    <button onClick={onDuplicate} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/75 hover:bg-white/5 hover:text-white">Duplicate</button>
    <button onClick={onDelete} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-red-300 hover:bg-red-500/10">Delete</button>
    <button onClick={onClose} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/40 hover:bg-white/5 hover:text-white">Cancel</button>
  </div>;
}

function PreviewWebsite({ blocks, businessName }: { blocks: DemoBlock[]; businessName: string }) {
  if (!blocks.length) return <div className="flex min-h-full items-center justify-center bg-white text-sm text-slate-400">Generate or add elements before previewing.</div>;
  const heading = blocks.find((b) => b.type === "heading")?.text ?? businessName;
  const heroCopy = blocks.find((b) => b.name === "Hero copy")?.text ?? "A better way to move your business forward.";
  const heroButton = blocks.find((b) => b.name === "Primary CTA");
  const about = blocks.find((b) => b.name === "About copy")?.text;
  const cards = blocks.filter((b) => b.type === "card");
  const dark = blocks.find((b) => b.name === "Hero background")?.background ?? "#111827";
  const primary = heroButton?.background ?? "#6d5dfc";
  return <div className="min-h-full w-full bg-white text-slate-900"><section className="min-h-[58vh] px-[7vw] py-[14vh]" style={{ background: dark, color: "white" }}><div className="mx-auto max-w-6xl"><div className="mb-5 inline-flex rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Designed in WebEazy</div><h1 className="max-w-6xl text-5xl font-black tracking-tight md:text-8xl">{heading}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/65 md:text-2xl">{heroCopy}</p>{heroButton && <button className="mt-9 rounded-xl px-7 py-3.5 text-sm font-semibold text-white" style={{ background: primary }}>{heroButton.text}</button>}</div></section><section className="px-[7vw] py-[10vh]"><div className="mx-auto max-w-6xl">{about && <p className="max-w-5xl text-2xl font-medium leading-relaxed text-slate-700 md:text-4xl">{about}</p>}<div className="mt-12 grid gap-5 md:grid-cols-3">{cards.map((c, i) => <div key={c.id} className="rounded-2xl border border-slate-200 p-7"><div className="mb-10 text-xs font-semibold" style={{ color: primary }}>0{i + 1}</div><h3 className="text-xl font-bold">{c.text}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">Flexible, customer-focused service designed around real business needs.</p></div>)}</div></div></section></div>;
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return <label className="mb-2.5 block"><span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-white/35">{label}</span>{multiline ? <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-16 resize-none border-white/10 bg-black/20 text-xs text-white" /> : <input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded-md border border-white/10 bg-black/20 px-2 text-[11px] text-white outline-none focus:border-violet-400/50" />}</label>; }
function num(v: string, fallback: number) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function buildExportHtml(name: string, blocks: DemoBlock[]) { const heading = blocks.find((b) => b.type === "heading")?.text ?? name, hero = blocks.find((b) => b.name === "Hero copy")?.text ?? "Built for your business.", about = blocks.find((b) => b.name === "About copy")?.text ?? "", button = blocks.find((b) => b.name === "Primary CTA"), cards = blocks.filter((b) => b.type === "card"), dark = blocks.find((b) => b.name === "Hero background")?.background ?? "#111827", primary = button?.background ?? "#6d5dfc"; const esc = (v: string) => v.replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c)); return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(name)}</title><style>body{margin:0;font-family:Inter,Arial,sans-serif;color:#0f172a}*{box-sizing:border-box}.hero{padding:110px 8%;background:${dark};color:#fff}.hero h1{font-size:clamp(48px,8vw,96px);line-height:.95;margin:0}.hero p{font-size:20px;line-height:1.6;max-width:700px;color:#cbd5e1}.btn{display:inline-block;margin-top:24px;background:${primary};color:#fff;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700}.content{padding:80px 8%}.intro{font-size:clamp(24px,4vw,42px);line-height:1.35;max-width:1000px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:48px}.card{border:1px solid #e2e8f0;border-radius:18px;padding:28px}.card h3{margin:0;font-size:22px}</style></head><body><section class="hero"><h1>${esc(heading)}</h1><p>${esc(hero)}</p>${button ? `<a class="btn" href="#contact">${esc(button.text)}</a>` : ""}</section><section class="content"><div class="intro">${esc(about)}</div><div class="cards">${cards.map((c) => `<div class="card"><h3>${esc(c.text)}</h3></div>`).join("")}</div></section></body></html>`; }
