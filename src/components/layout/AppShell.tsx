/**
 * AppShell composes the persistent editor chrome. The home screen is intentionally
 * presented as a clean launcher; editor chrome returns on the other routes.
 */
import { Outlet, useLocation } from "@tanstack/react-router";
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
  const location = useLocation();
  const isHome = location.pathname === "/";

  if (isHome) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
        <main className="min-h-0 flex-1 overflow-auto"><AppErrorBoundary scope="Home"><Outlet /></AppErrorBoundary></main>
        <CommandPalette />
        <GlobalSearch />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <AppErrorBoundary scope="Toolbar"><TopToolbar /></AppErrorBoundary>
      <div className="flex min-h-0 flex-1">
        <AppErrorBoundary scope="Sidebar"><LeftSidebar /></AppErrorBoundary>
        <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
          <ResizablePanel defaultSize={layout.rightPanelVisible ? 78 : 100} minSize={40}>
            <main className="h-full min-w-0 overflow-auto"><AppErrorBoundary scope="Page"><Outlet /></AppErrorBoundary></main>
          </ResizablePanel>
          {layout.rightPanelVisible && <><ResizableHandle withHandle /><ResizablePanel defaultSize={22} minSize={14} maxSize={40} onResize={(size) => setLayout({ rightPanelWidth: Math.round(size.inPixels) })} className="hidden md:block"><AppErrorBoundary scope="Properties"><RightPanel /></AppErrorBoundary></ResizablePanel></>}
        </ResizablePanelGroup>
      </div>
      <AppErrorBoundary scope="Bottom panel"><BottomPanel /></AppErrorBoundary>
      {layout.statusBarVisible && <AppErrorBoundary scope="Status bar"><StatusBar /></AppErrorBoundary>}
      <CommandPalette />
      <GlobalSearch />
    </div>
  );
}
