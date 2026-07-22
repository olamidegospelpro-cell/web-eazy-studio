/**
 * AppShell composes the persistent desktop-style chrome:
 *
 *   ┌───────────── TopToolbar ─────────────┐
 *   │ Left │        Outlet         │ Right │
 *   │ Nav  │        (page)         │ Panel │
 *   ├──────────── BottomPanel ─────────────┤
 *
 * The shell is intentionally frame-agnostic — it renders the same in the web
 * preview and inside the future Tauri window. Page content is injected via
 * TanStack Router's <Outlet />.
 */
import { Outlet } from "@tanstack/react-router";
import { TopToolbar } from "./TopToolbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightPanel } from "./RightPanel";
import { BottomPanel } from "./BottomPanel";

export function AppShell() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TopToolbar />
      <div className="flex min-h-0 flex-1">
        <LeftSidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
        <RightPanel />
      </div>
      <BottomPanel />
    </div>
  );
}
