import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ChevronDown,
  Code2,
  Copy,
  Eye,
  Frame,
  GripVertical,
  Image as ImageIcon,
  Layers as LayersIcon,
  Link2,
  Lock,
  LockOpen,
  Monitor,
  Plus,
  RefreshCw,
  Scissors,
  Smartphone,
  Sparkles,
  Square,
  Circle,
  Minus,
  Tablet,
  Type,
  Undo2,
  Redo2,
  WandSparkles,
  LayoutTemplate,
  FolderOpen,
  MousePointer2,
  Settings2,
  SlidersHorizontal,
  Send,
  X,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateWithAiPrototype,
  refineBlock,
  type DemoBlock,
  type VectorShape,
} from "@/lib/hackathon/ai-prototype";
import {
  buildGeneratedSiteExportCss,
  buildGeneratedSiteExportHtml,
  GeneratedSitePreview,
} from "./GeneratedSitePreview";

type Viewport = "desktop" | "tablet" | "mobile";
type Tool = "select" | "section" | "frame" | "text" | "shape" | "image" | "button";
const widths: Record<Viewport, number> = { desktop: 1280, tablet: 768, mobile: 375 };
const samplePrompt =
  "Create a modern website for a Nigerian solar and electrical company called Vicky Tech Innovations. Use green and charcoal. Include a strong hero, services, trust-building copy and a clear contact CTA.";
const tools: Array<[Tool, string, typeof MousePointer2]> = [
  ["select", "Select / Move", MousePointer2],
  ["section", "Section", LayoutTemplate],
  ["frame", "Frame / Div", Frame],
  ["text", "Text", Type],
  ["shape", "Shape", Square],
  ["image", "Image", ImageIcon],
  ["button", "Button / Link", Link2],
];

