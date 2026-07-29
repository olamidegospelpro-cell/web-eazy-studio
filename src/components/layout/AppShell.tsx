/**
 * AppShell composes the persistent desktop-style chrome:
 *
 *   ┌───────────── TopToolbar ─────────────┐
 *   │ Left │        Outlet         │ Right │  ← resizable, persisted
 *   ├──────────── BottomPanel ─────────────┤
 *   └───────────── StatusBar ──────────────┘
 *
 * Window management (panel sizes, collapse state) lives in `useUi()` and is
 * persisted through PreferencesService, so layout survives reloads. Each
 * region is wrapped in an error boundary: a crash in one panel never takes
 * down the whole application.
 */
import { Outlet } from "@tanstack/react-router";
import { TopToolbar } from "./TopToolbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightPanel } from "./RightPanel";
import { BottomPanel } from "./BottomPanel";
import { StatusBar } from "./StatusBar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AppErrorBoundary } from "@/components/core/AppErrorBoundary";
import { CommandPalette } from "@/components/core/CommandPalette";
import { GlobalSearch } from "@/components/core/GlobalSearch";
import { useUi } from "@/lib/core";

export function AppShell() {
  const { layout, setLayout } = useUi();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <AppErrorBoundary scope="Toolbar">
        <TopToolbar />
      </AppErrorBoundary>

      <div className="flex min-h-0 flex-1">
        <AppErrorBoundary scope="Sidebar">
          <LeftSidebar />
        </AppErrorBoundary>

        <ResizablePanelGroup direction="horizontal" className="min-w-0 flex-1">
          <ResizablePanel defaultSize={layout.rightPanelVisible ? 78 : 100} minSize={40}>
            <main className="h-full min-w-0 overflow-auto">
              <AppErrorBoundary scope="Page">
                <Outlet />
              </AppErrorBoundary>
            </main>
          </ResizablePanel>

          {layout.rightPanelVisible && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={22}
                minSize={14}
                maxSize={40}
                onResize={(size) => setLayout({ rightPanelWidth: Math.round(size) })}
                className="hidden md:block"
              >
                <AppErrorBoundary scope="Properties">
                  <RightPanel />
                </AppErrorBoundary>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <AppErrorBoundary scope="Bottom panel">
        <BottomPanel />
      </AppErrorBoundary>
      {layout.statusBarVisible && (
        <AppErrorBoundary scope="Status bar">
          <StatusBar />
        </AppErrorBoundary>
      )}

      <CommandPalette />
      <GlobalSearch />
    </div>
  );
}
