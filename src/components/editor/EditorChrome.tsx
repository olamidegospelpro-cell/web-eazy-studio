import { Lock, Layers3, Settings2 } from "lucide-react";
import type { EditorNode, NodeId } from "@/lib/editor";

export function EditorChrome({
  nodes,
  rootIds,
  selected,
  onSelect,
  onToggleLock,
}: {
  nodes: Record<NodeId, EditorNode>;
  rootIds: NodeId[];
  selected: NodeId | null;
  onSelect: (id: NodeId) => void;
  onToggleLock: (id: NodeId) => void;
}) {
  const node = selected ? nodes[selected] : undefined;
  return (
    <>
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="flex h-10 items-center gap-2 border-b px-3 text-xs font-semibold"><Layers3 className="size-4" /> Layers</div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {rootIds.length === 0 ? <p className="p-2 text-xs text-muted-foreground">No elements yet.</p> : rootIds.map((id) => <LayerRow key={id} id={id} nodes={nodes} selected={selected} onSelect={onSelect} onToggleLock={onToggleLock} depth={0} />)}
        </div>
      </aside>
      <aside className="hidden w-64 shrink-0 flex-col border-l border-border bg-white xl:flex">
        <div className="flex h-10 items-center gap-2 border-b px-3 text-xs font-semibold"><Settings2 className="size-4" /> Properties</div>
        {node ? <Inspector node={node} onToggleLock={() => onToggleLock(node.id)} /> : <div className="p-4 text-xs text-muted-foreground">Select an element to edit its properties.</div>}
      </aside>
    </>
  );
}

function LayerRow({ id, nodes, selected, onSelect, onToggleLock, depth }: { id: NodeId; nodes: Record<NodeId, EditorNode>; selected: NodeId | null; onSelect: (id: NodeId) => void; onToggleLock: (id: NodeId) => void; depth: number }) {
  const node = nodes[id];
  if (!node) return null;
  return <div>
    <div className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs ${selected === id ? "bg-muted font-medium" : "hover:bg-muted/60"}`} style={{ paddingLeft: `${8 + depth * 14}px` }}>
      <button className="min-w-0 flex-1 truncate text-left" onClick={() => onSelect(id)}>{node.name}</button>
      <button title={node.locked ? "Unlock" : "Lock"} onClick={() => onToggleLock(id)} className="rounded p-1 text-muted-foreground hover:bg-background"><Lock className="size-3" /></button>
    </div>
    {node.childIds.map((child) => <LayerRow key={child} id={child} nodes={nodes} selected={selected} onSelect={onSelect} onToggleLock={onToggleLock} depth={depth + 1} />)}
  </div>;
}

function Inspector({ node, onToggleLock }: { node: EditorNode; onToggleLock: () => void }) {
  const style = node.styles as Record<string, unknown>;
  return <div className="space-y-4 overflow-auto p-3 text-xs">
    <div><div className="mb-1 font-medium">Element</div><div className="rounded-md border bg-muted/20 px-2 py-1.5">{node.name}</div></div>
    <div><div className="mb-1 font-medium">Type</div><div className="rounded-md border px-2 py-1.5 capitalize">{node.type}</div></div>
    <div><div className="mb-2 font-medium">Layout</div><div className="grid grid-cols-2 gap-2">{["width", "height", "left", "top"].map((key) => <div key={key}><label className="mb-1 block text-muted-foreground">{key}</label><div className="rounded-md border bg-muted/20 px-2 py-1.5">{String(style[key] ?? "auto")}</div></div>)}</div></div>
    <div><div className="mb-2 font-medium">Appearance</div><div className="space-y-2"><div className="rounded-md border bg-muted/20 px-2 py-1.5">Background: {String(style.background ?? "transparent")}</div><div className="rounded-md border bg-muted/20 px-2 py-1.5">Radius: {String(style.borderRadius ?? "0")}</div></div></div>
    <button onClick={onToggleLock} className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 font-medium hover:bg-muted"><Lock className="size-3.5" /> {node.locked ? "Unlock element" : "Lock element"}</button>
  </div>;
}
