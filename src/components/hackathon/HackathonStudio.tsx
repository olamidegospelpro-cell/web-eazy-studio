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
  ArrowUp,
  ArrowDown,
  Bot,
  Circle,
  Code2,
  Copy,
  Crop,
  Eye,
  EyeOff,
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
  Hand,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  RotateCcw,
  Save,
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
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/ds/toast";
import { generateWithAiPrototype, refineBlock, type DemoBlock } from "@/lib/hackathon/ai-prototype";
import { GeneratedSitePreview } from "./GeneratedSitePreview";
import { buildGeneratedSiteExportHtml } from "./site-export";
import {
  createWebsiteNode,
  migrateLegacyWebsiteNodes,
  insertWebsiteNode,
  removeWebsiteNodeTree,
  reorderWebsiteSibling,
  useProject,
  type PageDocument,
  type WebsiteNode,
} from "@/lib/project";

type Viewport = "desktop" | "tablet" | "mobile";
type LeftTab = "layers" | "sections" | "pages" | "assets" | "ai";
type RightTab = "properties" | "style" | "effects";
type Tool =
  | "select"
  | "move"
  | "hand"
  | "section"
  | "container"
  | "text"
  | "image"
  | "button"
  | "rectangle"
  | "ellipse"
  | "line";

const viewportWidth: Record<Viewport, number> = { desktop: 1120, tablet: 760, mobile: 390 };
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function getNodeLayout(node: WebsiteNode, viewport: Viewport) {
  return {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    ...(viewport === "desktop" ? {} : node.responsive?.[viewport]),
  };
}

