# WebEazy V1 Architecture

## Product boundary

WebEazy is a desktop-first visual website builder. A project is a human-readable folder containing a manifest, theme, page documents, assets, plugins, settings, backups, and exports. The editor operates on versioned JSON documents and should never depend on a proprietary database format.

## Layers

1. **Application** — shell, routing, commands, shortcuts, dialogs, notifications, preferences, error boundaries.
2. **Project** — manifest, theme, pages, assets, plugins, storage, autosave, recovery, filesystem adapters.
3. **Editor** — document tree, nodes, selection, viewport/breakpoints, history, serialization and validation.
4. **Content** — sections, widgets, reusable components and templates.
5. **Developer** — custom CSS/JS, HTML, JavaScript libraries and plugins.
6. **Output** — preview, build, HTML/CSS/JS export, ZIP export and JSON export.

## Editor document model

A page is represented by an `EditorDocument`. Nodes are stored in a normalized map keyed by ID. Parent/child relationships are explicit, making selection, reordering, copy/paste, history and serialization deterministic.

The document has a schema version. Future migrations should transform old documents into the newest supported version instead of silently changing data.

## History

`HistoryManager` stores immutable snapshots with bounded history. Editor operations should commit semantic labels such as `Add Hero section` rather than individual low-level property changes where possible.

## Responsive model

Responsive values support desktop, tablet and mobile without duplicating the entire document. Breakpoints are defined centrally in `document-types.ts` and can be changed without rewriting node data.

## Storage strategy

The current project services support browser-native storage/folder access and are intentionally kept behind service interfaces. A future Tauri adapter can implement the same contracts for a true desktop build without changing editor code.

## Assets

Assets are records, not UI components. The asset library will later be backed by the project filesystem. Metadata, tags, folders, favorites and checksums are already represented so the UI can grow without changing the data model.

## Theme

Theme tokens are global project data. Editor components should consume theme values rather than hardcoding presentation. Exporters will later convert the same tokens into CSS custom properties.

## Version 1 priorities

1. Reliable project lifecycle.
2. Stable editor document model.
3. Responsive visual editing.
4. Reusable sections and widgets.
5. Human-readable JSON export.
6. Deterministic HTML/CSS/JS export.
7. Plugin and JavaScript library extension points.
8. No vendor lock-in.

## Non-goals for early V1

Cloud collaboration, accounts, hosted publishing and an online template marketplace should not be allowed to complicate the local-first core.
