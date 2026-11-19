import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  Bot, ChevronDown, Code2, Copy, Crop, Eye, FolderOpen, Frame, Grid3X3,
  Image as ImageIcon, Layers3, LayoutTemplate, Link2, Lock, LockOpen, Menu,
  Monitor, Move, MousePointer2, PanelLeftClose, PanelLeftOpen, Plus, Redo2,
  RotateCcw, Save, Search, Settings2, Share2, Smartphone, Sparkles, Square,
  Tablet, Trash2, Type, Undo2, Upload, WandSparkles, ZoomIn, ZoomOut, Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWithAiPrototype, refineBlock, type DemoBlock } from "@/lib/hackathon/ai-prototype";
import { buildGeneratedSiteExportHtml, GeneratedSitePreview } from "./GeneratedSitePreview";

type Viewport = "desktop" | "tablet" | "mobile";
type LeftTab = "layers" | "sections" | "pages" | "assets" | "ai";
type RightTab = "properties" | "style" | "effects";

const viewportWidth: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const starterBlocks = (name: string): DemoBlock[] => [
  { id: "nav", type: "shape", name: "Navigation", text: "", x: 90, y: 44, width: 940, height: 72, background: "#101a13", color: "#f5f5e6", radius: 16, locked: false, shadow: false },
  { id: "nav-logo", type: "text", name: "Logo", text: "W  WebEazy", x: 118, y: 64, width: 180, height: 32, background: "transparent", color: "#f5f5e6", radius: 0, locked: false, fontSize: 16, fontWeight: 700 },
  { id: "nav-links", type: "text", name: "Navigation links", text: "Home       Features       About       Contact", x: 430, y: 68, width: 360, height: 28, background: "transparent", color: "#b7c2ba", radius: 0, locked: false, fontSize: 12 },
  { id: "nav-cta", type: "button", name: "Navigation CTA", text: "Get Started", x: 875, y: 58, width: 126, height: 42, background: "#19c65b", color: "#07110a", radius: 21, locked: false, fontWeight: 800 },
  { id: "eyebrow", type: "text", name: "Eyebrow", text: "●  BUILD · DESIGN · LAUNCH", x: 132, y: 168, width: 300, height: 28, background: "transparent", color: "#19c65b", radius: 0, locked: false, fontSize: 11, fontWeight: 700 },
  { id: "hero", type: "heading", name: "Hero heading", text: "Turn Your Ideas\nInto Real Websites", x: 132, y: 218, width: 620, height: 150, background: "transparent", color: "#f5f5e6", radius: 0, locked: false, fontSize: 48, fontWeight: 800, lineHeight: 1.02 } as DemoBlock,
  { id: "copy", type: "text", name: "Hero copy", text: "WebEazy is your all-in-one platform for designing, creating and launching beautiful websites — faster, easier and smarter.", x: 132, y: 390, width: 520, height: 90, background: "transparent", color: "#99a79e", radius: 0, locked: false, fontSize: 15, lineHeight: 1.65 } as DemoBlock,
  { id: "primary", type: "button", name: "Primary CTA", text: "Start Creating  →", x: 132, y: 500, width: 180, height: 52, background: "#19c65b", color: "#07110a", radius: 26, locked: false, fontWeight: 800 },
  { id: "secondary", type: "button", name: "Secondary CTA", text: "▶  Watch Demo", x: 324, y: 500, width: 168, height: 52, background: "#101912", color: "#f5f5e6", radius: 26, locked: false, border: "1px solid rgba(174,223,188,.18)" },
];

