import { useEffect, useState } from "react";
import { ArrowRight, FolderOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectWizard } from "@/components/project/wizard/NewProjectWizard";
import { RecentProjectsPanel } from "@/components/project/RecentProjectsPanel";
import { HackathonStudio } from "@/components/hackathon/HackathonStudio";
import { useProject } from "@/lib/project";

function WebEazyBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
      <img src="/webeazy-logo.svg" alt="" aria-hidden="true" className={compact ? "h-7 w-9 object-contain" : "h-11 w-16 object-contain"} />
      <span className={`${compact ? "text-base" : "text-2xl"} font-semibold tracking-[-0.045em] text-[#f5f5e6]`}>WebEazy</span>
    </div>
  );
}

export function HomeScreen() {
  const store = useProject();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioProjectName, setStudioProjectName] = useState("Untitled project");

  useEffect(() => {
    const open = () => setWizardOpen(true);
    window.addEventListener("webeazy:new-project", open);
    return () => window.removeEventListener("webeazy:new-project", open);
  }, []);

  const openStudio = (name = store.bundle?.manifest.name || "Untitled project") => {
    setStudioProjectName(name);
    setStudioOpen(true);
  };

  return (
    <div className="webeazy-brand webeazy-home relative flex min-h-full flex-col overflow-hidden">
      <img src="/webeazy-logo.svg" alt="" aria-hidden="true" className="webeazy-watermark" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-9">
        <WebEazyBrand />
        <div className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] text-white/40 backdrop-blur sm:block">VISUAL WEBSITE STUDIO</div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-14 pt-3 sm:px-8 sm:pt-0">
        <div className="w-full max-w-4xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 backdrop-blur"><span className="size-1.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,.75)]" />Design freely. Build intelligently.</div>
            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#f5f5e6] sm:text-6xl">Create Amazing <span className="text-[#22c55e]">Web Experiences</span></h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-[15px]">Design. Build. Launch — all in one place. Start from a blank canvas or let WebEazy create an editable first draft with AI.</p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setWizardOpen(true)} className="webeazy-home-card group relative overflow-hidden rounded-[22px] p-6 text-left transition duration-200 hover:-translate-y-1">
              <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-white/[0.035]" />
              <div className="relative mb-11 flex size-11 items-center justify-center rounded-2xl bg-white/[0.06] text-[#f5f5e6] ring-1 ring-white/10"><Plus className="size-5" /></div>
              <div className="relative"><h2 className="text-xl font-semibold tracking-[-0.025em] text-[#f5f5e6]">Create Project</h2><p className="mt-2 max-w-sm text-xs leading-6 text-white/43">Start with a clean canvas and design your website your way.</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-white/75">Start blank <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 group-hover:text-[#22c55e]" /></span></div>
            </button>

            <button type="button" onClick={() => openStudio()} className="webeazy-home-card group relative overflow-hidden rounded-[22px] p-6 text-left transition duration-200 hover:-translate-y-1">
              <div className="absolute -right-8 -top-10 size-40 rounded-full bg-[#8b5cf6]/12 blur-3xl" /><div className="absolute -bottom-12 left-8 size-36 rounded-full bg-[#22c55e]/10 blur-3xl" />
              <div className="relative mb-11 flex size-11 items-center justify-center rounded-2xl bg-[#22c55e]/10 text-[#22c55e] ring-1 ring-[#22c55e]/20"><Sparkles className="size-5" /></div>
              <div className="relative"><div className="mb-1 flex items-center gap-2"><h2 className="text-xl font-semibold tracking-[-0.025em] text-[#f5f5e6]">Create with AI</h2><span className="rounded-full border border-[#22c55e]/20 bg-[#22c55e]/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#7cf2a0]">AI Studio</span></div><p className="mt-2 max-w-sm text-xs leading-6 text-white/43">Describe your idea and get an editable website starting point in seconds.</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#dfffe8]">Open AI Studio <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></div>
            </button>
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 px-4 py-2.5 backdrop-blur"><div className="flex min-w-0 items-center gap-2 text-xs text-white/40"><FolderOpen className="size-4 shrink-0" /><span className="truncate">{store.bundle ? <>Open: <strong className="text-white/70">{store.bundle.manifest.name}</strong></> : "No project open"}</span></div><div className="flex shrink-0 gap-1.5"><Button size="sm" variant="ghost" className="text-white/55 hover:bg-white/5 hover:text-white" onClick={() => void store.openFromPicker()}>{store.capabilities.nativePicker ? "Open project" : "Open workspace"}</Button>{store.bundle && <Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/5 hover:text-white" onClick={() => openStudio(store.bundle?.manifest.name)}>Open in Studio</Button>}</div></div>
          {store.recents.length > 0 && <div className="mx-auto mt-8 max-w-3xl"><div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Recent projects</div><RecentProjectsPanel onNewProject={() => setWizardOpen(true)} /></div>}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-6 py-3 text-center text-[10px] font-medium tracking-[0.12em] text-white/25">AI handles the complexity. <span className="text-[#22c55e]">You keep the creativity.</span></footer>
      <NewProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(name) => openStudio(name)} />
      {studioOpen && <HackathonStudio initialBusinessName={studioProjectName} onClose={() => setStudioOpen(false)} />}
    </div>
  );
}
