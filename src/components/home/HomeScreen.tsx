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
      <span className={`${compact ? "text-base" : "text-2xl"} font-semibold tracking-[-0.045em] text-[#24262d]`}>
        Web<span className="text-violet-600">Eazy</span>
      </span>
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
    <div className="webeazy-app-root relative flex min-h-full flex-col overflow-hidden bg-[#f4f1e9] text-[#24262d]">
      <style>{`
        .webeazy-app-root { font-family: Poppins, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        .webeazy-app-root .webeazy-studio-brand-mark { background: #f4f1e9 url('/webeazy-logo.svg') center / 26px auto no-repeat !important; color: transparent !important; }
        .webeazy-app-root .webeazy-studio-brand-mark::first-letter { color: transparent; }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.035]">
        <img src="/webeazy-logo.svg" alt="" className="h-[min(52vw,560px)] w-[min(80vw,860px)] object-contain" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-9">
        <WebEazyBrand />
        <div className="hidden rounded-full border border-[#24262d]/10 bg-white/55 px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] text-[#24262d]/55 backdrop-blur sm:block">
          VISUAL WEBSITE STUDIO
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-8 sm:pt-0">
        <div className="w-full max-w-3xl">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#24262d]/10 bg-white/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#24262d]/55 shadow-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Design freely. Build intelligently.
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#24262d] sm:text-5xl">
              Create something <span className="text-violet-600">WebEazy.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#24262d]/55 sm:text-[15px]">
              Start from a blank canvas or let AI create an editable first draft. You stay in control of every element.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setWizardOpen(true)} className="group relative overflow-hidden rounded-[22px] border border-[#24262d]/10 bg-white/80 p-6 text-left shadow-[0_18px_55px_rgba(36,38,45,0.08)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-[#24262d]/20 hover:shadow-[0_24px_70px_rgba(36,38,45,0.12)]">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-7 -translate-y-7 rounded-full bg-[#24262d]/[0.035]" />
              <div className="relative mb-12 flex size-11 items-center justify-center rounded-2xl bg-[#24262d] text-[#f4f1e9] shadow-sm"><Plus className="size-5" /></div>
              <div className="relative"><h2 className="text-lg font-semibold tracking-[-0.025em]">Create project</h2><p className="mt-1.5 max-w-xs text-xs leading-5 text-[#24262d]/50">Start with a clean canvas and design your website your way.</p><span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#24262d]">Start blank <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></div>
            </button>

            <button type="button" onClick={() => openStudio()} className="group relative overflow-hidden rounded-[22px] border border-violet-500/20 bg-[#24262d] p-6 text-left text-white shadow-[0_18px_55px_rgba(36,38,45,0.16)] transition duration-200 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_24px_70px_rgba(36,38,45,0.22)]">
              <div className="absolute -right-8 -top-10 size-36 rounded-full bg-violet-500/20 blur-2xl" /><div className="absolute -bottom-12 left-10 size-28 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="relative mb-12 flex size-11 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/20"><Sparkles className="size-5" /></div>
              <div className="relative"><h2 className="text-lg font-semibold tracking-[-0.025em]">Create with AI</h2><p className="mt-1.5 max-w-xs text-xs leading-5 text-white/50">Describe your idea and get an editable website starting point in seconds.</p><span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-200">Open AI Studio <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></div>
            </button>
          </div>

          <div className="mx-auto mt-7 flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-[#24262d]/8 bg-white/45 px-4 py-2.5 backdrop-blur">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[#24262d]/50"><FolderOpen className="size-4 shrink-0" /><span className="truncate">{store.bundle ? <>Open: <strong className="text-[#24262d]/75">{store.bundle.manifest.name}</strong></> : "No project open"}</span></div>
            <div className="flex shrink-0 gap-1.5"><Button size="sm" variant="ghost" className="text-[#24262d]/65 hover:bg-white/70 hover:text-[#24262d]" onClick={() => void store.openFromPicker()}>{store.capabilities.nativePicker ? "Open project" : "Open workspace"}</Button>{store.bundle && <Button size="sm" variant="outline" className="border-[#24262d]/10 bg-white/50" onClick={() => openStudio(store.bundle?.manifest.name)}>Open in Studio</Button>}</div>
          </div>

          {store.recents.length > 0 && <div className="mx-auto mt-8 max-w-2xl"><div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#24262d]/35">Recent projects</div><RecentProjectsPanel onNewProject={() => setWizardOpen(true)} /></div>}
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-5 text-center text-[10px] font-medium tracking-[0.12em] text-[#24262d]/30">WEBEAZY · AI-ASSISTED VISUAL WEBSITE CREATION</footer>

      <NewProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(name) => openStudio(name)} />
      {studioOpen && <HackathonStudio initialBusinessName={studioProjectName} onClose={() => setStudioOpen(false)} />}
    </div>
  );
}
