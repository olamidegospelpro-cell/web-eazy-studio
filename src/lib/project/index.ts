/**
 * Public surface of the project management system.
 * UI must import from here — never from individual service modules — so
 * internals can be refactored (e.g. swapped for a Tauri adapter) freely.
 */
export * from "./types";
export * from "./defaults";
export { ProjectService, ProjectError, type CreateProjectInput } from "./project-service";
export { ValidationService } from "./validation";
export { TemplateService, type ProjectTemplate } from "./templates";
export { ThemeService } from "./theme-service";
export { RecentProjectsService } from "./recents";
export { StorageService, type SessionSnapshot } from "./storage";
export { AutosaveService } from "./autosave";
export { FontService, type FontOption } from "./fonts";
export { FileSystemService, FsError } from "./fs";
export { REQUIRED_FOLDERS, FILE_MANIFEST, FILE_THEME } from "./layout";
export { ProjectProvider, useProject, type ProjectStore } from "./store";

import { projectNameSchema, semverSchema } from "./schema";

/** Schemas the wizard reuses for inline field validation. */
export const projectSchemaHelpers = { projectName: projectNameSchema, semver: semverSchema };
