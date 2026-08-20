/* Project service: create, open, save and manage WebEazy projects. */
import { FileSystemService, FsError } from "./fs";
import {
  FILE_EDITOR_SETTINGS, FILE_MANIFEST, FILE_PREFERENCES, FILE_THEME, REQUIRED_FOLDERS,
  backupFile, defaultEditorSettings, defaultProjectPreferences, pageFile,
} from "./layout";
import { APP_META, createPage, newId, nowIso, slugify, createDefaultTheme } from "./defaults";
import { TemplateService } from "./templates";
import { ValidationService } from "./validation";
import { manifestSchema, pageSchema, themeSchema } from "./schema";
import { PROJECT_SCHEMA_VERSION } from "./types";
import type { PageDocument, ProjectBundle, ProjectLocation, ProjectManifest, ProjectTheme, ValidationReport, WebsiteType } from "./types";

export class ProjectError extends Error {
  suggestion?: string; report?: ValidationReport;
  constructor(message: string, suggestion?: string, report?: ValidationReport) { super(message); this.name = "ProjectError"; this.suggestion = suggestion; this.report = report; }
}
function wrap(error: unknown, fallback: string): ProjectError {
  if (error instanceof ProjectError) return error;
  if (error instanceof FsError) return new ProjectError(error.message, error.suggestion);
  console.error("[ProjectService]", error);
  return new ProjectError(fallback, "Check that the project folder is still available, then try again.");
}
export interface CreateProjectInput { name: string; websiteName: string; description: string; author: string; version: string; websiteType: WebsiteType; templateId: string; theme: ProjectTheme; autosaveIntervalMs: number; }

