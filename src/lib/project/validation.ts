/**
 * ValidationService — decides whether a folder is a usable WebEazy project.
 *
 * Reports every problem it can find in one pass (rather than throwing on the
 * first) so the UI can show a friendly, complete explanation with recovery
 * suggestions.
 */
import { FileSystemService, FsError } from "./fs";
import { isVersionSupported, manifestSchema, pageSchema, themeSchema } from "./schema";
import { REQUIRED_FOLDERS } from "./layout";
import type {
  PageDocument,
  ProjectBundle,
  ProjectLocation,
  ProjectManifest,
  ProjectTheme,
  ValidationIssue,
  ValidationReport,
} from "./types";

function fail(
  code: string,
  message: string,
  suggestion?: string,
  level: ValidationIssue["level"] = "error",
): ValidationIssue {
  return { level, code, message, suggestion };
}

export const ValidationService = {
  /** Validates in-memory documents (used before every save). */
  validateBundle(bundle: ProjectBundle): ValidationReport {
    const issues: ValidationIssue[] = [];

    const manifest = manifestSchema.safeParse(bundle.manifest);
    if (!manifest.success) {
      for (const issue of manifest.error.issues) {
        issues.push(fail("manifest.invalid", `project.json → ${issue.path.join(".")}: ${issue.message}`));
      }
    }

    const theme = themeSchema.safeParse(bundle.theme);
    if (!theme.success) {
      for (const issue of theme.error.issues) {
        issues.push(fail("theme.invalid", `theme.json → ${issue.path.join(".")}: ${issue.message}`));
      }
    }

    if (bundle.manifest.theme !== "theme.json") {
      issues.push(
        fail("theme.reference", `project.json points to "${bundle.manifest.theme}" instead of theme.json`,
          "Reset the theme reference to theme.json."),
      );
    }

    for (const ref of bundle.manifest.pages) {
      const page = bundle.pages.find((p) => p.id === ref.id);
      if (!page) {
        issues.push(
          fail("page.missing", `Page "${ref.name}" is referenced but its file is missing`, `Expected ${ref.file}.`),
        );
        continue;
      }
      const parsed = pageSchema.safeParse(page);
      if (!parsed.success) {
        issues.push(fail("page.invalid", `${ref.file} is not a valid page document`));
      }
    }

    if (!bundle.manifest.pages.some((p) => p.isHome)) {
      issues.push(fail("page.noHome", "No page is marked as the home page", "Mark one page as home.", "warning"));
    }

    for (const plugin of bundle.manifest.plugins) {
      if (!plugin.id || !plugin.version) {
        issues.push(fail("plugin.reference", `Plugin reference "${plugin.name}" is incomplete`, undefined, "warning"));
      }
    }

    return { ok: issues.every((i) => i.level !== "error"), issues };
  },

  /** Validates a folder on disk before opening it. */
  async validateLocation(location: ProjectLocation): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];

    const hasManifest = await FileSystemService.exists(location, "project.json");
    if (!hasManifest) {
      return {
        ok: false,
        issues: [
          fail(
            "folder.notProject",
            `"${location.path}" doesn't look like a WebEazy project — project.json is missing`,
            "Pick the folder that directly contains project.json.",
          ),
        ],
      };
    }

    let manifest: ProjectManifest | undefined;
    try {
      const raw = await FileSystemService.readJson<unknown>(location, "project.json");
      const parsed = manifestSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          issues.push(fail("manifest.invalid", `project.json → ${issue.path.join(".")}: ${issue.message}`,
            "Restore project.json from the /backups folder."));
        }
      } else {
        manifest = parsed.data as ProjectManifest;
        if (!isVersionSupported(manifest.schemaVersion)) {
          issues.push(
            fail(
              "version.unsupported",
              `This project was created with a newer WebEazy (schema v${manifest.schemaVersion})`,
              "Update WebEazy to open it.",
            ),
          );
        }
      }
    } catch (error) {
      issues.push(
        fail("manifest.unreadable", error instanceof FsError ? error.message : "project.json could not be read",
          error instanceof FsError ? error.suggestion : undefined),
      );
    }

    if (!(await FileSystemService.exists(location, "theme.json"))) {
      issues.push(fail("theme.missing", "theme.json is missing", "WebEazy can recreate it with default values.", "warning"));
    }

    if (!(await FileSystemService.exists(location, "pages"))) {
      issues.push(fail("pages.missing", "The /pages folder is missing", "Page data cannot be recovered without it."));
    }

    for (const folder of REQUIRED_FOLDERS) {
      if (!(await FileSystemService.exists(location, folder))) {
        issues.push(
          fail("folder.missing", `Folder /${folder} is missing`, "WebEazy will recreate it on the next save.", "warning"),
        );
      }
    }

    if (manifest) {
      for (const ref of manifest.pages) {
        if (!(await FileSystemService.exists(location, ref.file))) {
          issues.push(fail("page.missing", `Page file ${ref.file} is missing`, `Referenced by page "${ref.name}".`));
        }
      }
    }

    return { ok: issues.every((i) => i.level !== "error"), issues };
  },

  /** Repairs the parts of a bundle that are safe to auto-heal. */
  heal(manifest: ProjectManifest, theme: ProjectTheme, pages: PageDocument[]) {
    const known = new Set(pages.map((p) => p.id));
    return {
      manifest: { ...manifest, theme: "theme.json", pages: manifest.pages.filter((p) => known.has(p.id)) },
      theme,
      pages,
    };
  },
};
