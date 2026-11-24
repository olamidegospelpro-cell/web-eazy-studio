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
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Bot,
  ChevronDown,
  Code2,
  Copy,
  Crop,
  Eye,
  FolderOpen,
  Frame,
  Grid3X3,
  Image as ImageIcon,
  Layers3,
  LayoutTemplate,
  Link2,
  Lock,
  LockOpen,
  Menu,
  Monitor,
  Move,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Share2,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Trash2,
  Type,
  Undo2,
  Upload,
  WandSparkles,
  ZoomIn,
  ZoomOut,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWithAiPrototype, refineBlock, type DemoBlock } from "@/lib/hackathon/ai-prototype";
import { GeneratedSitePreview } from "./GeneratedSitePreview";
import { buildGeneratedSiteExportHtml } from "./site-export";
import {
  createWebsiteNode,
  migrateLegacyWebsiteNodes,
  useProject,
  type WebsiteNode,
} from "@/lib/project";

type Viewport = "desktop" | "tablet" | "mobile";
type LeftTab = "layers" | "sections" | "pages" | "assets" | "ai";
type RightTab = "properties" | "style" | "effects";

const viewportWidth: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function getNodeTreeIds(nodes: WebsiteNode[], nodeId: string) {
  const descendants = new Set<string>();
  const collect = (id: string) => {
    if (descendants.has(id)) return;
    descendants.add(id);
    nodes.find((node) => node.id === id)?.childIds.forEach(collect);
  };
  collect(nodeId);
  return descendants;
}

