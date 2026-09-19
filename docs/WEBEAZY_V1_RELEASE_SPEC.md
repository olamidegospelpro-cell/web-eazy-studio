# WebEazy Studio v1.0 Release Specification

## Objective
Deliver a usable first public release of WebEazy Studio: create a project, edit a page visually, refine selected elements with AI, preview responsively, save/reopen, and export static HTML.

## Scope

### Core toolbar
1. Pick/Move tool (default)
   - Click to select one node.
   - Drag to move unlocked nodes.
   - Shift-click for multi-selection.
   - Show selection outline.
   - Add basic resize handles where safe; do not break existing styles.
2. Section/Artboard tool
   - Create a website section with presets:
     - Desktop: 1440x900
     - Tablet: 768x1024
     - Mobile: 390x844
   - Section is selectable, named, and acts as a parent/container.
3. Shape tool
   - Flyout or selector for rectangle, ellipse, triangle, and line.
   - New shapes are editable and should not be locked by default.
   - Preserve position, dimensions, fill, border, and radius in the document model.
4. Text tool
   - Click canvas to create a text node.
   - Support immediate typing or a clear edit mode.
   - Expose font family, size, weight, color, alignment, line height, and letter spacing.

### Selection and properties
- Keep the selected node as the single source of truth.
- Display a contextual inspector for the selected node.
- Support keyboard Escape to clear selection and Delete/Backspace with confirmation-safe behavior.
- Do not introduce a separate disconnected properties state.

### AI Refine
- Make an AI Refine panel available whenever a supported node is selected.
- Include prompt input, suggested actions, loading state, error state, and success feedback.
- Pass only the selected node and relevant document context to the provider.
- Return validated structured changes, not arbitrary executable code.
- Apply changes through the editor store so undo/redo and persistence work.
- Initial actions:
  - change color/fill
  - adjust border/radius
  - adjust spacing
  - modify text content
  - modify typography
  - reposition or resize
  - improve a selected section layout
- Add a provider interface so IdentArk or another compatible model can be integrated without rewriting editor logic.
- Never expose secret API keys in browser code. Use a server-side/proxy route or clearly documented local-development configuration.
- If no AI provider is configured, show a useful setup state rather than failing silently.

### Persistence and export
- Create, save, reopen, and autosave projects.
- Ensure document migrations/validation prevent malformed nodes from crashing the editor.
- Preview desktop/tablet/mobile layouts.
- Export static HTML/CSS with text, shapes, sections, and responsive hidden states represented correctly.

### Reliability
- Keep existing CI green.
- Add focused tests for:
  - node creation
  - selection and movement
  - AI patch validation/application
  - undo/redo after AI changes
  - serialization and export
- Avoid broad dependency additions unless justified for the existing hardware constraints.
- Do not modify `main` directly; work on `feature/webeazy-v1-foundation` and open a reviewable PR.

## End-to-end acceptance test

A user must be able to:

1. Open WebEazy.
2. Create a project.
3. Add a desktop section.
4. Add and move a rectangle.
5. Add an ellipse, triangle, and line.
6. Add and edit a heading/text node.
7. Select an element and open AI Refine.
8. Request a change such as: "Make this a premium purple card with rounded corners."
9. Review/apply the structured change.
10. Undo and redo the change.
11. Preview desktop, tablet, and mobile.
12. Save, reload/reopen, and export the project.

## Definition of done

- No blocking TypeScript, lint, or build errors.
- No silent failures in the primary workflow.
- Core interactions are usable with mouse and keyboard.
- AI Refine is visible and functional when configured, with a clear fallback when not configured.
- A short README section documents local setup, AI provider configuration, limitations, and the current release status.
