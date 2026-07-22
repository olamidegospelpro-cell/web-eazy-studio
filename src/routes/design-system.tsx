import { createFileRoute } from "@tanstack/react-router";
import {
  Save,
  Trash2,
  Play,
  Pause,
  Copy,
  FolderOpen,
  FilePlus2,
  Puzzle,
  Image as ImageIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  Slider,
  Separator,
  Skeleton,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Display,
  H1,
  H2,
  H3,
  H4,
  BodyLg,
  Body,
  BodySm,
  Caption,
  Code,
  Kbd,
  Spinner,
  EmptyState,
  StatusBadge,
  IconButton,
  ToolbarButton,
  FormField,
  ConfirmDialog,
  ProjectCard,
  TemplateCard,
  PluginCard,
  AssetCard,
  InfoCard,
  notify,
} from "@/components/ds";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Design System · WebEazy" },
      {
        name: "description",
        content:
          "Reference gallery of WebEazy design tokens and reusable UI components used across the app.",
      },
      { property: "og:title", content: "Design System · WebEazy" },
      {
        property: "og:description",
        content: "Reference gallery of WebEazy design tokens and reusable components.",
      },
    ],
  }),
  component: DesignSystemPage,
});

/* -------------------------------- helpers -------------------------------- */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <H3>{title}</H3>
        {description && <BodySm className="mt-0.5">{description}</BodySm>}
      </div>
      <div className="rounded-lg border border-border bg-card p-5 shadow-xs">{children}</div>
    </section>
  );
}

