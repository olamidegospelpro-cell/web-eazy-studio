import { useEffect, useState } from "react";
import {
  ArrowRight,
  Code2,
  Eye,
  Layers3,
  LayoutTemplate,
  Menu,
  Monitor,
  Play,
  SlidersHorizontal,
  Smartphone,
  X,
} from "lucide-react";
import { NewProjectWizard } from "@/components/project/wizard/NewProjectWizard";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const open = () => setWizardOpen(true);
    window.addEventListener("webeazy:new-project", open);
    return () => window.removeEventListener("webeazy:new-project", open);
  }, []);

  const openStudio = (name = store.bundle?.manifest.name || "Untitled project") => {
    setStudioProjectName(name);
    setStudioOpen(true);
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const features = [
    { icon: LayoutTemplate, title: "Visual Website Builder", copy: "Design and customize polished websites in an intuitive visual workspace." },
    { icon: Layers3, title: "Ready-to-Use Sections", copy: "Build pages quickly with reusable sections and flexible components." },
    { icon: Smartphone, title: "Responsive Design", copy: "Create experiences that adapt naturally across desktop, tablet and mobile." },
    { icon: SlidersHorizontal, title: "Easy Customization", copy: "Fine-tune layouts, colours, typography, spacing and content." },
    { icon: Eye, title: "Live Preview", copy: "Review your work instantly as the design takes shape." },
    { icon: Code2, title: "HTML Export", copy: "Export your finished website into a clean, usable HTML file." },
  ];

  return (
    <div className="webeazy-brand webeazy-landing">
      <header className="webeazy-nav">
        <div className="webeazy-nav-inner">
          <button type="button" onClick={() => scrollTo("home")} aria-label="Go to home"><WebEazyBrand /></button>
          <nav className="webeazy-nav-links" aria-label="Main navigation">
            <button type="button" onClick={() => scrollTo("home")}>Home</button>
            <button type="button" onClick={() => scrollTo("features")}>Features</button>
            <button type="button" onClick={() => scrollTo("about")}>About</button>
            <button type="button" onClick={() => scrollTo("contact")}>Contact</button>
          </nav>
          <button type="button" onClick={() => setWizardOpen(true)} className="webeazy-nav-cta">Get Started <ArrowRight className="size-3.5" /></button>
          <button type="button" className="webeazy-menu-button" aria-expanded={menuOpen} aria-label="Toggle navigation" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="webeazy-mobile-nav" aria-label="Mobile navigation"><button type="button" onClick={() => scrollTo("home")}>Home</button><button type="button" onClick={() => scrollTo("features")}>Features</button><button type="button" onClick={() => scrollTo("about")}>About</button><button type="button" onClick={() => scrollTo("contact")}>Contact</button><button type="button" onClick={() => { setMenuOpen(false); setWizardOpen(true); }}>Get Started</button></nav>}
      </header>

      <main>
        <section id="home" className="webeazy-hero">
          <div className="webeazy-hero-inner">
            <div className="webeazy-hero-copy">
              <div className="webeazy-eyebrow"><span />Build · Design · Launch</div>
              <h1>Turn Your Ideas Into Real <span>Websites</span></h1>
              <p>WebEazy is your all-in-one platform for designing, creating and launching beautiful websites — faster, easier and smarter.</p>
              <div className="webeazy-hero-actions">
                <button type="button" onClick={() => setWizardOpen(true)} className="webeazy-primary-button">Start Creating <ArrowRight className="size-4" /></button>
                <button type="button" onClick={() => scrollTo("showcase")} className="webeazy-secondary-button"><Play className="size-3.5 fill-current" /> Watch Demo</button>
              </div>
            </div>

            <div className="webeazy-hero-visual" aria-label="WebEazy website builder preview">
              <div className="webeazy-product-glow" />
              <div className="webeazy-mini-browser">
                <div className="webeazy-mini-bar"><span className="mini-logo">W</span><span className="mini-nav">Home &nbsp;&nbsp; Features &nbsp;&nbsp; About</span><span className="mini-cta">Get Started</span></div>
                <div className="webeazy-mini-body">
                  <div className="mini-eyebrow">● BUILD · DESIGN · LAUNCH</div>
                  <h2>Turn Your Ideas<br />Into Real <span>Websites</span></h2>
                  <p>WebEazy is your all-in-one platform for creating beautiful websites.</p>
                  <button type="button" tabIndex={-1}>Start Creating <ArrowRight className="size-3" /></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="webeazy-section">
          <div className="webeazy-section-heading">
            <div className="webeazy-section-label">CAPABILITIES</div>
            <h2>Everything you need to build beautifully.</h2>
            <p>A focused toolkit for turning ideas into complete, responsive websites.</p>
          </div>
          <div className="webeazy-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return <article className="webeazy-feature-card" key={feature.title}><div className="webeazy-feature-icon"><Icon /></div><h3>{feature.title}</h3><p>{feature.copy}</p></article>;
            })}
          </div>
        </section>

        <section id="about" className="webeazy-section webeazy-workflow">
          <div className="webeazy-section-heading">
            <div className="webeazy-section-label">HOW IT WORKS</div>
            <h2>From idea to live website.</h2>
          </div>
          <div className="webeazy-steps">
            {[["01", "Start Designing", "Begin with a blank workspace or an available starting layout."], ["02", "Customize Your Website", "Add sections, edit content, and personalize every detail."], ["03", "Preview & Export", "Review your work and export your website when it is ready."]].map(([number, title, copy], index) => <article key={number} className="webeazy-step"><div className="webeazy-step-number">{number}</div>{index < 2 && <div className="webeazy-step-line" />}<h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section id="showcase" className="webeazy-section webeazy-showcase">
          <div className="webeazy-showcase-copy">
            <div className="webeazy-section-label">PRODUCT SHOWCASE</div>
            <h2>A complete design workspace, made simple.</h2>
            <p>Shape every section with a visual canvas, reusable components and immediate preview feedback.</p>
            <button type="button" onClick={() => setWizardOpen(true)} className="webeazy-text-button">Explore the workspace <ArrowRight className="size-4" /></button>
          </div>
          <div className="webeazy-workspace-preview">
            <div className="webeazy-workspace-top"><div className="workspace-logo">W</div><div className="workspace-project">WebEazy Project</div><div className="workspace-status" /><div className="workspace-export">Export</div></div>
            <div className="webeazy-workspace-body">
              <aside><span /><span /><span /><span /><span /></aside>
              <div className="workspace-canvas"><div className="workspace-ruler" /><div className="workspace-page"><div className="workspace-page-nav"><b>W WebEazy</b><span>Home</span><span>Features</span><span>About</span><em>Get Started</em></div><div className="workspace-page-hero"><small>● BUILD · DESIGN · LAUNCH</small><strong>Turn Your Ideas Into<br /><b>Real Websites</b></strong><p>Design. Customize. Create.</p><i>Start Creating →</i></div></div></div>
              <aside className="workspace-inspector"><b>Properties</b><span /><span /><span /><div /></aside>
            </div>
          </div>
        </section>

        <section id="contact" className="webeazy-section webeazy-final-cta">
          <div className="webeazy-final-card">
            <div>
              <div className="webeazy-section-label">START CREATING</div>
              <h2>Your Next Website Starts Here.</h2>
              <p>Bring your ideas to life. Design, customize, and create websites with WebEazy.</p>
            </div>
            <button type="button" onClick={() => setWizardOpen(true)} className="webeazy-primary-button">Start Building <ArrowRight className="size-4" /></button>
          </div>
        </section>
      </main>

      <footer className="webeazy-footer">
        <div className="webeazy-footer-inner">
          <div className="webeazy-footer-brand"><WebEazyBrand /><p>A visual website creation platform for modern teams and independent creators.</p></div>
          <div><h3>Product</h3><button type="button" onClick={() => scrollTo("features")}>Features</button><button type="button" onClick={() => scrollTo("showcase")}>Workspace</button></div>
          <div><h3>Company</h3><button type="button" onClick={() => scrollTo("about")}>About</button><button type="button" onClick={() => scrollTo("contact")}>Contact</button></div>
        </div>
        <div className="webeazy-footer-bottom"><span>© {new Date().getFullYear()} WebEazy</span><span>Design · Build · Launch</span></div>
      </footer>
      <NewProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(name) => openStudio(name)} />
      {studioOpen && <HackathonStudio initialBusinessName={studioProjectName} onClose={() => setStudioOpen(false)} />}
    </div>
  );
}
