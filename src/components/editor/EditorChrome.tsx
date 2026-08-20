import { Lock, Layers3 } from "lucide-react";
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
  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-white lg:flex">
      <div className="flex h-10 items-center gap-2 border-b px-3 text-xs font-semibold">
        <Layers3 className="size-4" /> Layers
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {rootIds.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">No elements yet.</p>
        ) : (
          rootIds.map((id) => (
            <LayerRow
              key={id}
              id={id}
              nodes={nodes}
              selected={selected}
              onSelect={onSelect}
              onToggleLock={onToggleLock}
              depth={0}
            />
          ))
        )}
      </div>
    </aside>
  );
}
function LayerRow({
  id,
  nodes,
  selected,
  onSelect,
  onToggleLock,
  depth,
}: {
  id: NodeId;
  nodes: Record<NodeId, EditorNode>;
  selected: NodeId | null;
  onSelect: (id: NodeId) => void;
  onToggleLock: (id: NodeId) => void;
  depth: number;
}) {
  const node = nodes[id];
  if (!node) return null;
  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs ${selected === id ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button className="min-w-0 flex-1 truncate text-left" onClick={() => onSelect(id)}>
          {node.name}
        </button>
        <button
          title={node.locked ? "Unlock" : "Lock"}
          onClick={() => onToggleLock(id)}
          className="rounded p-1 text-muted-foreground hover:bg-background"
        >
          <Lock className="size-3" />
        </button>
      </div>
      {node.childIds.map((child) => (
        <LayerRow
          key={child}
          id={child}
          nodes={nodes}
          selected={selected}
          onSelect={onSelect}
          onToggleLock={onToggleLock}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
