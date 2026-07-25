/**
 * ProjectService — create / open / save / duplicate / delete.
 *
 * Design rules enforced here:
 *  • project.json holds metadata only; page content lives in pages/*.json.
 *  • The folder scaffold is (re)created on every write, so a project folder
 *    can never end up half-formed.
 *  • Every filesystem call is validated and wrapped in a ProjectError carrying
 *    a human message plus a recovery suggestion.
 *  • Nothing here knows the editor exists — it deals only in documents.
 */
import { FileSystemService, FsError } from "./fs";
import {
  FILE_EDITOR_SETTINGS,
  FILE_MANIFEST,
  FILE_PREFERENCES,
  FILE_THEME,
  REQUIRED_FOLDERS,
  backupFile,
  defaultEditorSettings,
  defaultProjectPreferences,
  pageFile,
} from "./layout";
import { APP_META, createPage, newId, nowIso, slugify } from "./defaults";
import { TemplateService } from "./templates";
import { ValidationService } from "./validation";
import { manifestSchema, pageSchema, themeSchema } from "./schema";
import { createDefaultTheme } from "./defaults";
import { PROJECT_SCHEMA_VERSION } from "./types";
import type {
  PageDocument,
  ProjectBundle,
  ProjectLocation,
  ProjectManifest,
  ProjectTheme,
  ValidationReport,
  WebsiteType,
} from "./types";

export class ProjectError extends Error {
  suggestion?: string;
  report?: ValidationReport;

  constructor(message: string, suggestion?: string, report?: ValidationReport) {
    super(message);
    this.name = "ProjectError";
    this.suggestion = suggestion;
    this.report = report;
  }
}

function wrap(error: unknown, fallback: string): ProjectError {
  if (error instanceof ProjectError) return error;
  if (error instanceof FsError) return new ProjectError(error.message, error.suggestion);
  console.error("[ProjectService]", error);
  return new ProjectError(fallback, "Check that the project folder is still available, then try again.");
}

export interface CreateProjectInput {
  name: string;
  websiteName: string;
  description: string;
  author: string;
  version: string;
  websiteType: WebsiteType;
  templateId: string;
  theme: ProjectTheme;
  autosaveIntervalMs: number;
}

