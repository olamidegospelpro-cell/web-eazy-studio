/**
 * Barrel for WebEazy's core infrastructure.
 *
 * Feature modules should import from `@/lib/core` only:
 *   bus / log / PreferencesService / ShortcutService / CommandRegistry /
 *   HistoryService / NotificationService / useDialogs / useUi
 */
export { bus, EventBus, type AppEvents, type EventName } from "./event-bus";
export { log, type LogEntry, type LogLevel } from "./logger";
export {
  PreferencesService,
  DEFAULT_APP_PREFERENCES,
  type AppPreferencesState,
  type PanelLayoutPreferences,
} from "./preferences";
export {
  HistoryService,
  HistoryStack,
  globalHistory,
  type HistoryEntry,
  type HistoryState,
} from "./history";
export { NotificationService, type ProgressHandle } from "./notifications";
export {
  ShortcutService,
  formatAccelerator,
  isMac,
  type ShortcutDefinition,
} from "./shortcuts";
export { CommandRegistry, scoreMatch, type Command, type CommandCategory } from "./commands";
export { DialogProvider, useDialogs, type DialogApi, type DialogKind } from "./dialogs";
export { UiProvider, useUi, type UiState } from "./ui-store";
