/**
 * Right properties panel.
 *
 * Reserved for future use: when a widget/section is selected in the editor,
 * this panel will host its property inspector (style, layout, content,
 * bindings, animation). For milestone 1 it renders an empty state.
 */
import { SlidersHorizontal } from "lucide-react";

export function RightPanel() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-panel text-panel-foreground md:flex">
      <div className="flex h-9 items-center border-b border-border px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Properties
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <SlidersHorizontal className="h-6 w-6 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">No selection</p>
        <p className="text-xs text-muted-foreground/70">
          Select an element in the canvas to edit its properties.
        </p>
      </div>
    </aside>
  );
}