function withNodeLayout(
  node: WebsiteNode,
  viewport: Viewport,
  patch: Partial<Pick<WebsiteNode, "x" | "y" | "width" | "height">>,
): WebsiteNode {
  if (viewport === "desktop") return { ...node, ...patch };
  return {
    ...node,
    responsive: {
      ...node.responsive,
      [viewport]: { ...node.responsive?.[viewport], ...patch },
    },
  };
}

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
  const [rightOpen, setRightOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("sections");
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [tool, setTool] = useState<Tool>("select");
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
  const [gridVisible, setGridVisible] = useState(false);
  const [legacyDraft, setLegacyDraft] = useState<{
    blocks: unknown[];
    businessName?: string;
  } | null>(null);
  const [legacyDraftError, setLegacyDraftError] = useState<string | null>(null);
  const [pendingImagePoint, setPendingImagePoint] = useState<{
    x: number;
    y: number;
    parentId: string | null;
  } | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blocksRef = useRef(blocks);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{
    pointerX: number;
    pointerY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const gestureStartRef = useRef<WebsiteNode[] | null>(null);
  const dragStartRef = useRef<{
    id: string;
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);
  const [fitZoom, setFitZoom] = useState(100);
  const [fitToScreenActive, setFitToScreenActive] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const coalesceRef = useRef<{ key: string; updatedAt: number } | null>(null);
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
    if (!fitToScreenActive) return;
    const scroll = scrollRef.current;
    if (!scroll) return;
    const fit = () => {
      const pageWidth = activePageRef.current?.breakpoints[viewport] ?? viewportWidth[viewport];
      const availableWidth = Math.max(240, scroll.clientWidth - 80);
      const availableHeight = Math.max(240, scroll.clientHeight - 100);
      const scale = Math.min(availableWidth / pageWidth, availableHeight / 900, 1);
      setFitZoom(Math.max(15, Math.floor(scale * 100)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [fitToScreenActive, viewport, activePageId]);

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
  const beginTextEditing = (id: string) => {
    setSelectedId(id);
    setEditingId(id);
    setEditingText(blocks.find((node) => node.id === id)?.text ?? "");
  };
  const endTextEditing = () => {
    const node = blocksRef.current.find((item) => item.id === editingId);
    if (node && node.text !== editingText) {
      commit(
        blocksRef.current.map((item) =>
          item.id === node.id ? { ...item, text: editingText } : item,
        ),
      );
    }
    setEditingId(null);
  };

  const applyBlocks = (next: WebsiteNode[]) => {
    blocksRef.current = next;
    setBlocks(next);
    if (activePage) projectStore.updatePage(activePage.id, { nodes: next });
  };
  const commit = (next: WebsiteNode[], previous = blocksRef.current) => {
    coalesceRef.current = null;
    setHistory((items) => [...items.slice(-29), previous]);
    setFuture([]);
    applyBlocks(next);
  };
  const update = (id: string, patch: Partial<WebsiteNode>) => {
    const next = blocksRef.current.map((node) => {
      if (node.id !== id) return node;
      const layoutPatch: Partial<Pick<WebsiteNode, "x" | "y" | "width" | "height">> = {};
      if (patch.x !== undefined) layoutPatch.x = patch.x;
      if (patch.y !== undefined) layoutPatch.y = patch.y;
      if (patch.width !== undefined) layoutPatch.width = patch.width;
      if (patch.height !== undefined) layoutPatch.height = patch.height;
      const properties = { ...patch };
      delete properties.x;
      delete properties.y;
      delete properties.width;
      delete properties.height;
      const updated = { ...node, ...properties };
      return Object.keys(layoutPatch).length
        ? withNodeLayout(updated, viewport, layoutPatch)
        : updated;
    });
    const key = `${id}:${Object.keys(patch).sort().join(",")}`;
    const now = Date.now();
    if (coalesceRef.current?.key === key && now - coalesceRef.current.updatedAt < 700) {
      coalesceRef.current.updatedAt = now;
      applyBlocks(next);
      return;
    }
    commit(next);
    coalesceRef.current = { key, updatedAt: now };
  };
  const undo = () => {
    if (!history.length) return;
    coalesceRef.current = null;
    const previous = history[history.length - 1];
    setFuture((items) => [blocks, ...items]);
    setHistory((items) => items.slice(0, -1));
    applyBlocks(previous);
  };
  const redo = () => {
    if (!future.length) return;
    coalesceRef.current = null;
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
  const assetSources = new Map(
    (projectStore.bundle?.assetData ?? []).map((asset) => [asset.id, asset.dataUrl]),
  );
  const exportHtml = () => {
    const html = buildGeneratedSiteExportHtml(
      businessName,
      blocks,
      activePage?.breakpoints,
      Object.fromEntries(assetSources),
    );
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
    commit(removeWebsiteNodeTree(blocks, selected.id));
    setSelectedId("");
  };
  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return;
    commit(reorderWebsiteSibling(blocks, selected.id, direction));
  };
  const renameNode = (node: WebsiteNode) => {
    const name = window.prompt("Element name", node.name);
    if (name?.trim()) update(node.id, { name: name.trim() });
  };
  const renderLayerNode = (node: WebsiteNode, depth: number): ReactNode => (
    <div className="studio-layer-item" key={node.id}>
      <div
        className={`studio-layer-row ${selectedId === node.id ? "selected" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          className="studio-layer-select"
          onClick={() => setSelectedId(node.id)}
          onDoubleClick={() => renameNode(node)}
          title={`${node.type}: ${node.name} (double-click to rename)`}
        >
          <GripIcon />
          <span>{node.name}</span>
        </button>
        <button
          className="studio-layer-action"
          aria-label={`${node.visible ? "Hide" : "Show"} ${node.name}`}
          title={node.visible ? "Hide layer" : "Show layer"}
          onClick={() => update(node.id, { visible: !node.visible })}
        >
          {node.visible ? <Eye /> : <EyeOff />}
        </button>
        <button
          className="studio-layer-action"
          aria-label={`${node.locked ? "Unlock" : "Lock"} ${node.name}`}
          title={node.locked ? "Unlock layer" : "Lock layer"}
          onClick={() => update(node.id, { locked: !node.locked })}
        >
          {node.locked ? <Lock /> : <LockOpen />}
        </button>
      </div>
      {node.childIds.map((id) => {
        const child = blocks.find((item) => item.id === id);
        return child ? renderLayerNode(child, depth + 1) : null;
      })}
    </div>
  );
  const renameProjectPage = (pageId: string, currentName: string) => {
    const name = window.prompt("Page name", currentName);
    if (name?.trim()) projectStore.renamePage(pageId, name);
  };
  const deleteProjectPage = (pageId: string) => {
    const page = projectStore.bundle?.pages.find((item) => item.id === pageId);
    if (!page || projectStore.bundle?.pages.length === 1) return;
    if (!window.confirm(`Delete "${page.name}" and all of its content? This cannot be undone.`))
      return;
    projectStore.deletePage(pageId);
    if (selectedPageId === pageId) {
      const next = projectStore.bundle?.pages.find((item) => item.id !== pageId);
      if (next) setSelectedPageId(next.id);
    }
  };
  const nodesById = new Map(blocks.map((node) => [node.id, node]));
  const topLevelNodes = blocks.filter((node) => node.parentId === null);
  const canvasHeight = Math.max(900, ...blocks.map((node) => node.y + node.height + 100));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (selected) {
          event.preventDefault();
          removeSelected();
        }
      } else if (event.key === "Escape") {
        setEditingId(null);
        setSelectedId("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blocks, future, history, removeSelected, redo, selected, undo]);

  const addBlock = (
    block: Parameters<typeof createWebsiteNode>[0],
    parentId: string | null = null,
  ) => {
    const node = createWebsiteNode({ ...block, parentId });
    commit(insertWebsiteNode(blocks, node, parentId));
    setSelectedId(node.id);
    setTool("select");
  };
  const addText = (x: number, y: number, parentId: string | null) =>
    addBlock(
      {
        id: uid("text"),
        type: "text",
        name: "Text",
        text: "Double-click to edit",
        x,
        y,
        width: 360,
        height: 72,
        background: "transparent",
        color: "#1f2937",
        radius: 0,
        locked: false,
        fontSize: 16,
      },
      parentId,
    );
  const addShape = (
    shapeKind: "rectangle" | "ellipse" | "line",
    x: number,
    y: number,
    parentId: string | null,
  ) =>
    addBlock(
      {
        id: uid(shapeKind),
        type: "shape",
        name:
          shapeKind === "rectangle" ? "Rectangle" : shapeKind === "ellipse" ? "Ellipse" : "Line",
        text: "",
        x,
        y,
        width: shapeKind === "line" ? 280 : 240,
        height: shapeKind === "line" ? 2 : 160,
        background: shapeKind === "line" ? "transparent" : "#cbd5e1",
        color: "#1f2937",
        radius: shapeKind === "ellipse" ? 999 : 0,
        locked: false,
        shapeKind,
        borderWidth: shapeKind === "line" ? 2 : 0,
        borderColor: "#334155",
        opacity: 1,
      },
      parentId,
    );
  const addSection = (x = 0, y = 0, name = "Section") => {
    const parentId =
      selected && (selected.type === "section" || selected.type === "container")
        ? selected.id
        : null;
    const sectionWidth = parentId ? 720 : viewportWidth.desktop;
    addBlock(
      {
        id: uid("section"),
        type: "section",
        name,
        text: "",
        x: parentId ? 24 : 0,
        y: parentId ? 24 : y,
        width: sectionWidth,
        height: 320,
        background: "transparent",
        color: "#111827",
        radius: 0,
        locked: false,
        layoutMode: "flow",
        flowDirection: "column",
        padding: 24,
      },
      parentId,
    );
  };
  const addContainer = (x: number, y: number, parentId: string | null) =>
    addBlock(
      {
        id: uid("container"),
        type: "container",
        name: "Container",
        text: "",
        x,
        y,
        width: 520,
        height: 240,
        background: "transparent",
        color: "#111827",
        radius: 0,
        locked: false,
        layoutMode: "flow",
        flowDirection: "column",
        padding: 24,
        gap: 16,
      },
      parentId,
    );
  const addButton = (x: number, y: number, parentId: string | null) =>
    addBlock(
      {
        id: uid("button"),
        type: "button",
        name: "Button",
        text: "Get started",
        x,
        y,
        width: 180,
        height: 48,
        background: "#16a34a",
        color: "#ffffff",
        radius: 8,
        locked: false,
        href: "#",
        padding: 12,
        fontWeight: 700,
      },
      parentId,
    );
  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateWithAiPrototype(prompt);
      commit(
        result.blocks.map((block) =>
          createWebsiteNode({
            ...block,
            color: block.color || "#1f2937",
            parentId: null,
          }),
        ),
      );
      setBusinessName(result.businessName);
      setSelectedId(
        result.blocks.find((block) => block.type === "heading")?.id || result.blocks[0]?.id || "",
      );
    } finally {
      setGenerating(false);
    }
  };
  const uploadImage = async (
    file: File,
    point = pendingImagePoint ?? { x: 80, y: 80, parentId: null },
  ) => {
    try {
      setImageUploadError(null);
      const asset = await projectStore.addImageAsset(file);
      addBlock(
        {
          id: uid("image"),
          type: "image",
          name: asset.name,
          text: "",
          x: point.x,
          y: point.y,
          width: 420,
          height: 280,
          background: "transparent",
          color: "#111827",
          radius: 0,
          locked: false,
          assetId: asset.id,
          alt: asset.name,
          imageFit: "cover",
        },
        point.parentId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "The image could not be uploaded.";
      setImageUploadError(message);
      notify.error("Image upload failed", message);
    }
    setPendingImagePoint(null);
  };
  const insertAsset = (assetId: string) => {
    const asset = projectStore.bundle?.assetData?.find((item) => item.id === assetId);
    if (!asset) return;
    addBlock(
      {
        id: uid("image"),
        type: "image",
        name: asset.name,
        text: "",
        x: 80,
        y: 80,
        width: 420,
        height: 280,
        background: "transparent",
        color: "#111827",
        radius: 0,
        locked: false,
        assetId: asset.id,
        alt: asset.name,
        imageFit: "cover",
      },
      nodeParentId(),
    );
  };
  const share = async () => {
    const shareData = { title: businessName, text: "WebEazy workspace project" };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  const pageWidth = activePage?.breakpoints[viewport] ?? viewportWidth[viewport];
  const effectiveZoom = fitToScreenActive ? fitZoom : zoom;
  const setManualZoom = (value: number) => {
    setFitToScreenActive(false);
    setZoom(Math.max(15, Math.min(200, value)));
  };
  const startPan = (event: PointerEvent<HTMLElement>) => {
    if (tool !== "hand" || !scrollRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    panRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    };
    scrollRef.current.setPointerCapture(event.pointerId);
  };
  const movePan = (event: PointerEvent<HTMLElement>) => {
    const pan = panRef.current;
    const scroll = scrollRef.current;
    if (!pan || !scroll) return;
    scroll.scrollLeft = pan.scrollLeft - (event.clientX - pan.pointerX);
    scroll.scrollTop = pan.scrollTop - (event.clientY - pan.pointerY);
  };
  const endPan = () => {
    panRef.current = null;
  };
  const cancelGesture = () => {
    if (gestureStartRef.current) {
      blocksRef.current = gestureStartRef.current;
      setBlocks(gestureStartRef.current);
    }
    gestureStartRef.current = null;
    dragStartRef.current = null;
    dragOffsetRef.current = null;
    setDragId(null);
    resizeRef.current = null;
    endPan();
  };
  const nodeParentId = () =>
    selected && (selected.type === "section" || selected.type === "container") ? selected.id : null;
  const createAt = (event: PointerEvent<HTMLDivElement>) => {
    if (tool === "select" || tool === "move" || tool === "hand") return;
    const canvas = artboardRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / pageWidth;
    let x = Math.max(0, (event.clientX - rect.left) / scale);
    let y = Math.max(0, (event.clientY - rect.top) / scale);
    if (snapEnabled) {
      x = Math.round(x / 8) * 8;
      y = Math.round(y / 8) * 8;
    }
    const parentId = nodeParentId();
    switch (tool) {
      case "section":
        addSection(0, y, "Section");
        break;
      case "container":
        addContainer(x, y, parentId);
        break;
      case "text":
        addText(x, y, parentId);
        break;
      case "button":
        addButton(x, y, parentId);
        break;
      case "rectangle":
      case "ellipse":
      case "line":
        addShape(tool, x, y, parentId);
        break;
      case "image":
        setPendingImagePoint({ x, y, parentId });
        inputRef.current?.click();
        break;
    }
    event.stopPropagation();
  };

  const align = (direction: "left" | "center" | "right") => {
    if (!selected) return;
    const x =
      direction === "left"
        ? 40
        : direction === "center"
          ? (pageWidth - selected.width) / 2
          : pageWidth - selected.width - 40;
    update(selected.id, { x: Math.max(0, x), textAlign: direction });
  };
  const startDrag = (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => {
    if ((tool !== "move" && tool !== "select") || block.locked) return;
    event.stopPropagation();
    setSelectedId(block.id);
    setDragId(block.id);
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / pageWidth;
    const pointerX = (event.clientX - rect.left) / scale;
    const pointerY = (event.clientY - rect.top) / scale;
    const layout = getNodeLayout(block, viewport);
    gestureStartRef.current = blocksRef.current;
    dragStartRef.current = { id: block.id, x: layout.x, y: layout.y, pointerX, pointerY };
    dragOffsetRef.current = { x: pointerX - layout.x, y: pointerY - layout.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveBlock = (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => {
    const start = dragStartRef.current;
    if (dragId !== block.id || !start || start.id !== block.id) return;
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / pageWidth;
    const pointerX = (event.clientX - rect.left) / scale;
    const pointerY = (event.clientY - rect.top) / scale;
    const x = Math.max(0, start.x + pointerX - start.pointerX);
    const y = Math.max(0, start.y + pointerY - start.pointerY);
    const deltaX = x - start.x;
    const deltaY = y - start.y;
    const movingIds = getNodeTreeIds(blocksRef.current, block.id);
    const startNodes = gestureStartRef.current ?? blocksRef.current;
    const next = startNodes.map((item) =>
      movingIds.has(item.id)
        ? (() => {
            const layout = getNodeLayout(item, viewport);
            return withNodeLayout(item, viewport, {
              x: Math.max(0, layout.x + deltaX),
              y: Math.max(0, layout.y + deltaY),
            });
          })()
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
    const canvas = artboardRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / pageWidth;
    gestureStartRef.current = blocksRef.current;
    const layout = getNodeLayout(block, viewport);
    resizeRef.current = {
      id: block.id,
      corner,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      pointerX: (event.clientX - rect.left) / scale,
      pointerY: (event.clientY - rect.top) / scale,
    };
    setSelectedId(block.id);
    event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
  };
  const resizeBlock = (event: PointerEvent<HTMLDivElement>, block: WebsiteNode) => {
    const resize = resizeRef.current;
    if (!resize || resize.id !== block.id) return;
    const canvas = artboardRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / pageWidth;
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
    const startNodes = gestureStartRef.current ?? blocksRef.current;
    const next = startNodes.map((node) =>
      node.id === block.id ? withNodeLayout(node, viewport, { x, y, width, height }) : node,
    );
    blocksRef.current = next;
    setBlocks(next);
  };
  const finishDrag = () => {
    if (dragStartRef.current) commit(blocksRef.current, gestureStartRef.current ?? blocks);
    else if (resizeRef.current) commit(blocksRef.current, gestureStartRef.current ?? blocks);
    gestureStartRef.current = null;
    dragStartRef.current = null;
    dragOffsetRef.current = null;
    setDragId(null);
    resizeRef.current = null;
  };

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
          <input
            aria-label="Website name"
            className="studio-project-name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            onBlur={() => projectStore.setWebsiteName(businessName)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
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
          <button
            onClick={() => setSnapEnabled((value) => !value)}
            title="Snap to 8 px grid"
            className={snapEnabled ? "active" : ""}
          >
            <span className="studio-snap-label">Snap</span>
          </button>
        </div>
        <div className="studio-actions">
          <button
            className="studio-panel-toggle"
            title="Workspace panels"
            onClick={() => setLeftOpen((value) => !value)}
          >
            <Layers3 />
          </button>
          <button
            className="studio-panel-toggle"
            title="Properties inspector"
            onClick={() => setRightOpen((value) => !value)}
          >
            <Settings2 />
          </button>
          <button
            className="studio-ai-button"
            onClick={() => {
              setLeftOpen(true);
              setLeftTab("ai");
            }}
          >
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
        {!preview && (
          <aside className="studio-tools" aria-label="Canvas tools">
            <div className="studio-tool-group">
              <small>Navigate</small>
              <ToolButton
                label="Select"
                active={tool === "select"}
                icon={<MousePointer2 />}
                onClick={() => setTool("select")}
              />
              <ToolButton
                label="Move"
                active={tool === "move"}
                icon={<Move />}
                onClick={() => setTool("move")}
              />
              <ToolButton
                label="Hand / Pan"
                active={tool === "hand"}
                icon={<Hand />}
                onClick={() => setTool("hand")}
              />
            </div>
            <div className="studio-tool-group">
              <small>Structure</small>
              <ToolButton
                label="Section"
                active={tool === "section"}
                icon={<LayoutTemplate />}
                onClick={() => setTool("section")}
              />
              <ToolButton
                label="Container"
                active={tool === "container"}
                icon={<Frame />}
                onClick={() => setTool("container")}
              />
            </div>
            <div className="studio-tool-group">
              <small>Content</small>
              <ToolButton
                label="Text"
                active={tool === "text"}
                icon={<Type />}
                onClick={() => setTool("text")}
              />
              <ToolButton
                label="Image"
                active={tool === "image"}
                icon={<ImageIcon />}
                onClick={() => setTool("image")}
              />
              <ToolButton
                label="Button"
                active={tool === "button"}
                icon={<Link2 />}
                onClick={() => setTool("button")}
              />
            </div>
            <div className="studio-tool-group">
              <small>Shapes</small>
              <ToolButton
                label="Rectangle"
                active={tool === "rectangle"}
                icon={<Square />}
                onClick={() => setTool("rectangle")}
              />
              <ToolButton
                label="Ellipse"
                active={tool === "ellipse"}
                icon={<Circle />}
                onClick={() => setTool("ellipse")}
              />
              <ToolButton
                label="Line"
                active={tool === "line"}
                icon={<Minus />}
                onClick={() => setTool("line")}
              />
              <ToolButton label="Polygon (not available yet)" disabled icon={<Crop />} />
              <ToolButton label="Pen tool (not available yet)" disabled icon={<Crop />} />
            </div>
          </aside>
        )}
        <aside className={`studio-left ${leftOpen ? "mobile-open" : ""}`}>
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
              <span>AI Assistant</span>
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
                    blocks
                      .filter((node) => node.parentId === null)
                      .map((node) => renderLayerNode(node, 0))
                  ) : (
                    <div className="studio-empty">No elements yet</div>
                  )}
                </div>
              )}
              {leftTab === "sections" && (
                <div className="studio-section-library">
                  <button className="studio-add-section" onClick={() => addSection()}>
                    <Plus /> Add section
                  </button>
                  {blocks
                    .filter((node) => node.type === "section")
                    .map((section) => (
                      <div className="studio-panel-row" key={section.id}>
                        <button onClick={() => setSelectedId(section.id)}>{section.name}</button>
                        <button title="Rename section" onClick={() => renameNode(section)}>
                          Rename
                        </button>
                      </div>
                    ))}
                </div>
              )}
              {leftTab === "pages" && (
                <div className="studio-pages">
                  {projectStore.bundle?.pages.map((page) => (
                    <div className="studio-page-row" key={page.id}>
                      <button
                        className={page.id === activePage?.id ? "selected" : ""}
                        onClick={() => setSelectedPageId(page.id)}
                      >
                        <LayoutTemplate />
                        <span>
                          <b>{page.name}</b>
                          <small>/{page.slug === "index" ? "" : page.slug}</small>
                        </span>
                      </button>
                      <button
                        title="Rename page"
                        onClick={() => renameProjectPage(page.id, page.name)}
                      >
                        Rename
                      </button>
                      {projectStore.bundle?.pages.length !== 1 && (
                        <button title="Delete page" onClick={() => deleteProjectPage(page.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSelectedPageId(projectStore.addPage().id)}>
                    <Plus />
                    <span>Add page</span>
                  </button>
                </div>
              )}
              {leftTab === "assets" && (
                <div className="studio-assets">
                  <button onClick={() => inputRef.current?.click()}>
                    <Upload />
                    <b>Upload image</b>
                    <small>Image · up to 20 MB</small>
                  </button>
                  {imageUploadError && (
                    <p className="studio-upload-error" role="alert">
                      {imageUploadError}
                    </p>
                  )}
                  <div className="studio-asset-grid">
                    {(projectStore.bundle?.assetData ?? []).map((asset) => (
                      <button
                        key={asset.id}
                        title={`Insert ${asset.name}`}
                        onClick={() => insertAsset(asset.id)}
                      >
                        <img src={asset.dataUrl} alt="" />
                        <span>{asset.name}</span>
                      </button>
                    ))}
                    {!projectStore.bundle?.assetData?.length && (
                      <div className="studio-empty">Uploaded images appear here</div>
                    )}
                  </div>
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
          {preview ? (
            <GeneratedSitePreview
              blocks={blocks}
              businessName={businessName}
              viewport={viewport}
              breakpoints={activePage?.breakpoints}
              assetSources={Object.fromEntries(assetSources)}
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
                <button onClick={() => setManualZoom(effectiveZoom - 10)} title="Zoom out">
                  <ZoomOut />
                </button>
                <b>{effectiveZoom}%</b>
                <button onClick={() => setManualZoom(effectiveZoom + 10)} title="Zoom in">
                  <ZoomIn />
                </button>
                <button className="studio-fit" onClick={() => setFitToScreenActive(true)}>
                  Fit to screen
                </button>
                <button className="studio-fit" onClick={() => setFitToScreenActive(false)}>
                  100%
                </button>
              </div>
              <div
                className={`studio-scroll ${tool === "hand" ? "pan-mode" : ""}`}
                ref={scrollRef}
                onPointerDown={startPan}
                onPointerMove={movePan}
                onPointerUp={endPan}
                onPointerCancel={cancelGesture}
              >
                <div className="studio-rulers">
                  <div className="ruler-x" />
                  <div className="ruler-y" />
                </div>
                <div
                  className={`studio-artboard ${gridVisible ? "grid" : ""}`}
                  style={{
                    width: (pageWidth * effectiveZoom) / 100,
                    height: (canvasHeight * effectiveZoom) / 100,
                  }}
                >
                  <div
                    className="studio-artboard-inner"
                    ref={artboardRef}
                    style={{
                      width: pageWidth,
                      height: canvasHeight,
                      transform: `scale(${effectiveZoom / 100})`,
                      transformOrigin: "top left",
                    }}
                    onPointerDown={(event) => {
                      if (event.target === event.currentTarget) {
                        if (tool === "select" || tool === "move") setSelectedId("");
                        else createAt(event);
                      }
                    }}
                    onPointerCancel={cancelGesture}
                  >
                    {topLevelNodes.map((node) => (
                      <CanvasBlock
                        key={node.id}
                        block={node}
                        parent={undefined}
                        nodesById={nodesById}
                        imageSources={assetSources}
                        selectedId={selectedId}
                        editingId={editingId}
                        viewport={viewport}
                        index={topLevelNodes.findIndex((item) => item.id === node.id)}
                        selected={selectedId === node.id}
                        editing={editingId === node.id}
                        tool={tool}
                        onSelect={setSelectedId}
                        onEditStart={beginTextEditing}
                        onEdit={(_id, text) => setEditingText(text)}
                        onEditEnd={endTextEditing}
                        onCreate={createAt}
                        onPanStart={startPan}
                        onContext={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedId(node.id);
                          setContext({ x: event.clientX, y: event.clientY });
                        }}
                        onDragStart={startDrag}
                        onDragMove={moveBlock}
                        onResizeStart={startResize}
                        onResizeMove={resizeBlock}
                        onDragEnd={finishDrag}
                        onCancel={cancelGesture}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {!preview && (
          <aside className={`studio-right ${rightOpen ? "mobile-open" : ""}`}>
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
              <PropertiesPanel
                selected={selected}
                page={activePage}
                viewport={viewport}
                update={update}
                updatePage={(patch) => activePage && projectStore.updatePage(activePage.id, patch)}
                moveSelected={moveSelected}
              />
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
  parent,
  nodesById,
  imageSources,
  selectedId,
  editingId,
  viewport,
  index,
  selected,
  editing,
  tool,
  onSelect,
  onEditStart,
  onEdit,
  onEditEnd,
  onCreate,
  onPanStart,
  onContext,
  onDragStart,
  onDragMove,
  onResizeStart,
  onResizeMove,
  onDragEnd,
  onCancel,
}: {
  block: WebsiteNode;
  parent?: WebsiteNode;
  nodesById: Map<string, WebsiteNode>;
  imageSources: Map<string, string>;
  selectedId: string;
  editingId: string | null;
  viewport: Viewport;
  index: number;
  selected: boolean;
  editing: boolean;
  tool: Tool;
  onSelect: (id: string) => void;
  onEditStart: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditEnd: () => void;
  onCreate: (event: PointerEvent<HTMLDivElement>) => void;
  onPanStart: (event: PointerEvent<HTMLElement>) => void;
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
  onCancel: () => void;
}) {
  const isFlowChild = parent?.layoutMode === "flow";
  const layout = getNodeLayout(block, viewport);
  const parentLayout = parent ? getNodeLayout(parent, viewport) : null;
  const style: CSSProperties = {
    position: isFlowChild ? "relative" : "absolute",
    left: layout.x - (parentLayout?.x ?? 0),
    top: layout.y - (parentLayout?.y ?? 0),
    width: layout.width,
    height: layout.height,
    background: block.shapeKind === "line" ? block.borderColor || block.color : block.background,
    color: block.color,
    borderRadius: block.shapeKind === "ellipse" ? "50%" : block.radius,
    border: block.borderWidth
      ? `${block.borderWidth}px solid ${block.borderColor || block.color}`
      : block.border,
    boxSizing: "border-box",
    zIndex: index + 1,
    padding: block.padding ?? (block.type === "card" ? 20 : 0),
    textAlign: block.textAlign || "left",
    fontSize: block.fontSize || (block.type === "heading" ? 48 : 14),
    fontFamily: block.fontFamily,
    fontWeight: block.fontWeight || (block.type === "heading" ? 800 : 400),
    lineHeight: block.lineHeight || 1.45,
    boxShadow: block.shadow ? "0 20px 50px rgba(0,0,0,.35)" : undefined,
    opacity: block.opacity ?? 1,
    cursor: block.locked ? "not-allowed" : tool === "move" ? "grab" : "default",
    overflow: "hidden",
    display: block.visible
      ? block.type === "section" || block.type === "container"
        ? "flex"
        : "flex"
      : "none",
    flexDirection:
      block.type === "section" || block.type === "container"
        ? block.flowDirection || "column"
        : undefined,
    alignItems: block.type === "section" || block.type === "container" ? "flex-start" : undefined,
    gap: block.type === "section" || block.type === "container" ? (block.gap ?? 0) : undefined,
    flexShrink: 0,
  };
  const imageSrc = block.assetId ? imageSources.get(block.assetId) : block.src;
  const content =
    block.type === "image" && imageSrc ? (
      <img
        src={imageSrc}
        alt={block.alt ?? block.name}
        style={{ width: "100%", height: "100%", objectFit: block.imageFit ?? "cover" }}
        draggable={false}
      />
    ) : block.type === "shape" || block.type === "section" || block.type === "container" ? null : (
      <span
        contentEditable={editing}
        suppressContentEditableWarning
        onInput={(event) => onEdit(block.id, event.currentTarget.innerText)}
        onBlur={onEditEnd}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onEditStart(block.id);
        }}
        onPointerDown={(event) => editing && event.stopPropagation()}
      >
        {block.text}
      </span>
    );
  const Element = block.type === "section" ? "section" : "div";
  return (
    <Element
      className={`studio-canvas-block ${selected ? "selected" : ""}`}
      style={style}
      onPointerDown={(event) => {
        if (tool === "hand") {
          onPanStart(event);
        } else if (tool !== "select" && tool !== "move") {
          event.stopPropagation();
          onCreate(event);
        } else {
          event.stopPropagation();
          if (selected && !editing) onDragStart(event, block);
          else onSelect(block.id);
        }
      }}
      onPointerMove={(event) => {
        onDragMove(event, block);
        onResizeMove(event, block);
      }}
      onPointerUp={onDragEnd}
      onPointerCancel={onCancel}
      onContextMenu={onContext}
      onDoubleClick={() => block.type !== "text" && block.type !== "heading" && onSelect(block.id)}
    >
      {content}
      {block.childIds.map((id, childIndex) => {
        const child = nodesById.get(id);
        return child ? (
          <CanvasBlock
            key={child.id}
            block={child}
            parent={block}
            nodesById={nodesById}
            imageSources={imageSources}
            selectedId={selectedId}
            viewport={viewport}
            index={childIndex}
            selected={selectedId === child.id}
            editing={editingId === child.id}
            tool={tool}
            onSelect={onSelect}
            editingId={editingId}
            onEditStart={onEditStart}
            onEdit={onEdit}
            onEditEnd={onEditEnd}
            onCreate={onCreate}
            onPanStart={onPanStart}
            onContext={onContext}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onResizeStart={onResizeStart}
            onResizeMove={onResizeMove}
            onDragEnd={onDragEnd}
            onCancel={onCancel}
          />
        ) : null;
      })}
      {selected && !block.locked && (
        <>
          <i className="handle nw" onPointerDown={(event) => onResizeStart(event, block, "nw")} />
          <i className="handle ne" onPointerDown={(event) => onResizeStart(event, block, "ne")} />
          <i className="handle sw" onPointerDown={(event) => onResizeStart(event, block, "sw")} />
          <i className="handle se" onPointerDown={(event) => onResizeStart(event, block, "se")} />
        </>
      )}
    </Element>
  );
}

function ToolButton({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "active" : ""}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  useEffect(() => setDraft(String(Math.round(value))), [value]);
  return (
    <label className="studio-number-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = Number(event.target.value);
          if (event.target.value !== "" && Number.isFinite(parsed)) onChange(parsed);
        }}
        onBlur={() => {
          const parsed = Number(draft);
          const clamped = Math.max(
            min ?? Number.NEGATIVE_INFINITY,
            Math.min(max ?? Number.POSITIVE_INFINITY, parsed),
          );
          if (!Number.isFinite(clamped)) setDraft(String(Math.round(value)));
          else {
            setDraft(String(Math.round(clamped)));
            if (clamped !== value) onChange(clamped);
          }
        }}
      />
    </label>
  );
}
function PropertiesPanel({
  selected,
  page,
  viewport,
  update,
  updatePage,
  moveSelected,
}: {
  selected: WebsiteNode | null;
  page: PageDocument | undefined;
  viewport: Viewport;
  update: (id: string, patch: Partial<WebsiteNode>) => void;
  updatePage: (patch: Partial<PageDocument>) => void;
  moveSelected: (direction: -1 | 1) => void;
}) {
  if (!selected) {
    return (
      <div className="studio-inspector">
        <section>
          <h3>Page properties</h3>
          <b>{page?.name || "Untitled page"}</b>
          <p className="studio-inspector-note">Website document · {viewport} layout</p>
        </section>
        {page && (
          <section>
            <h3>Viewport width</h3>
            <NumberField
              label="Width"
              min={320}
              value={page.breakpoints[viewport]}
              onChange={(value) =>
                updatePage({ breakpoints: { ...page.breakpoints, [viewport]: value } })
              }
            />
          </section>
        )}
      </div>
    );
  }
  const patch = (key: keyof WebsiteNode, value: unknown) => update(selected.id, { [key]: value });
  const layout = getNodeLayout(selected, viewport);
  const hasText = ["heading", "text", "button", "card"].includes(selected.type);
  return (
    <div className="studio-inspector">
      <section className="studio-element-name">
        <div>
          <small>{selected.type.toUpperCase()}</small>
          <input
            aria-label="Element name"
            value={selected.name}
            onChange={(event) => patch("name", event.target.value)}
          />
        </div>
        <div className="studio-element-actions">
          <button
            title={selected.visible ? "Hide element" : "Show element"}
            onClick={() => patch("visible", !selected.visible)}
          >
            {selected.visible ? <Eye /> : <EyeOff />}
          </button>
          <button
            title={selected.locked ? "Unlock element" : "Lock element"}
            onClick={() => patch("locked", !selected.locked)}
          >
            {selected.locked ? <Lock /> : <LockOpen />}
          </button>
        </div>
      </section>
      {hasText && (
        <section>
          <label className="studio-text-field">
            <small>Content</small>
            <Textarea
              value={selected.text}
              onChange={(event) => patch("text", event.target.value)}
            />
          </label>
        </section>
      )}
      {selected.type === "button" && (
        <section>
          <label className="studio-input-field">
            <small>Destination URL</small>
            <input
              value={selected.href || ""}
              onChange={(event) => patch("href", event.target.value)}
              placeholder="https://example.com"
            />
          </label>
        </section>
      )}
      {selected.type === "image" && (
        <section className="studio-panel-fields">
          <label className="studio-input-field">
            <small>Alt text</small>
            <input
              value={selected.alt ?? ""}
              onChange={(event) => patch("alt", event.target.value)}
            />
          </label>
          <label className="studio-input-field">
            <small>Image fit</small>
            <select
              value={selected.imageFit ?? "cover"}
              onChange={(event) => patch("imageFit", event.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>
        </section>
      )}
      {(selected.type === "section" || selected.type === "container") && (
        <section className="studio-panel-fields">
          <label className="studio-input-field">
            <small>Layout</small>
            <select
              value={selected.layoutMode ?? "absolute"}
              onChange={(event) => patch("layoutMode", event.target.value)}
            >
              <option value="flow">Flow</option>
              <option value="absolute">Absolute</option>
            </select>
          </label>
          <label className="studio-input-field">
            <small>Direction</small>
            <select
              value={selected.flowDirection ?? "column"}
              onChange={(event) => patch("flowDirection", event.target.value)}
            >
              <option value="column">Vertical</option>
              <option value="row">Horizontal</option>
            </select>
          </label>
        </section>
      )}
      <section>
        <h3>Position & Size</h3>
        <div className="studio-number-grid">
          <NumberField label="X" min={0} value={layout.x} onChange={(value) => patch("x", value)} />
          <NumberField label="Y" min={0} value={layout.y} onChange={(value) => patch("y", value)} />
          <NumberField
            label="W"
            min={1}
            value={layout.width}
            onChange={(value) => patch("width", value)}
          />
          <NumberField
            label="H"
            min={1}
            value={layout.height}
            onChange={(value) => patch("height", value)}
          />
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
  const hasText = ["heading", "text", "button", "card"].includes(selected.type);
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
        <label className="studio-input-field">
          <small>Font family</small>
          <input
            value={selected.fontFamily || "Arial"}
            onChange={(event) => patch("fontFamily", event.target.value)}
            disabled={!hasText}
          />
        </label>
        <div className="studio-select-row">
          <button
            disabled={!hasText}
            className={selected.fontWeight && selected.fontWeight >= 700 ? "selected" : ""}
            onClick={() => patch("fontWeight", selected.fontWeight === 800 ? 400 : 800)}
          >
            Bold
          </button>
          <button
            disabled={!hasText}
            className={selected.textAlign === "left" || !selected.textAlign ? "selected" : ""}
            onClick={() => patch("textAlign", "left")}
          >
            <AlignLeft />
          </button>
          <button
            disabled={!hasText}
            className={selected.textAlign === "center" ? "selected" : ""}
            onClick={() => patch("textAlign", "center")}
          >
            <AlignCenter />
          </button>
          <button
            disabled={!hasText}
            className={selected.textAlign === "right" ? "selected" : ""}
            onClick={() => patch("textAlign", "right")}
          >
            <AlignRight />
          </button>
        </div>
        <NumberField
          label="Size"
          value={selected.fontSize || 16}
          min={1}
          onChange={(value) => patch("fontSize", value)}
        />
        <NumberField
          label="Line height"
          value={selected.lineHeight || 1.45}
          min={0.5}
          onChange={(value) => patch("lineHeight", value)}
        />
        <NumberField
          label="Padding"
          value={selected.padding ?? 0}
          min={0}
          onChange={(value) => patch("padding", value)}
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
        <h3>Border</h3>
        <div className="studio-number-grid">
          <NumberField
            label="Width"
            value={selected.borderWidth ?? 0}
            min={0}
            onChange={(value) => patch("borderWidth", value)}
          />
          <NumberField
            label="Radius"
            value={selected.radius}
            min={0}
            onChange={(value) => patch("radius", value)}
          />
        </div>
        <label className="studio-color-field">
          <span style={{ background: selected.borderColor || selected.color }} />
          <input
            type="color"
            value={selected.borderColor?.startsWith("#") ? selected.borderColor : "#334155"}
            onChange={(event) => patch("borderColor", event.target.value)}
          />
          <b>{selected.borderColor || "Border color"}</b>
        </label>
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
            value={selected.border || ""}
            placeholder="CSS border, e.g. 1px solid #ddd"
            onChange={(event) => update(selected.id, { border: event.target.value })}
          />
        </label>
      </section>
      <section>
        <h3>Opacity</h3>
        <input
          className="studio-range"
          type="range"
          min="0"
          max="100"
          value={Math.round((selected.opacity ?? 1) * 100)}
          onChange={(event) => update(selected.id, { opacity: Number(event.target.value) / 100 })}
        />
        <b className="studio-range-value">{Math.round((selected.opacity ?? 1) * 100)}%</b>
      </section>
    </div>
  );
}