export const ProjectService = {
  createBundle(input: CreateProjectInput): ProjectBundle {
    const template = TemplateService.get(input.templateId);
    const pages: PageDocument[] = template.pages.map((name, index) => createPage(name, { isHome: index === 0 }));
    const ts = nowIso();
    const manifest: ProjectManifest = {
      schemaVersion: PROJECT_SCHEMA_VERSION, id: newId("proj"), name: input.name.trim(),
      websiteName: input.websiteName.trim() || input.name.trim(), description: input.description.trim(),
      author: input.author.trim(), version: input.version.trim() || "1.0.0", websiteType: input.websiteType,
      templateId: template.id, createdAt: ts, lastModified: ts, theme: FILE_THEME,
      pages: pages.map((page, index) => ({ id: page.id, name: page.name, slug: page.slug, file: pageFile(page.slug), isHome: index === 0 })),
      assets: [], plugins: [], settings: { autosave: { enabled: true, intervalMs: input.autosaveIntervalMs }, backups: { enabled: true, frequency: "onSave" }, sync: { provider: "none" } },
      app: { ...APP_META }, extensions: {},
    };
    return { manifest, theme: input.theme, pages };
  },

  async scaffold(location: ProjectLocation): Promise<void> {
    try { await FileSystemService.ensureDir(location, ""); for (const folder of REQUIRED_FOLDERS) await FileSystemService.ensureDir(location, folder); }
    catch (error) { throw wrap(error, "WebEazy could not create the project folders."); }
  },

  async writeAll(bundle: ProjectBundle, location: ProjectLocation): Promise<ProjectBundle> {
    const report = ValidationService.validateBundle(bundle);
    if (!report.ok) throw new ProjectError("This project failed validation, so nothing was written.", "Fix the reported problems and save again.", report);
    const manifest: ProjectManifest = { ...bundle.manifest, lastModified: nowIso(), settings: { ...bundle.manifest.settings, location }, app: { ...APP_META } };
    try {
      await ProjectService.scaffold(location); await FileSystemService.writeJson(location, FILE_THEME, bundle.theme);
      for (const page of bundle.pages) await FileSystemService.writeJson(location, pageFile(page.slug), page);
      if (!(await FileSystemService.exists(location, FILE_EDITOR_SETTINGS))) await FileSystemService.writeJson(location, FILE_EDITOR_SETTINGS, defaultEditorSettings());
      if (!(await FileSystemService.exists(location, FILE_PREFERENCES))) await FileSystemService.writeJson(location, FILE_PREFERENCES, defaultProjectPreferences());
      if (manifest.settings.backups.enabled) await ProjectService.writeBackup({ ...bundle, manifest }, location).catch(() => undefined);
      await FileSystemService.writeJson(location, FILE_MANIFEST, manifest);
    } catch (error) { throw wrap(error, "Saving the project failed."); }
    return { manifest, theme: bundle.theme, pages: bundle.pages, location };
  },

  async writeChanged(bundle: ProjectBundle, location: ProjectLocation, changed: { theme?: boolean; pageIds?: string[]; manifest?: boolean }): Promise<ProjectBundle> {
    const manifest: ProjectManifest = { ...bundle.manifest, lastModified: nowIso(), settings: { ...bundle.manifest.settings, location } };
    try {
      await ProjectService.scaffold(location); if (changed.theme) await FileSystemService.writeJson(location, FILE_THEME, bundle.theme);
      for (const id of changed.pageIds ?? []) { const page = bundle.pages.find((p) => p.id === id); if (page) await FileSystemService.writeJson(location, pageFile(page.slug), page); }
      await FileSystemService.writeJson(location, FILE_MANIFEST, manifest);
    } catch (error) { throw wrap(error, "Autosave could not write to the project folder."); }
    return { manifest, theme: bundle.theme, pages: bundle.pages, location };
  },

  async writeBackup(bundle: ProjectBundle, location: ProjectLocation): Promise<void> {
    const stamp = nowIso().replace(/[:.]/g, "-");
    await FileSystemService.writeJson(location, backupFile(stamp), { savedAt: nowIso(), manifest: bundle.manifest, theme: bundle.theme, pages: bundle.pages });
  },

  async open(location: ProjectLocation): Promise<ProjectBundle> {
    const report = await ValidationService.validateLocation(location);
    if (!report.ok) throw new ProjectError(`"${location.path}" could not be opened.`, "Review the details below, then pick the correct project folder.", report);
    try {
      const rawManifest = await FileSystemService.readJson<unknown>(location, FILE_MANIFEST);
      const manifest = manifestSchema.parse(rawManifest) as ProjectManifest;
      const theme = await ProjectService.readTheme(location);
      const pages: PageDocument[] = [];
      for (const ref of manifest.pages) {
        const parsed = pageSchema.safeParse(await FileSystemService.readJson<unknown>(location, ref.file));
        if (!parsed.success) continue;
        const value = parsed.data as PageDocument;
        if (!value.document) continue;
        pages.push(value);
      }
      const healed = ValidationService.heal({ ...manifest, settings: { ...manifest.settings, location } }, theme, pages);
      return { ...healed, location };
    } catch (error) { throw wrap(error, "The project could not be read."); }
  },

  async readTheme(location: ProjectLocation): Promise<ProjectTheme> {
    if (await FileSystemService.exists(location, FILE_THEME)) {
      const parsed = themeSchema.safeParse(await FileSystemService.readJson<unknown>(location, FILE_THEME));
      if (parsed.success) return parsed.data as ProjectTheme;
    }
    return createDefaultTheme();
  },

  async openFromPicker(): Promise<ProjectBundle> { const location = await FileSystemService.chooseLocation(); return ProjectService.open(location); },
  async duplicate(source: ProjectLocation, destination: ProjectLocation, newName: string): Promise<ProjectBundle> {
    const bundle = await ProjectService.open(source);
    return ProjectService.writeAll({ ...bundle, manifest: { ...bundle.manifest, id: newId("proj"), name: newName, createdAt: nowIso(), lastModified: nowIso() } }, destination);
  },
  async deleteFolder(location: ProjectLocation): Promise<void> { try { await FileSystemService.removeRoot(location); } catch (error) { throw wrap(error, "The project folder could not be deleted."); } },
  rename(bundle: ProjectBundle, name: string): ProjectBundle { return { ...bundle, manifest: { ...bundle.manifest, name: name.trim(), lastModified: nowIso() } }; },
  suggestFolderName(name: string): string { return slugify(name) || "webeazy-project"; },
};
