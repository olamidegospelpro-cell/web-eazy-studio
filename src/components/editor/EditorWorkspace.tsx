import { useMemo, type ReactNode } from "react";
import { Monitor, Smartphone, Tablet, Undo2, Redo2, ZoomIn, ZoomOut, Plus, Eye } from "lucide-react";
import { editorStore, useEditorStore, createEditorNode, appendChild } from "@/lib/editor";
import type { EditorBreakpoint, EditorNode, NodeId } from "@/lib/editor";

const breakpointIcons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;

export function EditorWorkspace() {
  const state = useEditorStore();
  const root = state.document.nodes[state.document.rootNodeId];
  const selected = state.selection.primaryNodeId;
  const nodes = state.document.nodes;

  const topLevel = useMemo(() => root?.childIds ?? [], [root]);

  const addNode = (type: "section" | "heading" | "text" | "button") => {
    const parentId = selected && nodes[selected] ? selected : state.document.rootNodeId;
    const node = createEditorNode(type, { parentId });
    const nextNodes = { ...nodes, [node.id]: node };
    const withChild = appendChild(nextNodes, parentId, node.id);
    editorStore.commit({ ...state.document, nodes: withChild }, `Add ${node.name}`);
    editorStore.select([node.id], node.id);
  };

  const setBreakpoint = (breakpoint: EditorBreakpoint["id"]) => editorStore.setViewport({ breakpoint });

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--canvas)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-2">
        <div className="flex items-center gap-1">
          <ToolbarButton label="Undo" disabled={!state.history.canUndo} onClick={() => editorStore.undo()}><Undo2 className="size-4" /></ToolbarButton>
          <ToolbarButton label="Redo" disabled={!state.history.canRedo} onClick={() => editorStore.redo()}><Redo2 className="size-4" /></ToolbarButton>
          <div className="mx-2 h-5 w-px bg-border" />
          <ToolbarButton label="Add section" onClick={() => addNode("section")}><Plus className="size-4" /></ToolbarButton>
          <button className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => addNode("heading")}>Heading</button>
          <button className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => addNode("text")}>Text</button>
          <button className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => addNode("button")}>Button</button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(Object.keys(breakpointIcons) as EditorBreakpoint["id"][]).map((breakpoint) => {
            const Icon = breakpointIcons[breakpoint];
            return <button key={breakpoint} title={breakpoint} onClick={() => setBreakpoint(breakpoint)} className={`rounded-md p-1.5 ${state.viewport.breakpoint === breakpoint ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-4" /></button>;
          })}
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton label="Zoom out" onClick={() => editorStore.setViewport({ zoom: Math.max(0.25, state.viewport.zoom - 0.1) })}><ZoomOut className="size-4" /></ToolbarButton>
          <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(state.viewport.zoom * 100)}%</span>
          <ToolbarButton label="Zoom in" onClick={() => editorStore.setViewport({ zoom: Math.min(2, state.viewport.zoom + 0.1) })}><ZoomIn className="size-4" /></ToolbarButton>
          <button className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"><Eye className="size-3.5" /> Preview</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto min-h-[720px] origin-top bg-white shadow-xl transition-[width] duration-200" style={{ width: state.viewport.breakpoint === "desktop" ? "1200px" : state.viewport.breakpoint === "tablet" ? "768px" : "390px", transform: `scale(${state.viewport.zoom})`, transformOrigin: "top center" }}>
          <div className="min-h-[720px] p-8">
            {topLevel.length === 0 ? <EmptyCanvas onAdd={() => addNode("section")} /> : topLevel.map((id) => <CanvasNode key={id} id={id} nodes={nodes} selected={selected} onSelect={(nodeId) => editorStore.select([nodeId], nodeId)} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasNode({ id, nodes, selected, onSelect }: { id: NodeId; nodes: Record<NodeId, EditorNode>; selected: NodeId | null; onSelect: (id: NodeId) => void }) {
  const node = nodes[id];
  if (!node) return null;
  const isSelected = selected === id;
  return (
    <div className={`relative mb-4 min-h-24 rounded-md border p-5 transition-shadow ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/30"}`} onClick={(event) => { event.stopPropagation(); onSelect(id); }}>
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{node.name}</div>
      {node.type === "section" || node.type === "container" ? <div className="space-y-3 rounded border border-dashed border-border p-4">{node.childIds.length ? node.childIds.map((childId) => <CanvasNode key={childId} id={childId} nodes={nodes} selected={selected} onSelect={onSelect} />) : <span className="text-xs text-muted-foreground">Drop content here</span>}</div> : node.type === "heading" ? <h1 className="text-4xl font-bold text-foreground">{String(node.props.text ?? "Heading")}</h1> : node.type === "button" ? <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{String(node.props.text ?? "Button")}</button> : <p className="text-sm text-muted-foreground">{String(node.props.text ?? node.name)}</p>}
    </div>
  );
}

function EmptyCanvas({ onAdd }: { onAdd: () => void }) {
  return <div className="flex min-h-[620px] items-center justify-center rounded border border-dashed border-border bg-muted/10"><div className="text-center"><p className="text-sm font-medium text-foreground">Your canvas is ready</p><p className="mt-1 text-xs text-muted-foreground">Start with a section, then add content inside it.</p><button onClick={onAdd} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add your first section</button></div></div>;
}

function ToolbarButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <button title={label} disabled={disabled} onClick={onClick} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}