export const ProjectService = {
  /**
   * Builds a project in memory. No filesystem access happens here — the user
   * is only asked for a folder on the first save.
   */
  createBundle(input: CreateProjectInput): ProjectBundle {
    const template = TemplateService.get(input.templateId);
    const pages: PageDocument[] = template.pages.map((name, index) =>
      createPage(name, { isHome: index === 0 }),
    );
    const ts = nowIso();

    const manifest: ProjectManifest = {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      id: newId("proj"),
      name: input.name.trim(),
      websiteName: input.websiteName.trim() || input.name.trim(),
      description: input.description.trim(),
      author: input.author.trim(),
      version: input.version.trim() || "1.0.0",
      websiteType: input.websiteType,
      templateId: template.id,
      createdAt: ts,
      lastModified: ts,
      theme: FILE_THEME,
      pages: pages.map((page, index) => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        file: pageFile(page.slug),
        isHome: index === 0,
      })),
      assets: [],
      plugins: [],
      settings: {
        autosave: { enabled: true, intervalMs: input.autosaveIntervalMs },
        backups: { enabled: true, frequency: "onSave" },
        sync: { provider: "none" },
      },
      app: { ...APP_META },
      extensions: {},
    };

    return { manifest, theme: input.theme, pages };
  },

  /** Creates the documented folder tree. Safe to call repeatedly. */
  async scaffold(location: ProjectLocation): Promise<void> {
    try {
      await FileSystemService.ensureDir(location, "");
      for (const folder of REQUIRED_FOLDERS) {
        await FileSystemService.ensureDir(location, folder);
      }
    } catch (error) {
      throw wrap(error, "WebEazy could not create the project folders.");
    }
  },

  /** Full write: scaffold + every document. Used by Save, Save As and Create. */
  async writeAll(bundle: ProjectBundle, location: ProjectLocation): Promise<ProjectBundle> {
    const report = ValidationService.validateBundle(bundle);
    if (!report.ok) {
      throw new ProjectError(
        "This project failed validation, so nothing was written.",
        "Fix the reported problems and save again.",
        report,
      );
    }

    const manifest: ProjectManifest = {
      ...bundle.manifest,
      lastModified: nowIso(),
      settings: { ...bundle.manifest.settings, location },
      app: { ...APP_META },
    };

    try {
      await ProjectService.scaffold(location);
      await FileSystemService.writeJson(location, FILE_THEME, bundle.theme);
      for (const page of bundle.pages) {
        await FileSystemService.writeJson(location, pageFile(page.slug), page);
      }
      if (!(await FileSystemService.exists(location, FILE_EDITOR_SETTINGS))) {
        await FileSystemService.writeJson(location, FILE_EDITOR_SETTINGS, defaultEditorSettings());
      }
      if (!(await FileSystemService.exists(location, FILE_PREFERENCES))) {
        await FileSystemService.writeJson(location, FILE_PREFERENCES, defaultProjectPreferences());
      }
      if (manifest.settings.backups.enabled) {
        await ProjectService.writeBackup({ ...bundle, manifest }, location).catch(() => undefined);
      }
      // Manifest last: if anything above fails the project stays consistent.
      await FileSystemService.writeJson(location, FILE_MANIFEST, manifest);
    } catch (error) {
      throw wrap(error, "Saving the project failed.");
    }

    return { manifest, theme: bundle.theme, pages: bundle.pages, location };
  },

  /** Writes only the documents that changed — used by autosave. */
  async writeChanged(
    bundle: ProjectBundle,
    location: ProjectLocation,
    changed: { theme?: boolean; pageIds?: string[]; manifest?: boolean },
  ): Promise<ProjectBundle> {
    const manifest: ProjectManifest = {
      ...bundle.manifest,
      lastModified: nowIso(),
      settings: { ...bundle.manifest.settings, location },
    };
    try {
      await ProjectService.scaffold(location);
      if (changed.theme) await FileSystemService.writeJson(location, FILE_THEME, bundle.theme);
      for (const id of changed.pageIds ?? []) {
        const page = bundle.pages.find((p) => p.id === id);
        if (page) await FileSystemService.writeJson(location, pageFile(page.slug), page);
      }
      await FileSystemService.writeJson(location, FILE_MANIFEST, manifest);
    } catch (error) {
      throw wrap(error, "Autosave could not write to the project folder.");
    }
    return { manifest, theme: bundle.theme, pages: bundle.pages, location };
  },

  async writeBackup(bundle: ProjectBundle, location: ProjectLocation): Promise<void> {
    const stamp = nowIso().replace(/[:.]/g, "-");
    await FileSystemService.writeJson(location, backupFile(stamp), {
      savedAt: nowIso(),
      manifest: bundle.manifest,
      theme: bundle.theme,
      pages: bundle.pages,
    });
  },

  /** Validates then loads a project folder. */
  async open(location: ProjectLocation): Promise<ProjectBundle> {
    const report = await ValidationService.validateLocation(location);
    if (!report.ok) {
      throw new ProjectError(
        `"${location.path}" could not be opened.`,
        "Review the details below, then pick the correct project folder.",
        report,
      );
    }

    try {
      const rawManifest = await FileSystemService.readJson<unknown>(location, FILE_MANIFEST);
      const manifest = manifestSchema.parse(rawManifest) as ProjectManifest;

      let theme: ProjectTheme;
      if (await FileSystemService.exists(location, FILE_THEME)) {
        const parsed = themeSchema.safeParse(await FileSystemService.readJson(location, FILE_THEME));
        theme = parsed.success ? (parsed.data as ProjectTheme) : createDefaultTheme();
      } else {
        theme = createDefaultTheme();
      }

      const pages: PageDocument[] = [];
      for (const ref of manifest.pages) {
        const parsed = pageSchema.safeParse(await FileSystemService.readJson(location, ref.file));
        if (parsed.success) pages.push(parsed.data as PageDocument);
      }

      const healed = ValidationService.heal({ ...manifest, settings: { ...manifest.settings, location } }, theme, pages);
      return { ...healed, location };
    } catch (error) {
      throw wrap(error, "The project could not be read.");
    }
  },

  /** Asks for a folder, then opens whatever project it contains. */
  async openFromPicker(): Promise<ProjectBundle> {
    const location = await FileSystemService.chooseLocation();
    return ProjectService.open(location);
  },

  /** Copies every document into a new folder under a new project id. */
  async duplicate(
    source: ProjectLocation,
    destination: ProjectLocation,
    newName: string,
  ): Promise<ProjectBundle> {
    const bundle = await ProjectService.open(source);
    const copy: ProjectBundle = {
      ...bundle,
      manifest: {
        ...bundle.manifest,
        id: newId("proj"),
        name: newName,
        createdAt: nowIso(),
        lastModified: nowIso(),
      },
    };
    return ProjectService.writeAll(copy, destination);
  },

  /** Deletes the project's files. Callers must confirm with the user first. */
  async deleteFolder(location: ProjectLocation): Promise<void> {
    try {
      await FileSystemService.removeRoot(location);
    } catch (error) {
      throw wrap(error, "The project folder could not be deleted.");
    }
  },

  /** Renames a project (metadata only — the folder keeps its name). */
  rename(bundle: ProjectBundle, name: string): ProjectBundle {
    return {
      ...bundle,
      manifest: { ...bundle.manifest, name: name.trim(), lastModified: nowIso() },
    };
  },

  suggestFolderName(name: string): string {
    return slugify(name) || "webeazy-project";
  },
};
