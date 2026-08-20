import { useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Lock, MousePointer2, Monitor, Smartphone, Tablet, Undo2, Redo2, ZoomIn, ZoomOut, Plus, Eye, Square } from "lucide-react";
import { editorStore, useEditorStore, createEditorNode, appendChild } from "@/lib/editor";
import type { EditorBreakpoint, EditorNode, NodeId } from "@/lib/editor";

const breakpointIcons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;
type Tool = "select" | "shape";

export function EditorWorkspace() {
  const state = useEditorStore();
  const root = state.document.nodes[state.document.rootNodeId];
  const selected = state.selection.primaryNodeId;
  const nodes = state.document.nodes;
  const [tool, setTool] = useState<Tool>("select");
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);
  const topLevel = useMemo(() => root?.childIds ?? [], [root]);

  const addNode = (type: "section" | "heading" | "text" | "button") => {
    const parentId = selected && nodes[selected] && !nodes[selected].locked ? selected : state.document.rootNodeId;
    const node = createEditorNode(type, { parentId });
    const nextNodes = { ...nodes, [node.id]: node };
    const withChild = appendChild(nextNodes, parentId, node.id);
    editorStore.commit({ ...state.document, nodes: withChild }, `Add ${node.name}`);
    editorStore.select([node.id], node.id);
  };

  const drawShape = (event: PointerEvent<HTMLDivElement>) => {
    if (tool !== "shape") return;
    const rect = event.currentTarget.getBoundingClientRect();
    drawStart.current = { x: Math.max(0, event.clientX - rect.left), y: Math.max(0, event.clientY - rect.top) };
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishShape = (event: PointerEvent<HTMLDivElement>) => {
    if (tool !== "shape" || !drawing.current || !drawStart.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const endX = Math.max(0, event.clientX - rect.left);
    const endY = Math.max(0, event.clientY - rect.top);
    const start = drawStart.current;
    const width = Math.max(24, Math.abs(endX - start.x));
    const height = Math.max(24, Math.abs(endY - start.y));
    const left = Math.min(start.x, endX);
    const top = Math.min(start.y, endY);
    const node = createEditorNode("shape", {
      parentId: state.document.rootNodeId,
      locked: true,
      props: { shape: "rectangle" },
      styles: { position: "absolute", left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, background: "#e5e7eb", borderRadius: "8px", border: "1px solid #cbd5e1" },
    });
    const nextNodes = { ...state.document.nodes, [node.id]: node };
    const withChild = appendChild(nextNodes, state.document.rootNodeId, node.id);
    editorStore.commit({ ...state.document, nodes: withChild }, "Draw rectangle");
    editorStore.select([node.id], node.id);
    drawStart.current = null;
    drawing.current = false;
    setTool("select");
  };

  const setBreakpoint = (breakpoint: EditorBreakpoint["id"]) => editorStore.setViewport({ breakpoint });
  const selectedNode = selected ? nodes[selected] : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-foreground">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-white px-2">
        <div className="flex items-center gap-1"><ToolbarButton label="Undo" disabled={!state.history.canUndo} onClick={() => editorStore.undo()}><Undo2 className="size-4" /></ToolbarButton><ToolbarButton label="Redo" disabled={!state.history.canRedo} onClick={() => editorStore.redo()}><Redo2 className="size-4" /></ToolbarButton><div className="mx-2 h-5 w-px bg-border" /><span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Design</span></div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">{(Object.keys(breakpointIcons) as EditorBreakpoint["id"][]).map((breakpoint) => { const Icon = breakpointIcons[breakpoint]; return <button key={breakpoint} title={breakpoint} onClick={() => setBreakpoint(breakpoint)} className={`rounded-md p-1.5 ${state.viewport.breakpoint === breakpoint ? "bg-muted text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-4" /></button>; })}</div>
        <div className="flex items-center gap-1"><ToolbarButton label="Zoom out" onClick={() => editorStore.setViewport({ zoom: Math.max(0.25, state.viewport.zoom - 0.1) })}><ZoomOut className="size-4" /></ToolbarButton><span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(state.viewport.zoom * 100)}%</span><ToolbarButton label="Zoom in" onClick={() => editorStore.setViewport({ zoom: Math.min(2, state.viewport.zoom + 0.1) })}><ZoomIn className="size-4" /></ToolbarButton>{selectedNode && <button title={selectedNode.locked ? "Unlock selected" : "Lock selected"} onClick={() => editorStore.toggleLock(selectedNode.id)} className="ml-2 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Lock className="size-3.5" /></button>}<button className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"><Eye className="size-3.5" /> Preview</button></div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-white py-2"><ToolButton active={tool === "select"} label="Select" onClick={() => setTool("select")}><MousePointer2 className="size-4" /></ToolButton><ToolButton active={tool === "shape"} label="Draw rectangle" onClick={() => setTool("shape")}><Square className="size-4" /></ToolButton><div className="my-1 h-px w-7 bg-border" /><ToolButton label="Add section" onClick={() => addNode("section")}><Plus className="size-4" /></ToolButton></aside>
        <div className="min-h-0 flex-1 overflow-auto bg-white p-8"><div className="mx-auto min-h-[720px] origin-top bg-white shadow-xl transition-[width] duration-200" style={{ width: state.viewport.breakpoint === "desktop" ? "1200px" : state.viewport.breakpoint === "tablet" ? "768px" : "390px", transform: `scale(${state.viewport.zoom})`, transformOrigin: "top center" }}><div className={`relative min-h-[720px] p-8 ${tool === "shape" ? "cursor-crosshair" : ""}`} onPointerDown={drawShape} onPointerUp={finishShape}>{topLevel.length === 0 ? <EmptyCanvas onAdd={() => addNode("section")} /> : topLevel.map((id) => <CanvasNode key={id} id={id} nodes={nodes} selected={selected} onSelect={(nodeId) => { if (tool === "select") editorStore.select([nodeId], nodeId); }} />)}</div></div></div>
      </div>
      {tool === "shape" && <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-white px-4 py-2 text-xs font-medium shadow-lg">Drag on the canvas to draw a rectangle · it will lock after creation</div>}
    </div>
  );
}

function CanvasNode({ id, nodes, selected, onSelect }: { id: NodeId; nodes: Record<NodeId, EditorNode>; selected: NodeId | null; onSelect: (id: NodeId) => void }) {
  const node = nodes[id];
  if (!node) return null;
  const isSelected = selected === id;
  const isShape = node.type === "shape";
  return <div className={`${isShape ? "absolute" : "relative mb-4"} rounded-md border p-5 transition-shadow ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/30"} ${node.locked ? "select-none" : ""}`} style={node.styles as CSSProperties} onClick={(event) => { event.stopPropagation(); onSelect(id); }}>{!isShape && <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{node.name}{node.locked ? " · Locked" : ""}</div>}{isShape ? null : node.type === "section" || node.type === "container" ? <div className="space-y-3 rounded border border-dashed border-border p-4">{node.childIds.length ? node.childIds.map((childId) => <CanvasNode key={childId} id={childId} nodes={nodes} selected={selected} onSelect={onSelect} />) : <span className="text-xs text-muted-foreground">Drop content here</span>}</div> : node.type === "heading" ? <h1 className="text-4xl font-bold text-foreground">{String(node.props.text ?? "Heading")}</h1> : node.type === "button" ? <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{String(node.props.text ?? "Button")}</button> : <p className="text-sm text-muted-foreground">{String(node.props.text ?? node.name)}</p>}</div>;
}

function EmptyCanvas({ onAdd }: { onAdd: () => void }) { return <div className="flex min-h-[620px] items-center justify-center rounded border border-dashed border-border bg-muted/10"><div className="text-center"><p className="text-sm font-medium text-foreground">Your canvas is ready</p><p className="mt-1 text-xs text-muted-foreground">Choose a tool on the left or start with a section.</p><button onClick={onAdd} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add your first section</button></div></div>; }
function ToolbarButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) { return <button title={label} disabled={disabled} onClick={onClick} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">{children}</button>; }
function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) { return <button title={label} aria-label={label} onClick={onClick} className={`rounded-md p-2 ${active ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{children}</button>; }
