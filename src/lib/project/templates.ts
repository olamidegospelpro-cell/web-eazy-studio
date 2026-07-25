/**
 * TemplateService — describes starter projects.
 *
 * A template only decides *which pages exist* and *which theme overrides
 * apply*. It never contains editor node data in this milestone, so adding a
 * richer template later is a pure data change.
 */
import { createDefaultTheme } from "./defaults";
import type { ProjectTheme, WebsiteType } from "./types";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  websiteType: WebsiteType;
  pages: string[];
  themeOverrides?: Partial<ProjectTheme["colors"]>;
}

const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "One empty page. Full control from the start.",
    websiteType: "custom",
    pages: ["Home"],
  },
  {
    id: "landing",
    name: "Landing page",
    description: "Home page prepared for hero, features and CTA sections.",
    websiteType: "landing",
    pages: ["Home"],
    themeOverrides: { primary: "#6C4CF1", accent: "#C026D3" },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Home, Work, About and Contact pages.",
    websiteType: "portfolio",
    pages: ["Home", "Work", "About", "Contact"],
    themeOverrides: { primary: "#111827", accent: "#8B5CF6" },
  },
  {
    id: "business",
    name: "Business site",
    description: "Home, Services, About and Contact pages.",
    websiteType: "business",
    pages: ["Home", "Services", "About", "Contact"],
    themeOverrides: { primary: "#1D4ED8", accent: "#0EA5E9" },
  },
  {
    id: "blog",
    name: "Blog",
    description: "Home, Articles and About pages.",
    websiteType: "blog",
    pages: ["Home", "Articles", "About"],
    themeOverrides: { primary: "#B91C1C", accent: "#F59E0B" },
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Home, Getting started and Reference pages.",
    websiteType: "docs",
    pages: ["Home", "Getting started", "Reference"],
    themeOverrides: { primary: "#0F766E", accent: "#14B8A6" },
  },
];

export const TemplateService = {
  list(): ProjectTemplate[] {
    return TEMPLATES;
  },
  get(id: string): ProjectTemplate {
    return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
  },
  themeFor(id: string): ProjectTheme {
    const template = TemplateService.get(id);
    const base = createDefaultTheme();
    return {
      ...base,
      name: template.name,
      colors: { ...base.colors, ...(template.themeOverrides ?? {}) },
    };
  },
};