function Swatch({ token, cls }: { token: string; cls: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 w-full rounded-md border border-border ${cls}`} />
      <Code className="!bg-transparent !p-0 text-[10px] text-muted-foreground">{token}</Code>
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */
function DesignSystemPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Design System"
        description="The permanent visual language of WebEazy. Every future feature reuses these primitives."
      />

      <div className="grid gap-8 px-8 py-8 max-w-5xl">
        {/* ---------------- Colors ---------------- */}
        <Section title="Brand ramp" description="Purple palette 50 → 900. Use `brand` for primary actions.">
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => (
              <Swatch key={n} token={`brand-${n}`} cls={`bg-brand-${n}`} />
            ))}
          </div>
        </Section>

        <Section title="Semantic surfaces">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Swatch token="background" cls="bg-background" />
            <Swatch token="card" cls="bg-card" />
            <Swatch token="panel" cls="bg-panel" />
            <Swatch token="canvas" cls="bg-canvas" />
            <Swatch token="muted" cls="bg-muted" />
            <Swatch token="accent" cls="bg-accent" />
            <Swatch token="secondary" cls="bg-secondary" />
            <Swatch token="sidebar" cls="bg-sidebar" />
          </div>
        </Section>

        <Section title="Status colors">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Swatch token="success" cls="bg-success" />
            <Swatch token="warning" cls="bg-warning" />
            <Swatch token="danger" cls="bg-danger" />
            <Swatch token="info" cls="bg-info" />
          </div>
        </Section>

        {/* ---------------- Typography ---------------- */}
        <Section title="Typography" description="Inter for UI, JetBrains Mono for code.">
          <div className="flex flex-col gap-2">
            <Display>Display · Design beautiful websites</Display>
            <H1>Heading 1 · Project overview</H1>
            <H2>Heading 2 · Page section</H2>
            <H3>Heading 3 · Panel group</H3>
            <H4>Heading 4 · Field label</H4>
            <BodyLg>Body large — used for onboarding and empty state descriptions.</BodyLg>
            <Body>Body — default paragraph text for most surfaces.</Body>
            <BodySm>Body small — secondary hints and metadata.</BodySm>
            <Caption>Caption · panel header</Caption>
            <div className="flex items-center gap-2">
              <Code>const x = 1</Code>
              <Kbd>⌘ K</Kbd>
            </div>
          </div>
        </Section>

        {/* ---------------- Buttons ---------------- */}
        <Section title="Buttons" description="One Button component, many variants and sizes.">
          <div className="flex flex-wrap gap-2">
            <Button variant="brand">Brand</Button>
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="link">Link</Button>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-wrap items-end gap-2">
            <Button size="xs">xs</Button>
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">lg</Button>
            <Button size="md" disabled>Disabled</Button>
            <Button size="md"><Spinner size="sm" className="text-current" /> Loading…</Button>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2">
            <IconButton label="Save" size="icon-sm"><Save /></IconButton>
            <IconButton label="Copy"><Copy /></IconButton>
            <IconButton label="Delete" variant="destructive"><Trash2 /></IconButton>
            <ToolbarButton label="Play"><Play /></ToolbarButton>
            <ToolbarButton label="Pause" active><Pause /></ToolbarButton>
          </div>
        </Section>

        {/* ---------------- Inputs ---------------- */}
        <Section title="Inputs" description="All form controls share border, radius, and focus ring.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Project name" hint="Shown in the tab bar.">
              <Input placeholder="My website" />
            </FormField>
            <FormField label="Search" required>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search…" className="pl-8" />
              </div>
            </FormField>
            <FormField label="Description">
              <Textarea placeholder="A short description of your project" />
            </FormField>
            <FormField label="Framework" hint="Choose the output target.">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">Static HTML</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Password" error="Password is too short.">
              <Input type="password" defaultValue="abc" />
            </FormField>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="ds-cb" defaultChecked />
                <label htmlFor="ds-cb" className="text-xs">Show grid on canvas</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ds-sw" defaultChecked />
                <label htmlFor="ds-sw" className="text-xs">Auto-save</label>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs text-muted-foreground">Opacity</span>
                <Slider defaultValue={[60]} max={100} step={1} className="flex-1" />
              </div>
            </div>
          </div>
        </Section>

        {/* ---------------- Cards ---------------- */}
        <Section title="Cards" description="Project, Template, Plugin, Asset, and Info variants.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProjectCard name="Portfolio v2" updatedAt="Edited 2h ago" />
            <TemplateCard name="Landing" description="Hero + features + CTA." />
            <PluginCard name="SEO Tools" description="Metadata + sitemap." author="WebEazy" installed />
            <AssetCard name="hero.jpg" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoCard icon={FolderOpen} title="Local storage" description="Projects live on disk." />
            <InfoCard icon={Puzzle} title="Plugins ready" description="Extend WebEazy with widgets." />
          </div>
        </Section>

        {/* ---------------- Feedback ---------------- */}
        <Section title="Status badges & toasts">
          <div className="flex flex-wrap gap-2">
            <StatusBadge>Neutral</StatusBadge>
            <StatusBadge tone="brand">Brand</StatusBadge>
            <StatusBadge tone="success"><CheckCircle2 className="h-3 w-3" /> Saved</StatusBadge>
            <StatusBadge tone="warning"><AlertTriangle className="h-3 w-3" /> Unsaved</StatusBadge>
            <StatusBadge tone="danger"><AlertOctagon className="h-3 w-3" /> Error</StatusBadge>
            <StatusBadge tone="info"><Info className="h-3 w-3" /> Update</StatusBadge>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => notify.success("Project saved", "portfolio.wze")}>Toast · success</Button>
            <Button size="sm" variant="outline" onClick={() => notify.warning("Unsaved changes")}>Toast · warning</Button>
            <Button size="sm" variant="outline" onClick={() => notify.error("Export failed", "Disk is full.")}>Toast · error</Button>
            <Button size="sm" variant="outline" onClick={() => notify.info("Update available")}>Toast · info</Button>
          </div>
        </Section>

        {/* ---------------- Loading / progress ---------------- */}
        <Section title="Loading states">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2"><Spinner size="sm" /><BodySm>Spinner sm</BodySm></div>
            <div className="flex items-center gap-2"><Spinner /><BodySm>Spinner md</BodySm></div>
            <div className="flex items-center gap-2"><Spinner size="lg" /><BodySm>Spinner lg</BodySm></div>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <BodySm>Progress</BodySm>
              <Progress value={42} />
            </div>
          </div>
        </Section>

        {/* ---------------- Empty states ---------------- */}
        <Section title="Empty states">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border">
              <EmptyState
                icon={FilePlus2}
                title="No projects yet"
                description="Create your first WebEazy project to get started."
                action={<Button size="sm" variant="brand">New project</Button>}
              />
            </div>
            <div className="rounded-md border border-border">
              <EmptyState
                icon={ImageIcon}
                title="No assets"
                description="Drop images, fonts, or icons here to add them to this project."
              />
            </div>
          </div>
        </Section>

        {/* ---------------- Tabs & dialog ---------------- */}
        <Section title="Tabs & dialogs">
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Overview</TabsTrigger>
              <TabsTrigger value="b">Details</TabsTrigger>
              <TabsTrigger value="c">History</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="pt-3"><BodySm>Overview panel content.</BodySm></TabsContent>
            <TabsContent value="b" className="pt-3"><BodySm>Details panel content.</BodySm></TabsContent>
            <TabsContent value="c" className="pt-3"><BodySm>History panel content.</BodySm></TabsContent>
          </Tabs>
          <Separator className="my-4" />
          <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 /> Delete project…
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete this project?"
            description="This action can't be undone. Your files will be moved to trash."
            confirmLabel="Delete"
            tone="danger"
            onConfirm={() => notify.success("Project deleted")}
          />
        </Section>

        {/* ---------------- Elevation ---------------- */}
        <Section title="Elevation">
          <div className="grid gap-4 sm:grid-cols-4">
            {(["xs", "sm", "md", "lg"] as const).map((s) => (
              <div key={s} className={`flex h-20 items-center justify-center rounded-md border border-border bg-card shadow-${s}`}>
                <Code className="!bg-transparent !p-0">shadow-{s}</Code>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