export function HackathonStudio({
  onClose,
  initialBusinessName = "Untitled project",
}: {
  onClose: () => void;
  initialBusinessName?: string;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const [prompt, setPrompt] = useState(samplePrompt);
  const [blocks, setBlocks] = useState<DemoBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [primary, setPrimary] = useState("#22c55e");
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [engineMode, setEngineMode] = useState<"remote" | "local-prototype" | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(100);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<DemoBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<DemoBlock[][]>([]);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const resizeStart = useRef<{
    id: string;
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
    handleX: number;
    handleY: number;
  } | null>(null);

  const selected = useMemo(
    () => blocks.find((block) => block.id === selectedId) ?? null,
    [blocks, selectedId],
  );
  const visibleBlocks = useMemo(
    () => blocks.filter((block) => !hasHiddenAncestor(block, blocks, hiddenIds)),
    [blocks, hiddenIds],
  );
  const changeBlocks = (next: DemoBlock[]) => {
    setUndoStack((past) => [...past, blocks]);
    setRedoStack([]);
    setBlocks(next);
  };
  const update = (id: string, patch: Partial<DemoBlock>) => {
    const current = blocks.find((item) => item.id === id);
    if (!current || (current.locked && !Object.prototype.hasOwnProperty.call(patch, "locked")))
      return;
    changeBlocks(blocks.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };
  const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  const selectedParent =
    selected && (selected.type === "section" || selected.type === "container")
      ? selected
      : undefined;

  const addBlock = (block: DemoBlock) => {
    changeBlocks([...blocks, block]);
    setSelectedId(block.id);
    setContext(null);
  };
  const addText = () =>
    addBlock({
      id: newId("text"),
      type: "text",
      name: "Text",
      text: "Double-click to edit this text",
      x: selectedParent ? 20 : 120,
      y: selectedParent ? 20 : 160,
      width: 420,
      height: 70,
      background: "transparent",
      color: "#111827",
      radius: 0,
      locked: false,
      parentId: selectedParent?.id,
    });
  const addSection = () =>
    addBlock({
      id: newId("section"),
      type: "section",
      name: "Section",
      text: "",
      x: 40,
      y: 40,
      width: widths[viewport] - 80,
      height: 300,
      background: "#f8fafc",
      color: "#111827",
      radius: 0,
      locked: false,
    });
  const addFrame = () =>
    addBlock({
      id: newId("frame"),
      type: "container",
      name: "Frame",
      text: "",
      x: selectedParent ? 20 : 120,
      y: selectedParent ? 20 : 180,
      width: selectedParent ? Math.max(100, selectedParent.width - 40) : 420,
      height: 280,
      background: "#f1f5f9",
      color: "#111827",
      radius: 8,
      locked: false,
      parentId: selectedParent?.id,
    });
  const addShape = (kind: VectorShape) => {
    let svgPath: string | undefined;
    if (kind === "custom") {
      svgPath = window.prompt("Enter an SVG path (d attribute)", "M20 120 C100 10 260 10 380 120");
      if (!svgPath) return;
      if (!/^[\dMmZzLlHhVvCcSsQqTtAaEe,\s+.-]+$/.test(svgPath)) {
        window.alert("Use SVG path commands and numeric coordinates only.");
        return;
      }
    }
    const name = kind === "custom" ? "Custom vector" : `${kind[0].toUpperCase()}${kind.slice(1)}`;
    addBlock({
      id: newId("shape"),
      type: "shape",
      name,
      text: "",
      x: selectedParent ? 20 : 140,
      y: selectedParent ? 20 : 260,
      width: kind === "line" ? 240 : 300,
      height: kind === "line" ? 3 : 160,
      background: kind === "line" ? "#111827" : "#e5e7eb",
      color: "#111827",
      radius: kind === "circle" ? 80 : 8,
      locked: false,
      parentId: selectedParent?.id,
      shapeKind: kind,
      svgPath,
    });
    setShapeMenuOpen(false);
  };
  const addButton = () =>
    addBlock({
      id: newId("button"),
      type: "button",
      name: "Button",
      text: "Get started",
      x: selectedParent ? 20 : 120,
      y: selectedParent ? 20 : 340,
      width: 180,
      height: 48,
      background: primary,
      color: "#07110a",
      radius: 8,
      locked: false,
      href: "#",
      parentId: selectedParent?.id,
    });
  const addImage = (file: File) => {
    const parent = selectedParent;
    const reader = new FileReader();
    reader.onload = () =>
      addBlock({
        id: newId("image"),
        type: "image",
        name: file.name.replace(/\.[^.]+$/, "") || "Image",
        text: "",
        x: parent ? 20 : 120,
        y: parent ? 20 : 180,
        width: 420,
        height: 280,
        background: "#f1f5f9",
        color: "#111827",
        radius: 8,
        locked: false,
        src: String(reader.result),
        parentId: parent?.id,
      });
    reader.readAsDataURL(file);
  };
  const addImageUrl = () => {
    const src = window.prompt("Paste an image URL", "https://");
    if (src?.trim())
      addBlock({
        id: newId("image"),
        type: "image",
        name: "Image",
        text: "",
        x: selectedParent ? 20 : 120,
        y: selectedParent ? 20 : 180,
        width: 420,
        height: 280,
        background: "#f1f5f9",
        color: "#111827",
        radius: 8,
        locked: false,
        src: src.trim(),
        parentId: selectedParent?.id,
      });
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const result = await generateWithAiPrototype(prompt.trim());
      changeBlocks(result.blocks);
      setBusinessName(result.businessName || businessName);
      setPrimary(result.primary);
      setEngineMode(result.mode);
      setSelectedId(
        result.blocks.find((block) => block.type === "heading")?.id ?? result.blocks[0]?.id ?? null,
      );
      setAiOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  const applyRefinement = async (message: string) => {
    if (!selected || !message.trim()) return;
    setRefining(true);
    try {
      update(selected.id, await refineBlock(selected, message.trim(), primary));
      setAiMessage("");
    } finally {
      setRefining(false);
    }
  };

  const exportHtml = () => {
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "webeazy-site";
    downloadFile(
      `${slug}.html`,
      buildGeneratedSiteExportHtml(businessName, visibleBlocks),
      "text/html;charset=utf-8",
    );
    downloadFile(
      `${slug}.css`,
      buildGeneratedSiteExportCss(visibleBlocks),
      "text/css;charset=utf-8",
    );
  };
  const duplicate = () => {
    if (selected)
      addBlock({
        ...selected,
        id: newId("copy"),
        name: `${selected.name} copy`,
        x: selected.x + 24,
        y: selected.y + 24,
      });
  };
  const remove = () => {
    if (!selected) return;
    changeBlocks(blocks.filter((item) => item.id !== selected.id));
    setSelectedId(null);
    setContext(null);
  };
  const toolClick = (next: Tool) => {
    setTool(next);
    if (next !== "shape") setShapeMenuOpen(false);
    if (next === "section") addSection();
    if (next === "frame") addFrame();
    if (next === "text") addText();
    if (next === "shape") setShapeMenuOpen((open) => !open);
    if (next === "button") addButton();
    if (next === "image") addImageUrl();
  };
  const startDrag = (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => {
    if (
      tool !== "select" ||
      block.locked ||
      (event.target as HTMLElement).closest("[contenteditable=true]")
    )
      return;
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = event.currentTarget.parentElement ?? canvas;
    const rect = container.getBoundingClientRect();
    const scale = rect.width / widths[viewport];
    dragStart.current = {
      id: block.id,
      offsetX: (event.clientX - rect.left) / scale - block.x,
      offsetY: (event.clientY - rect.top) / scale - block.y,
    };
    setSelectedId(block.id);
    setDragId(block.id);
    setUndoStack((past) => [...past, blocks]);
    setRedoStack([]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveBlock = (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => {
    const start = dragStart.current;
    const canvas = canvasRef.current;
    if (!start || dragId !== block.id || tool !== "select" || !canvas) return;
    const container = event.currentTarget.parentElement ?? canvas;
    const rect = container.getBoundingClientRect();
    const scale = rect.width / widths[viewport];
    const x = Math.max(0, (event.clientX - rect.left) / scale - start.offsetX);
    const y = Math.max(0, (event.clientY - rect.top) / scale - start.offsetY);
    setBlocks((items) => items.map((item) => (item.id === block.id ? { ...item, x, y } : item)));
  };
  const stopDrag = () => {
    setDragId(null);
    dragStart.current = null;
  };
  const startResize = (
    event: PointerEvent<HTMLSpanElement>,
    block: DemoBlock,
    handleX: number,
    handleY: number,
  ) => {
    event.stopPropagation();
    if (block.locked) return;
    setSelectedId(block.id);
    resizeStart.current = {
      id: block.id,
      x: event.clientX,
      y: event.clientY,
      left: block.x,
      top: block.y,
      width: block.width,
      height: block.height,
      handleX,
      handleY,
    };
    setUndoStack((past) => [...past, blocks]);
    setRedoStack([]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const resizeBlock = (event: PointerEvent<HTMLSpanElement>) => {
    const start = resizeStart.current;
    const canvas = canvasRef.current;
    if (!start || !canvas) return;
    const scale = canvas.getBoundingClientRect().width / widths[viewport];
    const dx = (event.clientX - start.x) / scale;
    const dy = (event.clientY - start.y) / scale;
    const width = Math.max(24, start.width + dx * start.handleX);
    const height = Math.max(24, start.height + dy * start.handleY);
    const x = start.handleX < 0 ? start.left + start.width - width : start.left;
    const y = start.handleY < 0 ? start.top + start.height - height : start.top;
    setBlocks((items) =>
      items.map((item) => (item.id === start.id ? { ...item, width, height, x, y } : item)),
    );
  };
  const stopResize = () => {
    resizeStart.current = null;
  };
  const reorderLayer = (sourceId: string, targetId: string) => {
    const from = blocks.findIndex((block) => block.id === sourceId);
    const to = blocks.findIndex((block) => block.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const reordered = [...blocks];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    changeBlocks(reordered);
  };
  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([...redoStack, blocks]);
    setBlocks(previous);
  };
  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([...undoStack, blocks]);
    setBlocks(next);
  };

  return (
    <div
      className="webeazy-studio fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#121214] text-white"
      onPointerDown={() => {
        if (context) setContext(null);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) addImage(file);
          event.currentTarget.value = "";
        }}
      />
      <header className="relative z-30 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/[.08] bg-[#1a1a1d] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onClose}
            aria-label="Close editor"
            className="rounded-md p-1.5 text-white/45 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </button>
          <img src="/webeazy-logo.svg" alt="WebEazy" className="h-6 w-8 object-contain" />
          <span className="hidden text-xs font-semibold sm:inline">WebEazy</span>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button
            onClick={() => setSettingsOpen((value) => !value)}
            className="max-w-40 truncate rounded px-2 py-1 text-xs text-white/70 hover:bg-white/5"
          >
            {businessName}
            <ChevronDown className="ml-1 inline size-3 text-white/35" />
          </button>
          <IconButton icon={<Undo2 />} label="Undo" onClick={undo} disabled={!undoStack.length} />
          <IconButton icon={<Redo2 />} label="Redo" onClick={redo} disabled={!redoStack.length} />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/[.08] bg-black/15 p-0.5">
          {(["desktop", "tablet", "mobile"] as Viewport[]).map((value) => {
            const Icon = value === "desktop" ? Monitor : value === "tablet" ? Tablet : Smartphone;
            return (
              <button
                key={value}
                onClick={() => setViewport(value)}
                title={`${value} ${widths[value]}px`}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] ${viewport === value ? "bg-white/10 text-white" : "text-white/40 hover:text-white/75"}`}
              >
                <Icon className="size-3.5" />
                <span className="hidden lg:inline">{widths[value]}</span>
              </button>
            );
          })}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <button
            onClick={() => setZoom((value) => Math.max(25, value - 10))}
            className="px-1 text-white/55 hover:text-white"
          >
            −
          </button>
          <span className="min-w-9 text-center text-[10px] tabular-nums text-white/55">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((value) => Math.min(150, value + 10))}
            className="px-1 text-white/55 hover:text-white"
          >
            +
          </button>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            onClick={() => setAiOpen((value) => !value)}
            className="h-8 bg-[#8b5cf6] px-2.5 text-[10px] text-white hover:bg-[#9b75fa] sm:px-3"
          >
            <Sparkles className="mr-1.5 size-3.5" />
            AI Generate Section
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview((value) => !value)}
            className="h-8 border-white/10 bg-transparent px-2 text-[10px] text-white/75 hover:bg-white/5"
          >
            <Eye className="mr-1 size-3.5" />
            {preview ? "Design" : "Preview"}
          </Button>
          <Button
            size="sm"
            onClick={exportHtml}
            disabled={!blocks.length}
            className="h-8 bg-[#22c55e] px-2.5 text-[10px] text-[#07110a] hover:bg-[#4ade80] sm:px-3"
          >
            <Code2 className="mr-1.5 size-3.5" />
            <span className="hidden sm:inline">Export HTML/CSS</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
        {settingsOpen && (
          <div className="absolute left-52 top-11 z-[220] w-64 rounded-xl border border-white/10 bg-[#202024] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold">Project name</span>
              <button onClick={() => setSettingsOpen(false)} aria-label="Close project settings">
                <X className="size-4 text-white/45" />
              </button>
            </div>
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
            />
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {!preview && (
          <aside className="relative z-10 flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/[.08] bg-[#1a1a1d] py-2">
            {tools.map(([toolName, label, Icon]) => (
              <button
                key={toolName}
                onClick={() => toolClick(toolName)}
                title={label}
                aria-label={label}
                className={`flex size-10 items-center justify-center rounded-lg ${tool === toolName ? "bg-[#8b5cf6] text-white" : "text-white/45 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon className="size-[18px]" />
              </button>
            ))}
            {shapeMenuOpen && (
              <div className="absolute left-[calc(100%+8px)] top-[180px] z-[80] w-40 rounded-lg border border-white/10 bg-[#202024] p-1.5 shadow-xl">
                {(
                  [
                    ["rectangle", "Rectangle", <Square className="size-3.5" />],
                    ["circle", "Circle", <Circle className="size-3.5" />],
                    ["line", "Line", <Minus className="size-3.5" />],
                    ["custom", "Custom SVG path", <Frame className="size-3.5" />],
                  ] as Array<[VectorShape, string, ReactNode]>
                ).map(([kind, label, icon]) => (
                  <button
                    key={kind}
                    onClick={() => addShape(kind)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[10px] text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            )}
            <span className="my-1 h-px w-7 bg-white/10" />
            <button
              onClick={() => inputRef.current?.click()}
              title="Upload image"
              aria-label="Upload image"
              className="flex size-10 items-center justify-center rounded-lg text-white/45 hover:bg-white/5 hover:text-white"
            >
              <FolderOpen className="size-[18px]" />
            </button>
            <button
              onClick={() => setSettingsOpen((value) => !value)}
              title="Project settings"
              aria-label="Project settings"
              className="mt-auto flex size-10 items-center justify-center rounded-lg text-white/35 hover:bg-white/5 hover:text-white"
            >
              <Settings2 className="size-[18px]" />
            </button>
          </aside>
        )}

        <main className="relative min-w-0 flex-1 overflow-hidden">
          {preview ? (
            <GeneratedSitePreview
              blocks={visibleBlocks}
              businessName={businessName}
              viewport={viewport}
              onBack={() => setPreview(false)}
            />
          ) : (
            <>
              <div
                className="relative h-full min-h-0 overflow-auto bg-[#121214]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle,rgba(255,255,255,.13) 1px,transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
                onClick={() => setSelectedId(null)}
              >
                <div className="flex min-h-full w-max min-w-full justify-center p-8">
                  <div
                    className="relative shrink-0 bg-white shadow-[0_24px_70px_rgba(0,0,0,.4)]"
                    style={{
                      width: (widths[viewport] * zoom) / 100,
                      minHeight: (960 * zoom) / 100,
                    }}
                  >
                    <div
                      ref={canvasRef}
                      className="relative origin-top-left bg-white text-black"
                      style={{
                        width: widths[viewport],
                        minHeight: 960,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top left",
                        marginBottom: `${960 * (zoom / 100 - 1)}px`,
                        marginRight: `${widths[viewport] * (zoom / 100 - 1)}px`,
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <InnerCanvas
                        width={widths[viewport]}
                        blocks={visibleBlocks}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onContext={(event, block) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedId(block.id);
                          setContext({ x: event.clientX, y: event.clientY });
                        }}
                        onDragStart={startDrag}
                        onDragMove={moveBlock}
                        onDragEnd={stopDrag}
                        onResizeStart={startResize}
                        onResizeMove={resizeBlock}
                        onResizeEnd={stopResize}
                        onEditText={(id, text) => update(id, { text })}
                        onGenerate={() => setAiOpen(true)}
                        generating={generating}
                        businessName={businessName}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {!preview && (
          <aside className="flex w-[280px] shrink-0 flex-col border-l border-white/[.08] bg-[#1a1a1d] max-md:hidden">
            <section className="flex min-h-0 flex-[0.43] flex-col border-b border-white/[.08]">
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[.06] px-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  <LayersIcon className="size-3.5 text-white/45" />
                  Layers
                </div>
                <button
                  onClick={addSection}
                  title="Add section"
                  className="rounded p-1 text-white/45 hover:bg-white/5 hover:text-white"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <LayersPanel
                blocks={blocks}
                selectedId={selectedId}
                hiddenIds={hiddenIds}
                onSelect={setSelectedId}
                onToggleVisibility={(id) =>
                  setHiddenIds((items) =>
                    items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
                  )
                }
                onToggleLock={(id) =>
                  update(id, { locked: !blocks.find((block) => block.id === id)?.locked })
                }
                onReorder={reorderLayer}
                onDragStart={setDraggedLayerId}
                draggedLayerId={draggedLayerId}
              />
            </section>
            <section className="flex min-h-0 flex-[0.57] flex-col">
              <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[.06] px-3 text-[11px] font-semibold">
                <SlidersHorizontal className="size-3.5 text-white/45" />
                Properties
              </div>
              <Properties
                selected={selected}
                update={update}
                primary={primary}
                setPrimary={setPrimary}
              />
            </section>
          </aside>
        )}
      </div>

      {aiOpen && (
        <div
          className="fixed right-[296px] top-14 z-[190] w-[min(370px,calc(100vw-72px))] rounded-xl border border-white/10 bg-[#202024] p-4 shadow-2xl"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="size-3.5 text-[#b99cff]" />
                AI section generator
              </div>
              <div className="mt-1 text-[10px] text-white/40">
                {engineMode === "remote"
                  ? "Live AI connected"
                  : engineMode === "local-prototype"
                    ? "Prototype engine"
                    : "Describe a website or section"}
              </div>
            </div>
            <button onClick={() => setAiOpen(false)} aria-label="Close AI generator">
              <X className="size-4 text-white/45" />
            </button>
          </div>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the section or website you want..."
            className="min-h-24 border-white/10 bg-black/20 text-xs text-white"
          />
          <Button
            className="mt-2 w-full bg-[#8b5cf6] text-xs"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <RefreshCw className="mr-2 size-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-3.5" />
            )}
            {generating ? "Generating..." : "Generate editable design"}
          </Button>
          {selected && (
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Refine {selected.name}
              </div>
              <div className="flex gap-2">
                <input
                  value={aiMessage}
                  onChange={(event) => setAiMessage(event.target.value)}
                  placeholder="e.g. Make this more modern"
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-[11px]"
                />
                <button
                  onClick={() => void applyRefinement(aiMessage)}
                  disabled={!aiMessage.trim() || refining}
                  title="Apply refinement"
                  className="rounded-md bg-white/10 px-2 text-white/70 disabled:opacity-40"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {context && (
        <div
          className="fixed z-[200] w-48 rounded-xl border border-white/10 bg-[#202024] p-1.5 text-xs shadow-2xl"
          style={{ left: context.x, top: context.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MenuItem icon={<Copy />} label="Duplicate" onClick={duplicate} />
          <MenuItem icon={<Scissors />} label="Delete" onClick={remove} danger />
          <MenuItem
            icon={selected?.locked ? <LockOpen /> : <Lock />}
            label={selected?.locked ? "Unlock" : "Lock"}
            onClick={() => selected && update(selected.id, { locked: !selected.locked })}
          />
        </div>
      )}
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md p-1.5 text-white/45 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
    >
      {icon}
    </button>
  );
}
function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/38">
      {children}
    </div>
  );
}
function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] ${danger ? "text-red-300" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
function LayersPanel({
  blocks,
  selectedId,
  hiddenIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onReorder,
  onDragStart,
  draggedLayerId,
}: {
  blocks: DemoBlock[];
  selectedId: string | null;
  hiddenIds: string[];
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorder: (source: string, target: string) => void;
  onDragStart: (id: string) => void;
  draggedLayerId: string | null;
}) {
  const [pageCollapsed, setPageCollapsed] = useState(false);
  const ids = new Set(blocks.map((block) => block.id));
  const roots = blocks.filter((block) => !block.parentId || !ids.has(block.parentId));
  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <button
        onClick={() => setPageCollapsed((value) => !value)}
        className="mb-1 flex w-full items-center gap-2 rounded px-2 py-2 text-[10px] font-semibold text-white/65 hover:bg-white/5"
      >
        <span className="text-[9px] text-white/30">{pageCollapsed ? "›" : "⌄"}</span>
        <LayoutTemplate className="size-3.5 text-white/40" />
        Page <span className="ml-auto text-[9px] font-normal text-white/30">Home</span>
      </button>
      {!pageCollapsed && !blocks.length && (
        <div className="px-3 py-5 text-center text-[10px] text-white/35">
          Add a section to begin.
        </div>
      )}
      {!pageCollapsed &&
        roots.map((block) => (
          <LayerTreeRow
            key={block.id}
            block={block}
            blocks={blocks}
            selectedId={selectedId}
            hiddenIds={hiddenIds}
            onSelect={onSelect}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onReorder={onReorder}
            onDragStart={onDragStart}
            draggedLayerId={draggedLayerId}
            depth={0}
          />
        ))}
    </div>
  );
}

function LayerTreeRow({
  block,
  blocks,
  selectedId,
  hiddenIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onReorder,
  onDragStart,
  draggedLayerId,
  depth,
}: {
  block: DemoBlock;
  blocks: DemoBlock[];
  selectedId: string | null;
  hiddenIds: string[];
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorder: (source: string, target: string) => void;
  onDragStart: (id: string) => void;
  draggedLayerId: string | null;
  depth: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const children = blocks.filter((item) => item.parentId === block.id);
  const Icon =
    block.type === "section"
      ? LayoutTemplate
      : block.type === "container"
        ? Frame
        : block.type === "image"
          ? ImageIcon
          : block.type === "heading" || block.type === "text"
            ? Type
            : block.type === "button"
              ? Link2
              : Square;
  return (
    <div>
      <div
        draggable
        onDragStart={() => onDragStart(block.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (draggedLayerId) onReorder(draggedLayerId, block.id);
          onDragStart("");
        }}
        className={`group flex items-center gap-1 rounded ${draggedLayerId === block.id ? "opacity-40" : ""}`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <button
          onClick={() => children.length && setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand layer" : "Collapse layer"}
          className="w-3 text-[10px] text-white/30"
        >
          {children.length ? (collapsed ? "›" : "⌄") : ""}
        </button>
        <button
          onClick={() => onSelect(block.id)}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1.5 text-left text-[10px] ${selectedId === block.id ? "bg-[#8b5cf6]/20 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
        >
          <GripVertical className="size-3 text-white/20" />
          <Icon className="size-3.5 shrink-0 text-white/35" />
          <span className="min-w-0 flex-1 truncate">{block.name}</span>
        </button>
        <button
          onClick={() => onToggleVisibility(block.id)}
          title={hiddenIds.includes(block.id) ? "Show layer" : "Hide layer"}
          className="rounded p-1 text-white/35 hover:bg-white/5 hover:text-white"
        >
          {hiddenIds.includes(block.id) ? (
            <EyeOff className="size-3" />
          ) : (
            <Eye className="size-3" />
          )}
        </button>
        <button
          onClick={() => onToggleLock(block.id)}
          title={block.locked ? "Unlock layer" : "Lock layer"}
          className="rounded p-1 text-white/35 hover:bg-white/5 hover:text-white"
        >
          {block.locked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
        </button>
      </div>
      {!collapsed &&
        children.map((child) => (
          <LayerTreeRow
            key={child.id}
            block={child}
            blocks={blocks}
            selectedId={selectedId}
            hiddenIds={hiddenIds}
            onSelect={onSelect}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onReorder={onReorder}
            onDragStart={onDragStart}
            draggedLayerId={draggedLayerId}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

function InnerCanvas({
  width,
  blocks,
  selectedId,
  onSelect,
  onContext,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onEditText,
  onGenerate,
  generating,
  businessName,
}: {
  width: number;
  blocks: DemoBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContext: (event: MouseEvent<HTMLDivElement>, block: DemoBlock) => void;
  onDragStart: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void;
  onDragMove: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void;
  onDragEnd: () => void;
  onResizeStart: (
    event: PointerEvent<HTMLSpanElement>,
    block: DemoBlock,
    handleX: number,
    handleY: number,
  ) => void;
  onResizeMove: (event: PointerEvent<HTMLSpanElement>) => void;
  onResizeEnd: () => void;
  onEditText: (id: string, text: string) => void;
  onGenerate: () => void;
  generating: boolean;
  businessName: string;
}) {
  return (
    <div className="relative min-h-[960px] overflow-hidden bg-white" style={{ width }}>
      {!blocks.length && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-10">
          <div className="text-center">
            <WandSparkles className="mx-auto size-8 text-[#8b5cf6]" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Start designing {businessName}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Build directly on the artboard or generate a starting point with AI.
            </p>
            <button
              onClick={onGenerate}
              disabled={generating}
              className="mt-5 rounded-lg bg-[#8b5cf6] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {generating ? "Generating..." : "Generate with AI"}
            </button>
          </div>
        </div>
      )}
      {blocks
        .filter(
          (block) =>
            !block.parentId || !blocks.some((candidate) => candidate.id === block.parentId),
        )
        .map((block, index) => (
          <CanvasBlock
            key={block.id}
            block={block}
            blocks={blocks}
            selectedId={selectedId}
            z={index + 1}
            onSelect={onSelect}
            onContext={onContext}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onResizeStart={onResizeStart}
            onResizeMove={onResizeMove}
            onResizeEnd={onResizeEnd}
            onEditText={onEditText}
          />
        ))}
    </div>
  );
}

const resizeHandles: Array<{ x: number; y: number; position: string; cursor: string }> = [
  { x: -1, y: -1, position: "-left-1.5 -top-1.5", cursor: "cursor-nwse-resize" },
  { x: 0, y: -1, position: "left-1/2 -top-1.5 -translate-x-1/2", cursor: "cursor-ns-resize" },
  { x: 1, y: -1, position: "-right-1.5 -top-1.5", cursor: "cursor-nesw-resize" },
  { x: 1, y: 0, position: "-right-1.5 top-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
  { x: 1, y: 1, position: "-bottom-1.5 -right-1.5", cursor: "cursor-nwse-resize" },
  { x: 0, y: 1, position: "left-1/2 -bottom-1.5 -translate-x-1/2", cursor: "cursor-ns-resize" },
  { x: -1, y: 1, position: "-bottom-1.5 -left-1.5", cursor: "cursor-nesw-resize" },
  { x: -1, y: 0, position: "-left-1.5 top-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
];

function CanvasBlock({
  block,
  blocks,
  selectedId,
  z,
  onSelect,
  onContext,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onEditText,
}: {
  block: DemoBlock;
  blocks: DemoBlock[];
  selectedId: string | null;
  z: number;
  onSelect: (id: string) => void;
  onContext: (event: MouseEvent<HTMLDivElement>, block: DemoBlock) => void;
  onDragStart: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void;
  onDragMove: (event: PointerEvent<HTMLDivElement>, block: DemoBlock) => void;
  onDragEnd: () => void;
  onResizeStart: (
    event: PointerEvent<HTMLSpanElement>,
    block: DemoBlock,
    handleX: number,
    handleY: number,
  ) => void;
  onResizeMove: (event: PointerEvent<HTMLSpanElement>) => void;
  onResizeEnd: () => void;
  onEditText: (id: string, text: string) => void;
}) {
  const selected = selectedId === block.id;
  const parent = block.parentId ? blocks.find((item) => item.id === block.parentId) : undefined;
  const isAutoLayoutChild = parent?.type === "section" || parent?.type === "container";
  const style: CSSProperties = {
    position: isAutoLayoutChild ? "relative" : "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    flexShrink: 0,
    background: block.shapeKind === "custom" ? "transparent" : block.background,
    color: block.color,
    borderRadius: block.shapeKind === "circle" ? "50%" : block.radius,
    zIndex: z,
    boxSizing: "border-box",
    cursor: block.locked ? "default" : "move",
    fontSize: block.fontSize,
    fontWeight: block.fontWeight,
    fontFamily: block.fontFamily,
    border: block.stroke ? `1px solid ${block.stroke}` : undefined,
    display: block.type === "section" || block.type === "container" ? "flex" : undefined,
    flexDirection:
      block.type === "section" || block.type === "container"
        ? (block.layoutDirection ?? "column")
        : undefined,
    gap: block.gap,
  };
  const content =
    block.type === "image" && block.src ? (
      <img src={block.src} alt={block.name} className="h-full w-full object-cover" />
    ) : block.type === "shape" && block.shapeKind === "custom" && block.svgPath ? (
      <svg viewBox="0 0 400 240" className="h-full w-full overflow-visible">
        <path
          d={block.svgPath}
          fill="none"
          stroke={block.stroke ?? block.color}
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    ) : block.type === "heading" ? (
      <h1
        data-editable
        className="h-full w-full overflow-hidden whitespace-pre-wrap break-words text-[48px] font-bold leading-[1.05]"
      >
        {block.text}
      </h1>
    ) : block.type === "button" ? (
      <a
        href={block.href || "#"}
        onClick={(event) => event.preventDefault()}
        data-editable
        className="flex h-full w-full items-center justify-center gap-2 px-5 text-sm font-semibold"
      >
        {block.text}
      </a>
    ) : block.type === "text" || block.type === "card" ? (
      <p
        data-editable
        className={`h-full w-full overflow-hidden whitespace-pre-wrap break-words ${block.type === "card" ? "flex flex-col justify-end p-5 text-base font-semibold" : "text-base leading-6"}`}
      >
        {block.text}
      </p>
    ) : block.type === "shape" && block.shapeKind === "line" ? null : (
      <div className="pointer-events-none absolute inset-x-0 top-0 p-2 text-[9px] font-medium uppercase tracking-wide text-slate-500/60">
        {block.name}
      </div>
    );
  return (
    <div
      id={block.id}
      data-webeazy-id={block.id}
      data-element-type={block.type}
      onPointerDown={(event) => onDragStart(event, block)}
      onPointerMove={(event) => onDragMove(event, block)}
      onPointerUp={onDragEnd}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(block.id);
      }}
      onDoubleClick={(event) => {
        if (block.locked) return;
        const editable = event.currentTarget.querySelector<HTMLElement>("[data-editable]");
        if (editable) {
          editable.contentEditable = "true";
          editable.focus();
        }
      }}
      onBlurCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.dataset.editable !== undefined) {
          target.contentEditable = "false";
          onEditText(block.id, target.innerText);
        }
      }}
      onContextMenu={(event) => onContext(event, block)}
      style={style}
      className={`group border transition-colors ${selected ? "border-[#1683ff] shadow-[0_0_0_1px_#1683ff]" : "border-transparent hover:border-[#1683ff]/45"} ${block.locked ? "select-none" : ""}`}
    >
      {content}
      {blocks
        .filter((child) => child.parentId === block.id)
        .map((child, index) => (
          <CanvasBlock
            key={child.id}
            block={child}
            blocks={blocks}
            selectedId={selectedId}
            z={z + index + 1}
            onSelect={onSelect}
            onContext={onContext}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onResizeStart={onResizeStart}
            onResizeMove={onResizeMove}
            onResizeEnd={onResizeEnd}
            onEditText={onEditText}
          />
        ))}
      {selected && (
        <>
          <span className="absolute -right-1 top-[-23px] whitespace-nowrap rounded bg-[#1683ff] px-1.5 py-0.5 text-[9px] font-medium text-white">
            {Math.round(block.width)} × {Math.round(block.height)} px
          </span>
          {!block.locked &&
            resizeHandles.map((handle) => (
              <span
                key={`${handle.x}-${handle.y}`}
                onPointerDown={(event) => onResizeStart(event, block, handle.x, handle.y)}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeEnd}
                className={`absolute ${handle.position} ${handle.cursor} size-2.5 rounded-[2px] border border-[#1683ff] bg-white`}
              />
            ))}
        </>
      )}
    </div>
  );
}
function Properties({
  selected,
  update,
  primary,
  setPrimary,
}: {
  selected: DemoBlock | null;
  update: (id: string, patch: Partial<DemoBlock>) => void;
  primary: string;
  setPrimary: (value: string) => void;
}) {
  if (!selected)
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-[11px] text-white/35">
        <SlidersHorizontal className="mr-2 size-4" />
        Select an element to edit properties.
      </div>
    );
  const patch = (key: keyof DemoBlock, value: unknown) =>
    update(selected.id, { [key]: value } as Partial<DemoBlock>);
  const positions = [
    ["X", "x"],
    ["Y", "y"],
    ["W", "width"],
    ["H", "height"],
  ] as const;
  return (
    <div className="min-h-0 flex-1 overflow-auto text-[10px]">
      <div className="flex items-center justify-between border-b border-white/[.06] px-3 py-2.5">
        <div>
          <div className="text-[9px] text-white/35">Selected layer</div>
          <div className="mt-0.5 truncate text-[11px] font-medium">{selected.name}</div>
        </div>
        <button
          onClick={() => patch("locked", !selected.locked)}
          title={selected.locked ? "Unlock selected layer" : "Lock selected layer"}
          className="rounded p-1.5 text-white/45 hover:bg-white/5 hover:text-white"
        >
          {selected.locked ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
        </button>
      </div>
      <section className="border-b border-white/[.06] p-3">
        <Label>Position &amp; size</Label>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {positions.map(([label, key]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded border border-white/[.08] bg-white/[.025] px-2 py-1.5"
            >
              <span className="w-3 text-white/35">{label}</span>
              <input
                type="number"
                value={Math.round(selected[key])}
                onChange={(event) => patch(key, Number(event.target.value))}
                disabled={selected.locked}
                className="min-w-0 w-full bg-transparent text-[10px] outline-none disabled:opacity-40"
              />
            </label>
          ))}
        </div>
      </section>
      <section className="border-b border-white/[.06] p-3">
        <Label>Auto layout</Label>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <label className="rounded border border-white/[.08] bg-white/[.025] p-1.5">
            <span className="block text-[9px] text-white/35">Direction</span>
            <select
              value={selected.layoutDirection ?? "column"}
              onChange={(event) => patch("layoutDirection", event.target.value as "row" | "column")}
              className="mt-1 w-full bg-transparent text-[10px] text-white/75"
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </label>
          <label className="rounded border border-white/[.08] bg-white/[.025] p-1.5">
            <span className="block text-[9px] text-white/35">Gap</span>
            <input
              type="number"
              min="0"
              value={selected.gap ?? 0}
              onChange={(event) => patch("gap", Number(event.target.value))}
              disabled={selected.locked}
              className="mt-1 w-full bg-transparent text-[10px] outline-none"
            />
          </label>
        </div>
      </section>
      {(selected.type === "heading" ||
        selected.type === "text" ||
        selected.type === "button" ||
        selected.type === "card") && (
        <section className="border-b border-white/[.06] p-3">
          <Label>Typography</Label>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <label className="rounded border border-white/[.08] bg-white/[.025] p-1.5">
              <span className="block text-[9px] text-white/35">Font family</span>
              <select
                value={selected.fontFamily ?? "system-ui"}
                onChange={(event) => patch("fontFamily", event.target.value)}
                className="mt-1 w-full bg-transparent text-[10px] text-white/75"
              >
                <option value="system-ui">System UI</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
            </label>
            <label className="rounded border border-white/[.08] bg-white/[.025] p-1.5">
              <span className="block text-[9px] text-white/35">Size / weight</span>
              <div className="mt-1 flex gap-1">
                <input
                  aria-label="Font size"
                  type="number"
                  min="8"
                  value={selected.fontSize ?? (selected.type === "heading" ? 48 : 16)}
                  onChange={(event) => patch("fontSize", Number(event.target.value))}
                  className="w-1/2 bg-transparent text-[10px]"
                />
                <input
                  aria-label="Font weight"
                  type="number"
                  min="100"
                  max="900"
                  step="100"
                  value={selected.fontWeight ?? 400}
                  onChange={(event) => patch("fontWeight", Number(event.target.value))}
                  className="w-1/2 bg-transparent text-[10px]"
                />
              </div>
            </label>
          </div>
        </section>
      )}
      <section className="border-b border-white/[.06] p-3">
        <Label>Fill &amp; stroke</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ColorField
            label="Fill"
            value={selected.background}
            fallback="#ffffff"
            onChange={(value) => patch("background", value)}
          />
          <ColorField
            label="Stroke"
            value={selected.stroke ?? "transparent"}
            fallback="#ffffff"
            onChange={(value) => patch("stroke", value)}
          />
          <ColorField
            label="Text"
            value={selected.color}
            fallback="#111827"
            onChange={(value) => patch("color", value)}
          />
        </div>
      </section>
      <section className="p-3">
        <div className="flex items-center justify-between">
          <Label>Border radius</Label>
          <span className="text-white/40">{selected.radius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="48"
          value={selected.radius}
          onChange={(event) => patch("radius", Number(event.target.value))}
          className="mt-2 w-full accent-[#8b5cf6]"
        />
      </section>
      {selected.type === "image" && (
        <section className="border-t border-white/[.06] p-3">
          <Label>Image source</Label>
          <input
            value={selected.src ?? ""}
            onChange={(event) => patch("src", event.target.value)}
            className="mt-2 w-full rounded border border-white/[.08] bg-white/[.025] px-2 py-1.5 text-[10px]"
          />
        </section>
      )}
      {selected.type === "button" && (
        <section className="border-t border-white/[.06] p-3">
          <Label>Link URL</Label>
          <input
            value={selected.href ?? ""}
            onChange={(event) => patch("href", event.target.value)}
            className="mt-2 w-full rounded border border-white/[.08] bg-white/[.025] px-2 py-1.5 text-[10px]"
          />
        </section>
      )}
      <section className="border-t border-white/[.06] p-3">
        <Label>Brand accent</Label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={primary}
            onChange={(event) => setPrimary(event.target.value)}
            className="size-6 rounded border-0 bg-transparent"
          />
          <input
            value={primary}
            onChange={(event) => setPrimary(event.target.value)}
            className="min-w-0 flex-1 rounded border border-white/[.08] bg-white/[.025] px-2 py-1.5 text-[10px]"
          />
        </div>
      </section>
    </div>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const color = /^#[\da-f]{6}$/i.test(value) ? value : fallback;
  return (
    <label className="flex min-w-0 items-center gap-1.5">
      <input
        type="color"
        value={color}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="size-5 shrink-0 rounded border-0 bg-transparent"
      />
      <span className="truncate text-[9px] text-white/45">{label}</span>
    </label>
  );
}

function hasHiddenAncestor(block: DemoBlock, blocks: DemoBlock[], hiddenIds: string[]) {
  const hidden = new Set(hiddenIds);
  const byId = new Map(blocks.map((item) => [item.id, item]));
  const seen = new Set<string>();
  let current: DemoBlock | undefined = block;
  while (current) {
    if (hidden.has(current.id)) return true;
    if (!current.parentId) return false;
    if (seen.has(current.parentId)) return true;
    seen.add(current.parentId);
    current = byId.get(current.parentId);
  }
  return false;
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