export function HackathonStudio({
  onClose,
  initialBusinessName = "Untitled project",
  initialPageId,
}: {
  onClose: () => void;
  initialBusinessName?: string;
  initialPageId?: string;
}) {
  const projectStore = useProject();
  const [selectedPageId, setSelectedPageId] = useState(initialPageId);
  const activePage =
    projectStore.bundle?.pages.find((page) => page.id === selectedPageId) ??
    projectStore.bundle?.pages[0];
  const activePageId = activePage?.id;
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;
  const [blocks, setBlocks] = useState<WebsiteNode[]>(activePage?.nodes ?? []);
  const [selectedId, setSelectedId] = useState<string>(activePage?.nodes[0]?.id ?? "");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<LeftTab>("sections");
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [tool, setTool] = useState<"select" | "move" | "text" | "shape" | "image" | "link">(
    "select",
  );
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [savedAt, setSavedAt] = useState("Saved");
  const [history, setHistory] = useState<WebsiteNode[][]>([]);
  const [future, setFuture] = useState<WebsiteNode[][]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const resizeRef = useRef<{
    id: string;
    corner: "nw" | "ne" | "sw" | "se";
    x: number;
    y: number;
    width: number;
    height: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [prompt, setPrompt] = useState("Create a premium green SaaS landing page");
  const [generating, setGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [legacyDraft, setLegacyDraft] = useState<{
    blocks: unknown[];
    businessName?: string;
  } | null>(null);
  const [legacyDraftError, setLegacyDraftError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blocksRef = useRef(blocks);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  blocksRef.current = blocks;

  useEffect(() => {
    setSelectedPageId(initialPageId);
  }, [initialPageId]);

  useEffect(() => {
    const page = activePageRef.current;
    if (!page) return;
    setBlocks(page.nodes);
    setSelectedId(page.nodes[0]?.id ?? "");
    setHistory([]);
    setFuture([]);
  }, [activePageId]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(`webeazy-project:${initialBusinessName}`) || "null",
      ) as { blocks?: unknown[]; businessName?: string } | null;
      if (saved && Array.isArray(saved.blocks) && saved.blocks.length) {
        setLegacyDraft({ blocks: saved.blocks, businessName: saved.businessName });
      }
    } catch (error) {
      setLegacyDraftError(
        error instanceof Error ? error.message : "The saved local draft could not be read.",
      );
    }
  }, [initialBusinessName]);

  const selected = useMemo(
    () => blocks.find((block) => block.id === selectedId) || null,
    [blocks, selectedId],
  );

  const applyBlocks = (next: WebsiteNode[]) => {
    blocksRef.current = next;
    setBlocks(next);
    if (activePage) projectStore.updatePage(activePage.id, { nodes: next });
  };
  const commit = (next: WebsiteNode[], _label?: string) => {
    setHistory((items) => [...items.slice(-29), blocks]);
    setFuture([]);
    applyBlocks(next);
  };
  const update = (id: string, patch: Partial<WebsiteNode>) =>
    commit(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setFuture((items) => [blocks, ...items]);
    setHistory((items) => items.slice(0, -1));
    applyBlocks(previous);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((items) => [...items, blocks]);
    setFuture((items) => items.slice(1));
    applyBlocks(next);
  };
  const saveProject = async () => {
    projectStore.setWebsiteName(businessName);
    await projectStore.save();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSavedAt(time);
  };
  const importLegacyDraft = () => {
    if (!legacyDraft) return;
    try {
      const imported = migrateLegacyWebsiteNodes(legacyDraft.blocks);
      commit(imported);
      setSelectedId(imported[0]?.id ?? "");
      if (legacyDraft.businessName) setBusinessName(legacyDraft.businessName);
      setLegacyDraft(null);
      setLegacyDraftError(null);
    } catch (error) {
      setLegacyDraftError(
        error instanceof Error ? error.message : "The local draft contains invalid elements.",
      );
    }
  };
  const exportHtml = () => {
    const html = buildGeneratedSiteExportHtml(businessName, blocks, activePage?.breakpoints);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "webeazy-site"}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const duplicate = () => {
    if (!selected) return;
    const descendants = getNodeTreeIds(blocks, selected.id);
    const ids = new Map([...descendants].map((id) => [id, uid("copy")]));
    const copies = blocks
      .filter((node) => descendants.has(node.id))
      .map((node) => ({
        ...node,
        id: ids.get(node.id)!,
        name: node.id === selected.id ? `${node.name} copy` : node.name,
        parentId: node.id === selected.id ? selected.parentId : (ids.get(node.parentId!) ?? null),
        childIds: node.childIds.map((id) => ids.get(id)!).filter(Boolean),
        x: node.x + 24,
        y: node.y + 24,
      }));
    const next = blocks.map((node) =>
      node.id === selected.parentId
        ? { ...node, childIds: [...node.childIds, ids.get(selected.id)!] }
        : node,
    );
    commit([...next, ...copies]);
    setSelectedId(ids.get(selected.id)!);
  };
  const removeSelected = () => {
    if (!selected) return;
    const removed = getNodeTreeIds(blocks, selected.id);
    const next = blocks
      .filter((block) => !removed.has(block.id))
      .map((block) =>
        block.id === selected.parentId
          ? { ...block, childIds: block.childIds.filter((id) => !removed.has(id)) }
          : block,
      );
    commit(next);
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
    commit(
      next.map((node) =>
        node.type === "section" || node.type === "container"
          ? {
              ...node,
              childIds: next.filter((child) => child.parentId === node.id).map((child) => child.id),
            }
          : node,
      ),
    );
  };

  const addBlock = (block: DemoBlock) => {
    const node = createWebsiteNode(block);
    commit([...blocks, node]);
    setSelectedId(node.id);
  };
  const addText = () =>
    addBlock({
      id: uid("text"),
      type: "text",
      name: "Text",
      text: "Double-click to edit this text",
      x: 180,
      y: 220,
      width: 420,
      height: 70,
      background: "transparent",
      color: "#f5f5e6",
      radius: 0,
      locked: false,
      fontSize: 16,
    });
  const addShape = () =>
    addBlock({
      id: uid("shape"),
      type: "shape",
      name: "Shape",
      text: "",
      x: 180,
      y: 260,
      width: 300,
      height: 160,
      background: "#17231b",
      color: "#f5f5e6",
      radius: 16,
      locked: false,
      border: "1px solid rgba(174,223,188,.14)",
    });
  const addSection = (kind: string) => {
    const y = blocks.length ? Math.max(...blocks.map((block) => block.y + block.height)) + 32 : 160;
    const sectionMap: Record<string, Partial<DemoBlock>> = {
      Hero: {
        type: "heading",
        text: "Turn Your Ideas Into Real Websites",
        width: 620,
        height: 120,
        fontSize: 48,
        fontWeight: 800,
      },
      About: {
        type: "text",
        text: "We help ambitious teams turn ideas into clear, useful digital experiences.",
        width: 760,
        height: 100,
        background: "#101912",
        fontSize: 18,
        padding: 24,
        radius: 18,
      },
      Services: {
        type: "card",
        text: "Design  ·  Development  ·  Launch",
        width: 760,
        height: 180,
        background: "#17231b",
        fontSize: 20,
        padding: 24,
        radius: 20,
      },
      Features: {
        type: "card",
        text: "Fast  ·  Flexible  ·  Responsive",
        width: 760,
        height: 180,
        background: "#17231b",
        fontSize: 20,
        padding: 24,
        radius: 20,
      },
      Testimonials: {
        type: "text",
        text: "“WebEazy made our launch feel effortless.”",
        width: 760,
        height: 120,
        background: "#101912",
        fontSize: 18,
        padding: 24,
        radius: 18,
      },
      Gallery: {
        type: "shape",
        text: "",
        width: 760,
        height: 220,
        background: "#17231b",
        radius: 18,
      },
      Pricing: {
        type: "card",
        text: "Simple pricing · Start from $0",
        width: 760,
        height: 180,
        background: "#17231b",
        fontSize: 20,
        padding: 24,
        radius: 20,
      },
      Statistics: {
        type: "card",
        text: "98%     2×     24/7",
        width: 760,
        height: 150,
        background: "#17231b",
        fontSize: 24,
        padding: 24,
        radius: 20,
      },
      Contact: {
        type: "button",
        text: "Start a conversation",
        width: 260,
        height: 56,
        background: "#19c65b",
        color: "#07110a",
        radius: 28,
        fontWeight: 800,
      },
      CTA: {
        type: "button",
        text: "Get started  →",
        width: 220,
        height: 56,
        background: "#19c65b",
        color: "#07110a",
        radius: 28,
        fontWeight: 800,
      },
      Footer: {
        type: "text",
        text: "© 2026 WebEazy · Built with care",
        width: 760,
        height: 80,
        background: "#101912",
        fontSize: 12,
        padding: 24,
        radius: 12,
      },
    };
    const preset = sectionMap[kind] || sectionMap.Hero;
    const sectionId = uid("section");
    const x = kind === "Hero" ? 132 : 180;
    const width = Math.max(280, preset.width || 760);
    const height = Math.max(120, preset.height || 180);
    const section = createWebsiteNode({
      id: sectionId,
      type: "section",
      name: `${kind} section`,
      text: "",
      x,
      y,
      width,
      height,
      background: preset.background || "#101912",
      color: "#f5f5e6",
      radius: preset.radius || 0,
      locked: false,
      padding: preset.padding,
      border: preset.border,
      childIds: [],
    });
    const child = createWebsiteNode({
      id: uid("section-content"),
      type: preset.type || "text",
      name: `${kind} content`,
      text: preset.text || "",
      x: x + 24,
      y: y + 24,
      width: width - 48,
      height: height - 48,
      background: "transparent",
      color: preset.color || "#f5f5e6",
      radius: preset.radius || 0,
      locked: false,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      padding: preset.padding,
      border: preset.border,
      parentId: sectionId,
    });
    section.childIds.push(child.id);
    commit([...blocks, section, child]);
    setSelectedId(section.id);
  };
  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateWithAiPrototype(prompt);
      commit(result.blocks.map((block) => createWebsiteNode(block)));
      setBusinessName(result.businessName);
      setSelectedId(
        result.blocks.find((block) => block.type === "heading")?.id || result.blocks[0]?.id || "",
      );
    } finally {
      setGenerating(false);
    }
  };
  const uploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      addBlock({
        id: uid("image"),
        type: "image",
        name: file.name,
        text: "",
        x: 180,
        y: 220,
        width: 420,
        height: 280,
        background: "#101912",
        color: "#fff",
        radius: 16,
        locked: false,
        src: String(reader.result),
      });
    reader.readAsDataURL(file);
  };
  const share = async () => {
    const shareData = { title: businessName, text: "WebEazy workspace project" };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  const align = (direction: "left" | "center" | "right") => {
    if (!selected) return;
    const x =
      direction === "left"
        ? 40
        : direction === "center"
          ? (viewportWidth[viewport] - selected.width) / 2
          : viewportWidth[viewport] - selected.width - 40;
    update(selected.id, { x: Math.max(0, x), textAlign: direction });
  };
  const startDrag = (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => {
    if (tool !== "move" || block.locked) return;
    event.stopPropagation();
    setSelectedId(block.id);
    setDragId(block.id);
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      const scale = rect.width / viewportWidth[viewport];
      dragOffsetRef.current = {
        x: (event.clientX - rect.left) / scale - block.x,
        y: (event.clientY - rect.top) / scale - block.y,
      };
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveBlock = (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => {
    if (dragId !== block.id || tool !== "move") return;
    const parent = event.currentTarget.parentElement;
    const offset = dragOffsetRef.current;
    if (!parent || !offset) return;
    const rect = parent.getBoundingClientRect();
    const scale = rect.width / viewportWidth[viewport];
    const x = Math.max(0, (event.clientX - rect.left) / scale - offset.x);
    const y = Math.max(0, (event.clientY - rect.top) / scale - offset.y);
    const deltaX = x - block.x;
    const deltaY = y - block.y;
    const movingIds = getNodeTreeIds(blocksRef.current, block.id);
    const next = blocksRef.current.map((item) =>
      movingIds.has(item.id)
        ? { ...item, x: Math.max(0, item.x + deltaX), y: Math.max(0, item.y + deltaY) }
        : item,
    );
    blocksRef.current = next;
    setBlocks(next);
  };
  const startResize = (
    event: PointerEvent<HTMLElement>,
    block: WebsiteNode,
    corner: "nw" | "ne" | "sw" | "se",
  ) => {
    if (block.locked) return;
    event.stopPropagation();
    const canvas = event.currentTarget.parentElement?.parentElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / viewportWidth[viewport];
    resizeRef.current = {
      id: block.id,
      corner,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      pointerX: (event.clientX - rect.left) / scale,
      pointerY: (event.clientY - rect.top) / scale,
    };
    setSelectedId(block.id);
    event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
  };
  const resizeBlock = (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => {
    const resize = resizeRef.current;
    if (!resize || resize.id !== block.id) return;
    const canvas = event.currentTarget.parentElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / viewportWidth[viewport];
    const pointerX = (event.clientX - rect.left) / scale;
    const pointerY = (event.clientY - rect.top) / scale;
    const deltaX = pointerX - resize.pointerX;
    const deltaY = pointerY - resize.pointerY;
    const minSize = 24;
    let x = resize.x;
    let y = resize.y;
    let width = resize.width;
    let height = resize.height;
    if (resize.corner.includes("w")) {
      width = Math.max(minSize, resize.width - deltaX);
      x = resize.x + resize.width - width;
    } else {
      width = Math.max(minSize, resize.width + deltaX);
    }
    if (resize.corner.includes("n")) {
      height = Math.max(minSize, resize.height - deltaY);
      y = resize.y + resize.height - height;
    } else {
      height = Math.max(minSize, resize.height + deltaY);
    }
    const next = blocksRef.current.map((node) =>
      node.id === block.id ? { ...node, x, y, width, height } : node,
    );
    blocksRef.current = next;
    setBlocks(next);
  };
  const finishDrag = () => {
    if (dragId) commit(blocksRef.current);
    dragOffsetRef.current = null;
    setDragId(null);
    if (resizeRef.current) commit(blocksRef.current);
    resizeRef.current = null;
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.currentTarget.value = "";
        }}
      />
      <header className="studio-topbar">
        <div className="studio-brand">
          <button className="studio-icon-button" onClick={onClose} title="Back">
            <ArrowLeft />
          </button>
          <div className="studio-logo">
            <span>W</span>
          </div>
          <button
            className="studio-project-name"
            onClick={() => setSettingsOpen((value) => !value)}
          >
            {businessName}
            <ChevronDown />
          </button>
          <div className={`studio-save ${projectStore.saveState === "error" ? "error" : ""}`}>
            <span />
            {projectStore.saveState === "saving"
              ? "Saving…"
              : projectStore.dirty
                ? "Unsaved changes"
                : `Saved ${savedAt}`}
          </div>
        </div>
        <div className="studio-history">
          <button disabled={!history.length} onClick={undo} title="Undo">
            <Undo2 />
          </button>
          <button disabled={!future.length} onClick={redo} title="Redo">
            <Redo2 />
          </button>
          <span />
          <button
            onClick={() => setGridVisible((value) => !value)}
            title="Toggle grid"
            className={gridVisible ? "active" : ""}
          >
            <Grid3X3 />
          </button>
        </div>
        <div className="studio-actions">
          <button className="studio-ai-button" onClick={() => setLeftTab("ai")}>
            <Bot />
            AI Assistant
            <span />
          </button>
          <button className="studio-share" onClick={share}>
            <Share2 />
            Share
          </button>
          <button onClick={() => setPreview((value) => !value)} className="studio-preview">
            <Eye />
            {preview ? "Design" : "Preview"}
          </button>
          <button onClick={exportHtml} disabled={!blocks.length} className="studio-export">
            <Code2 />
            Export
          </button>
          <button className="studio-avatar" title="Account">
            G
          </button>
        </div>
        {settingsOpen && (
          <div className="studio-settings-popover">
            <div>
              <b>Project settings</b>
              <button onClick={() => setSettingsOpen(false)}>×</button>
            </div>
            <label>
              Website name
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
              />
            </label>
            <button onClick={saveProject}>
              <Save />
              Save project
            </button>
            {legacyDraft && (
              <button onClick={importLegacyDraft}>
                <FolderOpen />
                Import local draft: {legacyDraft.businessName || initialBusinessName}
              </button>
            )}
            {legacyDraftError && (
              <p role="alert">Could not read the previous local draft: {legacyDraftError}</p>
            )}
          </div>
        )}
      </header>

      <div className="studio-shell">
        <aside className="studio-left">
          <nav className="studio-left-rail">
            <button
              className={leftTab === "layers" ? "active" : ""}
              onClick={() => {
                setLeftOpen(true);
                setLeftTab("layers");
              }}
              title="Layers"
            >
              <Layers3 />
              <span>Layers</span>
            </button>
            <button
              className={leftTab === "sections" ? "active" : ""}
              onClick={() => {
                setLeftOpen(true);
                setLeftTab("sections");
              }}
              title="Sections"
            >
              <LayoutTemplate />
              <span>Sections</span>
            </button>
            <button
              className={leftTab === "pages" ? "active" : ""}
              onClick={() => {
                setLeftOpen(true);
                setLeftTab("pages");
              }}
              title="Pages"
            >
              <FolderOpen />
              <span>Pages</span>
            </button>
            <button
              className={leftTab === "assets" ? "active" : ""}
              onClick={() => {
                setLeftOpen(true);
                setLeftTab("assets");
              }}
              title="Assets"
            >
              <ImageIcon />
              <span>Assets</span>
            </button>
            <button
              className={leftTab === "ai" ? "active" : ""}
              onClick={() => {
                setLeftOpen(true);
                setLeftTab("ai");
              }}
              title="AI"
            >
              <Bot />
              <span>AI</span>
            </button>
          </nav>
          {leftOpen && (
            <div className="studio-left-content">
              <div className="studio-panel-heading">
                <b>
                  {leftTab === "ai" ? "AI Assistant" : leftTab[0].toUpperCase() + leftTab.slice(1)}
                </b>
                <button onClick={() => setLeftOpen(false)}>
                  <PanelLeftClose />
                </button>
              </div>
              {leftTab === "layers" && (
                <div className="studio-layer-tree">
                  {blocks.length ? (
                    blocks.map((block) => (
                      <button
                        key={block.id}
                        className={selectedId === block.id ? "selected" : ""}
                        onClick={() => setSelectedId(block.id)}
                      >
                        <GripIcon />
                        <span>{block.name}</span>
                        {block.locked && <Lock />}
                      </button>
                    ))
                  ) : (
                    <div className="studio-empty">No elements yet</div>
                  )}
                </div>
              )}
              {leftTab === "sections" && (
                <div className="studio-section-library">
                  {[
                    "Hero",
                    "About",
                    "Services",
                    "Features",
                    "Testimonials",
                    "Gallery",
                    "Pricing",
                    "Statistics",
                    "Contact",
                    "CTA",
                    "Footer",
                  ].map((section) => (
                    <button key={section} onClick={() => addSection(section)}>
                      <div>
                        <i />
                        <i />
                        <i />
                      </div>
                      <span>
                        {section}
                        <Plus />
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {leftTab === "pages" && (
                <div className="studio-pages">
                  {projectStore.bundle?.pages.map((page) => (
                    <button
                      key={page.id}
                      className={page.id === activePage?.id ? "selected" : ""}
                      onClick={() => setSelectedPageId(page.id)}
                    >
                      <LayoutTemplate />
                      <span>
                        <b>{page.name}</b>
                        <small>/{page.slug === "index" ? "" : page.slug}</small>
                      </span>
                    </button>
                  ))}
                  <button onClick={() => setSelectedPageId(projectStore.addPage().id)}>
                    <Plus />
                    <span>Add page</span>
                  </button>
                </div>
              )}
              {leftTab === "assets" && (
                <div className="studio-assets">
                  <div className="studio-search">
                    <Search />
                    <input placeholder="Search assets" />
                  </div>
                  <button onClick={() => inputRef.current?.click()}>
                    <Upload />
                    <b>Upload image</b>
                    <small>PNG, JPG or SVG</small>
                  </button>
                </div>
              )}
              {leftTab === "ai" && (
                <div className="studio-ai-panel">
                  <div>
                    <WandSparkles />
                    <b>Describe a layout</b>
                  </div>
                  <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
                  <button onClick={generate} disabled={generating}>
                    {generating ? "Generating..." : "Generate layout"}
                    <Sparkles />
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="studio-main">
          {!preview && (
            <div className="studio-toolbox">
              {toolbarTools.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  title={item.label}
                  className={
                    item.label === "Select" ||
                    item.label === "Move" ||
                    item.label === "Text" ||
                    item.label === "Shape" ||
                    (item.label === "Image" && tool === item.id)
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setTool(item.id);
                    if (item.label === "Text") addText();
                    if (item.label === "Shape") addShape();
                    if (item.label === "Image") inputRef.current?.click();
                  }}
                >
                  <span>{item.icon}</span>
                  <small>{item.label}</small>
                </button>
              ))}
              <i />
              <button title="Align left" onClick={() => align("left")}>
                <span>
                  <AlignLeft />
                </span>
                <small>Align</small>
              </button>
              <button title="Align center" onClick={() => align("center")}>
                <span>
                  <AlignCenter />
                </span>
                <small>Center</small>
              </button>
              <button title="Align right" onClick={() => align("right")}>
                <span>
                  <AlignRight />
                </span>
                <small>Right</small>
              </button>
              <i />
              <button title="Duplicate" onClick={duplicate} disabled={!selected}>
                <span>
                  <Copy />
                </span>
                <small>Copy</small>
              </button>
              <button title="Delete" onClick={removeSelected} disabled={!selected}>
                <span>
                  <Trash2 />
                </span>
                <small>Delete</small>
              </button>
            </div>
          )}
          {preview ? (
            <GeneratedSitePreview
              blocks={blocks}
              businessName={businessName}
              viewport={viewport}
              breakpoints={activePage?.breakpoints}
              onBack={() => setPreview(false)}
            />
          ) : (
            <div className="studio-canvas-area">
              <div className="studio-viewport-bar">
                {(["desktop", "tablet", "mobile"] as Viewport[]).map((value) => (
                  <button
                    key={value}
                    className={viewport === value ? "active" : ""}
                    title={value}
                    onClick={() => setViewport(value)}
                  >
                    {value === "desktop" ? (
                      <Monitor />
                    ) : value === "tablet" ? (
                      <Tablet />
                    ) : (
                      <Smartphone />
                    )}
                  </button>
                ))}
                <span />
                <button onClick={() => setZoom((value) => Math.max(25, value - 10))}>
                  <ZoomOut />
                </button>
                <b>{zoom}%</b>
                <button onClick={() => setZoom((value) => Math.min(150, value + 10))}>
                  <ZoomIn />
                </button>
              </div>
              <div className="studio-scroll">
                <div className="studio-rulers">
                  <div className="ruler-x" />
                  <div className="ruler-y" />
                </div>
                <div
                  className={`studio-artboard ${gridVisible ? "grid" : ""}`}
                  style={{
                    width: (viewportWidth[viewport] * zoom) / 100,
                    minHeight: (760 * zoom) / 100,
                  }}
                >
                  <div
                    className="studio-artboard-inner"
                    style={{
                      width: viewportWidth[viewport],
                      minHeight: 760,
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                    }}
                  >
                    {blocks.map((block, index) => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        index={index}
                        selected={selectedId === block.id}
                        tool={tool}
                        onSelect={setSelectedId}
                        onContext={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedId(block.id);
                          setContext({ x: event.clientX, y: event.clientY });
                        }}
                        onDragStart={startDrag}
                        onDragMove={moveBlock}
                        onResizeStart={startResize}
                        onResizeMove={resizeBlock}
                        onDragEnd={finishDrag}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {!preview && (
          <aside className="studio-right">
            <div className="studio-right-tabs">
              {(["properties", "style", "effects"] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  className={rightTab === tab ? "active" : ""}
                  onClick={() => setRightTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {rightTab === "properties" && (
              <PropertiesPanel selected={selected} update={update} moveSelected={moveSelected} />
            )}
            {rightTab === "style" && <StylePanel selected={selected} update={update} />}
            {rightTab === "effects" && <EffectsPanel selected={selected} update={update} />}
          </aside>
        )}
      </div>
      {context && selected && (
        <div
          className="studio-context"
          style={{ left: context.x, top: context.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button onClick={duplicate}>
            <Copy />
            Duplicate
          </button>
          <button onClick={removeSelected} className="danger">
            <Scissors />
            Delete
          </button>
          <button onClick={() => update(selected.id, { locked: !selected.locked })}>
            {selected.locked ? <LockOpen /> : <Lock />}
            {selected.locked ? "Unlock" : "Lock"}
          </button>
        </div>
      )}
    </div>
  );
}

function GripIcon() {
  return <span className="grip">⋮⋮</span>;
}

function CanvasBlock({
  block,
  index,
  selected,
  tool,
  onSelect,
  onContext,
  onDragStart,
  onDragMove,
  onResizeStart,
  onResizeMove,
  onDragEnd,
}: {
  block: WebsiteNode;
  index: number;
  selected: boolean;
  tool: string;
  onSelect: (id: string) => void;
  onContext: (event: MouseEvent<HTMLDivElement>) => void;
  onDragStart: (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => void;
  onDragMove: (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => void;
  onResizeStart: (
    event: PointerEvent<HTMLElement>,
    block: WebsiteNode,
    corner: "nw" | "ne" | "sw" | "se",
  ) => void;
  onResizeMove: (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => void;
  onDragEnd: () => void;
}) {
  const style: CSSProperties = {
    position: "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    background: block.background,
    color: block.color,
    borderRadius: block.radius,
    border: block.border,
    boxSizing: "border-box",
    zIndex: index + 1,
    padding: block.padding ?? (block.type === "card" ? 20 : 0),
    textAlign: block.textAlign || "left",
    fontSize: block.fontSize || (block.type === "heading" ? 48 : 14),
    fontWeight: block.fontWeight || (block.type === "heading" ? 800 : 400),
    lineHeight: block.lineHeight || 1.45,
    boxShadow: block.shadow ? "0 20px 50px rgba(0,0,0,.35)" : undefined,
    cursor: block.locked ? "not-allowed" : tool === "move" ? "grab" : "default",
    overflow: "hidden",
    display: block.visible ? "flex" : "none",
  };
  const content =
    block.type === "image" && block.src ? (
      <img src={block.src} alt={block.name} />
    ) : block.type === "shape" || block.type === "section" || block.type === "container" ? null : (
      <span>{block.text}</span>
    );
  return (
    <div
      className={`studio-canvas-block ${selected ? "selected" : ""}`}
      style={style}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (tool === "move") onDragStart(event, block);
        else onSelect(block.id);
      }}
      onPointerMove={(event) => {
        onDragMove(event, block);
        onResizeMove(event, block);
      }}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      onContextMenu={onContext}
      onDoubleClick={() => onSelect(block.id)}
    >
      {content}
      {selected && !block.locked && (
        <>
          <i className="handle nw" onPointerDown={(event) => onResizeStart(event, block, "nw")} />
          <i className="handle ne" onPointerDown={(event) => onResizeStart(event, block, "ne")} />
          <i className="handle sw" onPointerDown={(event) => onResizeStart(event, block, "sw")} />
          <i className="handle se" onPointerDown={(event) => onResizeStart(event, block, "se")} />
        </>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="studio-number-field">
      <span>{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
function PropertiesPanel({
  selected,
  update,
  moveSelected,
}: {
  selected: WebsiteNode | null;
  update: (id: string, patch: Partial<WebsiteNode>) => void;
  moveSelected: (direction: -1 | 1) => void;
}) {
  if (!selected) return <div className="studio-empty-inspector">Select an element</div>;
  const patch = (key: keyof WebsiteNode, value: unknown) => update(selected.id, { [key]: value });
  return (
    <div className="studio-inspector">
      <section className="studio-element-name">
        <div>
          <small>ELEMENT</small>
          <b>{selected.name}</b>
        </div>
        <button onClick={() => patch("locked", !selected.locked)}>
          {selected.locked ? <LockOpen /> : <Lock />}
        </button>
      </section>
      {selected.type !== "shape" && selected.type !== "image" && (
        <section>
          <label className="studio-text-field">
            <small>CONTENT</small>
            <Textarea
              value={selected.text}
              onChange={(event) => patch("text", event.target.value)}
            />
          </label>
        </section>
      )}
      <section>
        <h3>Position & Size</h3>
        <div className="studio-number-grid">
          <NumberField label="X" value={selected.x} onChange={(value) => patch("x", value)} />
          <NumberField label="Y" value={selected.y} onChange={(value) => patch("y", value)} />
          <NumberField
            label="W"
            value={selected.width}
            onChange={(value) => patch("width", value)}
          />
          <NumberField
            label="H"
            value={selected.height}
            onChange={(value) => patch("height", value)}
          />
        </div>
      </section>
      <section>
        <h3>Constraints</h3>
        <div className="studio-constraint">
          <button>
            <span>↦</span>Left
          </button>
          <button>
            <span>↥</span>Top
          </button>
        </div>
      </section>
      <section>
        <h3>Layer order</h3>
        <div className="studio-layer-actions">
          <button onClick={() => moveSelected(-1)}>
            <ArrowUp />
            Up
          </button>
          <button onClick={() => moveSelected(1)}>
            <ArrowDown />
            Down
          </button>
        </div>
      </section>
    </div>
  );
}
function StylePanel({
  selected,
  update,
}: {
  selected: WebsiteNode | null;
  update: (id: string, patch: Partial<WebsiteNode>) => void;
}) {
  if (!selected) return <div className="studio-empty-inspector">Select an element</div>;
  const patch = (key: keyof WebsiteNode, value: unknown) => update(selected.id, { [key]: value });
  return (
    <div className="studio-inspector">
      <section>
        <h3>Fill</h3>
        <label className="studio-color-field">
          <span style={{ background: selected.background }} />
          <input
            type="color"
            value={selected.background.startsWith("#") ? selected.background : "#101912"}
            onChange={(event) => patch("background", event.target.value)}
          />
          <b>{selected.background}</b>
        </label>
      </section>
      <section>
        <h3>Typography</h3>
        <div className="studio-select-row">
          <button onClick={() => patch("fontWeight", selected.fontWeight === 800 ? 400 : 800)}>
            Bold
          </button>
          <button onClick={() => patch("textAlign", "left")}>
            <AlignLeft />
          </button>
          <button onClick={() => patch("textAlign", "center")}>
            <AlignCenter />
          </button>
          <button onClick={() => patch("textAlign", "right")}>
            <AlignRight />
          </button>
        </div>
        <NumberField
          label="Size"
          value={selected.fontSize || 16}
          onChange={(value) => patch("fontSize", value)}
        />
      </section>
      <section>
        <h3>Text color</h3>
        <label className="studio-color-field">
          <span style={{ background: selected.color }} />
          <input
            type="color"
            value={selected.color.startsWith("#") ? selected.color : "#f5f5e6"}
            onChange={(event) => patch("color", event.target.value)}
          />
          <b>{selected.color}</b>
        </label>
      </section>
      <section>
        <h3>Corner radius</h3>
        <input
          className="studio-range"
          type="range"
          min="0"
          max="48"
          value={selected.radius}
          onChange={(event) => patch("radius", Number(event.target.value))}
        />
        <b className="studio-range-value">{selected.radius}px</b>
      </section>
    </div>
  );
}
function EffectsPanel({
  selected,
  update,
}: {
  selected: WebsiteNode | null;
  update: (id: string, patch: Partial<WebsiteNode>) => void;
}) {
  if (!selected) return <div className="studio-empty-inspector">Select an element</div>;
  return (
    <div className="studio-inspector">
      <section>
        <h3>Shadow</h3>
        <button
          className={`studio-toggle ${selected.shadow ? "active" : ""}`}
          onClick={() => update(selected.id, { shadow: !selected.shadow })}
        >
          <span />
        </button>
      </section>
      <section>
        <h3>Border</h3>
        <label className="studio-border-field">
          <input
            value={selected.border || "None"}
            onChange={(event) => update(selected.id, { border: event.target.value })}
          />
        </label>
      </section>
      <section>
        <h3>Opacity</h3>
        <input className="studio-range" type="range" min="0" max="100" defaultValue="100" />
        <b className="studio-range-value">100%</b>
      </section>
    </div>
  );
}