export function HackathonStudio({ onClose, initialBusinessName = "Untitled project" }: { onClose: () => void; initialBusinessName?: string }) {
  const [blocks, setBlocks] = useState<DemoBlock[]>(starterBlocks(initialBusinessName));
  const [selectedId, setSelectedId] = useState<string>("hero");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<LeftTab>("sections");
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [tool, setTool] = useState<"select" | "move" | "text" | "shape" | "image" | "link">("select");
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [savedAt, setSavedAt] = useState("Saved");
  const [history, setHistory] = useState<DemoBlock[][]>([]);
  const [future, setFuture] = useState<DemoBlock[][]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [prompt, setPrompt] = useState("Create a premium green SaaS landing page");
  const [generating, setGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const storageKey = `webeazy-project:${initialBusinessName}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as { blocks: DemoBlock[]; businessName: string; savedAt: string } | null;
      if (saved?.blocks?.length) {
        setBlocks(saved.blocks);
        setBusinessName(saved.businessName || initialBusinessName);
        setSavedAt(saved.savedAt || "Saved");
      }
    } catch {
      setSavedAt("Restore failed");
    }
  }, [storageKey, initialBusinessName]);

  const selected = useMemo(() => blocks.find((block) => block.id === selectedId) || null, [blocks, selectedId]);

  const commit = (next: DemoBlock[], label?: string) => {
    setHistory((items) => [...items.slice(-29), blocks]);
    setFuture([]);
    setBlocks(next);
  };
  const update = (id: string, patch: Partial<DemoBlock>) => commit(blocks.map((block) => block.id === id ? { ...block, ...patch } : block));
  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setFuture((items) => [blocks, ...items]);
    setHistory((items) => items.slice(0, -1));
    setBlocks(previous);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((items) => [...items, blocks]);
    setFuture((items) => items.slice(1));
    setBlocks(next);
  };
  const saveProject = () => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    localStorage.setItem(storageKey, JSON.stringify({ blocks, businessName, savedAt: time }));
    setSavedAt(time);
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
    const copy = { ...selected, id: uid("copy"), name: `${selected.name} copy`, x: selected.x + 24, y: selected.y + 24 };
    commit([...blocks, copy]);
    setSelectedId(copy.id);
  };
  const removeSelected = () => {
    if (!selected) return;
    commit(blocks.filter((block) => block.id !== selected.id));
    setSelectedId("");
  };
  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return;
    const index = blocks.findIndex((block) => block.id === selected.id);
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commit(next);
  };

  const addBlock = (block: DemoBlock) => {
    commit([...blocks, block]);
    setSelectedId(block.id);
  };
  const addText = () => addBlock({ id: uid("text"), type: "text", name: "Text", text: "Double-click to edit this text", x: 180, y: 220, width: 420, height: 70, background: "transparent", color: "#f5f5e6", radius: 0, locked: false, fontSize: 16 });
  const addShape = () => addBlock({ id: uid("shape"), type: "shape", name: "Shape", text: "", x: 180, y: 260, width: 300, height: 160, background: "#17231b", color: "#f5f5e6", radius: 16, locked: false, border: "1px solid rgba(174,223,188,.14)" });
  const addSection = (kind: string) => {
    const y = blocks.length ? Math.max(...blocks.map((block) => block.y + block.height)) + 32 : 160;
    const sectionMap: Record<string, Partial<DemoBlock>> = {
      Hero: { type: "heading", text: "Turn Your Ideas Into Real Websites", width: 620, height: 120, fontSize: 48, fontWeight: 800 },
      About: { type: "text", text: "We help ambitious teams turn ideas into clear, useful digital experiences.", width: 760, height: 100, background: "#101912", fontSize: 18, padding: 24, radius: 18 },
      Services: { type: "card", text: "Design  ·  Development  ·  Launch", width: 760, height: 180, background: "#17231b", fontSize: 20, padding: 24, radius: 20 },
      Features: { type: "card", text: "Fast  ·  Flexible  ·  Responsive", width: 760, height: 180, background: "#17231b", fontSize: 20, padding: 24, radius: 20 },
      Testimonials: { type: "text", text: "“WebEazy made our launch feel effortless.”", width: 760, height: 120, background: "#101912", fontSize: 18, padding: 24, radius: 18 },
      Gallery: { type: "shape", text: "", width: 760, height: 220, background: "#17231b", radius: 18 },
      Pricing: { type: "card", text: "Simple pricing · Start from $0", width: 760, height: 180, background: "#17231b", fontSize: 20, padding: 24, radius: 20 },
      Statistics: { type: "card", text: "98%     2×     24/7", width: 760, height: 150, background: "#17231b", fontSize: 24, padding: 24, radius: 20 },
      Contact: { type: "button", text: "Start a conversation", width: 260, height: 56, background: "#19c65b", color: "#07110a", radius: 28, fontWeight: 800 },
      CTA: { type: "button", text: "Get started  →", width: 220, height: 56, background: "#19c65b", color: "#07110a", radius: 28, fontWeight: 800 },
      Footer: { type: "text", text: "© 2026 WebEazy · Built with care", width: 760, height: 80, background: "#101912", fontSize: 12, padding: 24, radius: 12 },
    };
    const preset = sectionMap[kind] || sectionMap.Hero;
    addBlock({ id: uid("section"), type: preset.type || "text", name: `${kind} section`, text: preset.text || "", x: kind === "Hero" ? 132 : 180, y, width: preset.width || 760, height: preset.height || 180, background: preset.background || "transparent", color: preset.color || "#f5f5e6", radius: preset.radius || 0, locked: false, fontSize: preset.fontSize, fontWeight: preset.fontWeight, padding: preset.padding, border: preset.border });
  };
  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateWithAiPrototype(prompt);
      commit(result.blocks);
      setBusinessName(result.businessName);
      setSelectedId(result.blocks.find((block) => block.type === "heading")?.id || result.blocks[0]?.id || "");
    } finally {
      setGenerating(false);
    }
  };
  const uploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => addBlock({ id: uid("image"), type: "image", name: file.name, text: "", x: 180, y: 220, width: 420, height: 280, background: "#101912", color: "#fff", radius: 16, locked: false, src: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const share = async () => {
    const shareData = { title: businessName, text: "WebEazy workspace project" };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  const align = (direction: "left" | "center" | "right") => {
    if (!selected) return;
    const x = direction === "left" ? 40 : direction === "center" ? (viewportWidth[viewport] - selected.width) / 2 : viewportWidth[viewport] - selected.width - 40;
    update(selected.id, { x: Math.max(0, x), textAlign: direction });
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
    const parent = event.currentTarget.parentElement?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const scale = rect.width / viewportWidth[viewport];
    setBlocks((items) => items.map((item) => item.id === block.id ? { ...item, x: Math.max(0, (event.clientX - rect.left) / scale - item.width / 2), y: Math.max(0, (event.clientY - rect.top) / scale - item.height / 2) } : item));
  };

  const toolbarTools: Array<{ id: typeof tool; label: string; icon: ReactNode }> = [
    { id: "select", label: "Select", icon: <MousePointer2 /> },
    { id: "move", label: "Move", icon: <Move /> },
    { id: "shape", label: "Frame", icon: <Frame /> },
    { id: "text", label: "Text", icon: <Type /> },
    { id: "shape", label: "Shape", icon: <Square /> },
    { id: "image", label: "Image", icon: <ImageIcon /> },
  ];

  return (
    <div className="webeazy-studio" onPointerDown={() => context && setContext(null)}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file); event.currentTarget.value = ""; }} />
      <header className="studio-topbar">
        <div className="studio-brand">
          <button className="studio-icon-button" onClick={onClose} title="Back"><ArrowLeft /></button>
          <div className="studio-logo"><span>W</span></div>
          <button className="studio-project-name" onClick={() => setSettingsOpen((value) => !value)}>{businessName}<ChevronDown /></button>
          <div className="studio-save"><span />Saved {savedAt}</div>
        </div>
        <div className="studio-history">
          <button disabled={!history.length} onClick={undo} title="Undo"><Undo2 /></button>
          <button disabled={!future.length} onClick={redo} title="Redo"><Redo2 /></button>
          <span />
          <button onClick={() => setGridVisible((value) => !value)} title="Toggle grid" className={gridVisible ? "active" : ""}><Grid3X3 /></button>
        </div>
        <div className="studio-actions">
          <button className="studio-ai-button" onClick={() => setLeftTab("ai")}><Bot />AI Assistant<span /></button>
          <button className="studio-share" onClick={share}><Share2 />Share</button>
          <button onClick={() => setPreview((value) => !value)} className="studio-preview"><Eye />{preview ? "Design" : "Preview"}</button>
          <button onClick={exportHtml} disabled={!blocks.length} className="studio-export"><Code2 />Export</button>
          <button className="studio-avatar" title="Account">G</button>
        </div>
        {settingsOpen && <div className="studio-settings-popover"><div><b>Project settings</b><button onClick={() => setSettingsOpen(false)}>×</button></div><label>Project name<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label><button onClick={saveProject}><Save />Save project</button></div>}
      </header>

      <div className="studio-shell">
        <aside className="studio-left">
          <nav className="studio-left-rail">
            <button className={leftTab === "layers" ? "active" : ""} onClick={() => { setLeftOpen(true); setLeftTab("layers"); }} title="Layers"><Layers3 /><span>Layers</span></button>
            <button className={leftTab === "sections" ? "active" : ""} onClick={() => { setLeftOpen(true); setLeftTab("sections"); }} title="Sections"><LayoutTemplate /><span>Sections</span></button>
            <button className={leftTab === "pages" ? "active" : ""} onClick={() => { setLeftOpen(true); setLeftTab("pages"); }} title="Pages"><FolderOpen /><span>Pages</span></button>
            <button className={leftTab === "assets" ? "active" : ""} onClick={() => { setLeftOpen(true); setLeftTab("assets"); }} title="Assets"><ImageIcon /><span>Assets</span></button>
            <button className={leftTab === "ai" ? "active" : ""} onClick={() => { setLeftOpen(true); setLeftTab("ai"); }} title="AI"><Bot /><span>AI</span></button>
          </nav>
          {leftOpen && <div className="studio-left-content"><div className="studio-panel-heading"><b>{leftTab === "ai" ? "AI Assistant" : leftTab[0].toUpperCase() + leftTab.slice(1)}</b><button onClick={() => setLeftOpen(false)}><PanelLeftClose /></button></div>
            {leftTab === "layers" && <div className="studio-layer-tree">{blocks.length ? blocks.map((block) => <button key={block.id} className={selectedId === block.id ? "selected" : ""} onClick={() => setSelectedId(block.id)}><GripIcon /><span>{block.name}</span>{block.locked && <Lock />}</button>) : <div className="studio-empty">No elements yet</div>}</div>}
            {leftTab === "sections" && <div className="studio-section-library">{["Hero", "About", "Services", "Features", "Testimonials", "Gallery", "Pricing", "Statistics", "Contact", "CTA", "Footer"].map((section) => <button key={section} onClick={() => addSection(section)}><div><i /><i /><i /></div><span>{section}<Plus /></span></button>)}</div>}
            {leftTab === "pages" && <div className="studio-pages"><button className="selected"><LayoutTemplate /><span><b>Home</b><small>/</small></span></button><button onClick={() => addSection("Hero")}><Plus /><span>Add page</span></button></div>}
            {leftTab === "assets" && <div className="studio-assets"><div className="studio-search"><Search /><input placeholder="Search assets" /></div><button onClick={() => inputRef.current?.click()}><Upload /><b>Upload image</b><small>PNG, JPG or SVG</small></button></div>}
            {leftTab === "ai" && <div className="studio-ai-panel"><div><WandSparkles /><b>Describe a layout</b></div><Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /><button onClick={generate} disabled={generating}>{generating ? "Generating..." : "Generate layout"}<Sparkles /></button></div>}
          </div>}
        </aside>

        <main className="studio-main">
          {!preview && <div className="studio-toolbox">
            {toolbarTools.map((item, index) => <button key={`${item.label}-${index}`} title={item.label} className={item.label === "Select" || item.label === "Move" || item.label === "Text" || item.label === "Shape" || item.label === "Image" && tool === item.id ? "active" : ""} onClick={() => { setTool(item.id); if (item.label === "Text") addText(); if (item.label === "Shape") addShape(); if (item.label === "Image") inputRef.current?.click(); }}><span>{item.icon}</span><small>{item.label}</small></button>)}
            <i />
            <button title="Align left" onClick={() => align("left")}><span><AlignLeft /></span><small>Align</small></button>
            <button title="Align center" onClick={() => align("center")}><span><AlignCenter /></span><small>Center</small></button>
            <button title="Align right" onClick={() => align("right")}><span><AlignRight /></span><small>Right</small></button>
            <i />
            <button title="Duplicate" onClick={duplicate} disabled={!selected}><span><Copy /></span><small>Copy</small></button>
            <button title="Delete" onClick={removeSelected} disabled={!selected}><span><Trash2 /></span><small>Delete</small></button>
          </div>}
          {preview ? <GeneratedSitePreview blocks={blocks} businessName={businessName} viewport={viewport} onBack={() => setPreview(false)} /> : <div className="studio-canvas-area">
            <div className="studio-viewport-bar">
              {(["desktop", "tablet", "mobile"] as Viewport[]).map((value) => <button key={value} className={viewport === value ? "active" : ""} title={value} onClick={() => setViewport(value)}>{value === "desktop" ? <Monitor /> : value === "tablet" ? <Tablet /> : <Smartphone />}</button>)}
              <span />
              <button onClick={() => setZoom((value) => Math.max(25, value - 10))}><ZoomOut /></button>
              <b>{zoom}%</b>
              <button onClick={() => setZoom((value) => Math.min(150, value + 10))}><ZoomIn /></button>
            </div>
            <div className="studio-scroll">
              <div className="studio-rulers"><div className="ruler-x" /><div className="ruler-y" /></div>
              <div className={`studio-artboard ${gridVisible ? "grid" : ""}`} style={{ width: viewportWidth[viewport] * zoom / 100, minHeight: 760 * zoom / 100 }}>
                <div className="studio-artboard-inner" style={{ width: viewportWidth[viewport], minHeight: 760, transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
                  {blocks.map((block, index) => <CanvasBlock key={block.id} block={block} index={index} selected={selectedId === block.id} tool={tool} onSelect={setSelectedId} onContext={(event) => { event.preventDefault(); event.stopPropagation(); setSelectedId(block.id); setContext({ x: event.clientX, y: event.clientY }); }} onDragStart={startDrag} onDragMove={moveBlock} onDragEnd={() => setDragId(null)} />)}
                </div>
              </div>
            </div>
          </div>}
        </main>

        {!preview && <aside className="studio-right">
          <div className="studio-right-tabs">
            {(["properties", "style", "effects"] as RightTab[]).map((tab) => <button key={tab} className={rightTab === tab ? "active" : ""} onClick={() => setRightTab(tab)}>{tab}</button>)}
          </div>
          {rightTab === "properties" && <PropertiesPanel selected={selected} update={update} moveSelected={moveSelected} />}
          {rightTab === "style" && <StylePanel selected={selected} update={update} />}
          {rightTab === "effects" && <EffectsPanel selected={selected} update={update} />}
        </aside>}
      </div>
      {context && selected && <div className="studio-context" style={{ left: context.x, top: context.y }} onPointerDown={(event) => event.stopPropagation()}><button onClick={duplicate}><Copy />Duplicate</button><button onClick={removeSelected} className="danger"><Scissors />Delete</button><button onClick={() => update(selected.id, { locked: !selected.locked })}>{selected.locked ? <LockOpen /> : <Lock />}{selected.locked ? "Unlock" : "Lock"}</button></div>}
    </div>
  );
}

function GripIcon() { return <span className="grip">⋮⋮</span>; }

function CanvasBlock({ block, index, selected, tool, onSelect, onContext, onDragStart, onDragMove, onDragEnd }: { block: DemoBlock; index: number; selected: boolean; tool: string; onSelect: (id: string) => void; onContext: (event: MouseEvent<HTMLDivElement>) => void; onDragStart: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void; onDragMove: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void; onDragEnd: () => void }) {
  const style: CSSProperties = { position: "absolute", left: block.x, top: block.y, width: block.width, height: block.height, background: block.background, color: block.color, borderRadius: block.radius, border: block.border, boxSizing: "border-box", zIndex: index + 1, padding: block.padding ?? (block.type === "card" ? 20 : 0), textAlign: block.textAlign || "left", fontSize: block.fontSize || (block.type === "heading" ? 48 : 14), fontWeight: block.fontWeight || (block.type === "heading" ? 800 : 400), lineHeight: (block as DemoBlock & { lineHeight?: number }).lineHeight || 1.45, boxShadow: block.shadow ? "0 20px 50px rgba(0,0,0,.35)" : undefined, cursor: block.locked ? "not-allowed" : tool === "move" ? "grab" : "default", overflow: "hidden" };
  const content = block.type === "image" && block.src ? <img src={block.src} alt={block.name} /> : block.type === "shape" ? null : <span>{block.text}</span>;
  return <div className={`studio-canvas-block ${selected ? "selected" : ""}`} style={style} onPointerDown={(event) => { event.stopPropagation(); if (tool === "move") onDragStart(event, block); else onSelect(block.id); }} onPointerMove={(event) => onDragMove(event, block)} onPointerUp={onDragEnd} onContextMenu={onContext} onDoubleClick={() => onSelect(block.id)}>{content}{selected && !block.locked && <><i className="handle nw" /><i className="handle ne" /><i className="handle sw" /><i className="handle se" /></>}</div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="studio-number-field"><span>{label}</span><input type="number" value={Math.round(value)} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
function PropertiesPanel({ selected, update, moveSelected }: { selected: DemoBlock | null; update: (id: string, patch: Partial<DemoBlock>) => void; moveSelected: (direction: -1 | 1) => void }) {
  if (!selected) return <div className="studio-empty-inspector">Select an element</div>;
  const patch = (key: keyof DemoBlock, value: unknown) => update(selected.id, { [key]: value } as Partial<DemoBlock>);
  return <div className="studio-inspector">
    <section className="studio-element-name"><div><small>ELEMENT</small><b>{selected.name}</b></div><button onClick={() => patch("locked", !selected.locked)}>{selected.locked ? <LockOpen /> : <Lock />}</button></section>
    {selected.type !== "shape" && selected.type !== "image" && <section><label className="studio-text-field"><small>CONTENT</small><Textarea value={selected.text} onChange={(event) => patch("text", event.target.value)} /></label></section>}
    <section><h3>Position & Size</h3><div className="studio-number-grid"><NumberField label="X" value={selected.x} onChange={(value) => patch("x", value)} /><NumberField label="Y" value={selected.y} onChange={(value) => patch("y", value)} /><NumberField label="W" value={selected.width} onChange={(value) => patch("width", value)} /><NumberField label="H" value={selected.height} onChange={(value) => patch("height", value)} /></div></section>
    <section><h3>Constraints</h3><div className="studio-constraint"><button><span>↦</span>Left</button><button><span>↥</span>Top</button></div></section>
    <section><h3>Layer order</h3><div className="studio-layer-actions"><button onClick={() => moveSelected(-1)}><ArrowUp />Up</button><button onClick={() => moveSelected(1)}><ArrowDown />Down</button></div></section>
  </div>;
}
function StylePanel({ selected, update }: { selected: DemoBlock | null; update: (id: string, patch: Partial<DemoBlock>) => void }) {
  if (!selected) return <div className="studio-empty-inspector">Select an element</div>;
  const patch = (key: keyof DemoBlock, value: unknown) => update(selected.id, { [key]: value } as Partial<DemoBlock>);
  return <div className="studio-inspector"><section><h3>Fill</h3><label className="studio-color-field"><span style={{ background: selected.background }} /><input type="color" value={selected.background.startsWith("#") ? selected.background : "#101912"} onChange={(event) => patch("background", event.target.value)} /><b>{selected.background}</b></label></section><section><h3>Typography</h3><div className="studio-select-row"><button onClick={() => patch("fontWeight", selected.fontWeight === 800 ? 400 : 800)}>Bold</button><button onClick={() => patch("textAlign", "left")}><AlignLeft /></button><button onClick={() => patch("textAlign", "center")}><AlignCenter /></button><button onClick={() => patch("textAlign", "right")}><AlignRight /></button></div><NumberField label="Size" value={selected.fontSize || 16} onChange={(value) => patch("fontSize", value)} /></section><section><h3>Text color</h3><label className="studio-color-field"><span style={{ background: selected.color }} /><input type="color" value={selected.color.startsWith("#") ? selected.color : "#f5f5e6"} onChange={(event) => patch("color", event.target.value)} /><b>{selected.color}</b></label></section><section><h3>Corner radius</h3><input className="studio-range" type="range" min="0" max="48" value={selected.radius} onChange={(event) => patch("radius", Number(event.target.value))} /><b className="studio-range-value">{selected.radius}px</b></section></div>;
}
function EffectsPanel({ selected, update }: { selected: DemoBlock | null; update: (id: string, patch: Partial<DemoBlock>) => void }) {
  if (!selected) return <div className="studio-empty-inspector">Select an element</div>;
  return <div className="studio-inspector"><section><h3>Shadow</h3><button className={`studio-toggle ${selected.shadow ? "active" : ""}`} onClick={() => update(selected.id, { shadow: !selected.shadow })}><span /></button></section><section><h3>Border</h3><label className="studio-border-field"><input value={selected.border || "None"} onChange={(event) => update(selected.id, { border: event.target.value })} /></label></section><section><h3>Opacity</h3><input className="studio-range" type="range" min="0" max="100" defaultValue="100" /><b className="studio-range-value">100%</b></section></div>;
}
