/**
 * EventBus — lightweight typed pub/sub for cross-module communication.
 *
 * Why it exists
 * -------------
 * Future modules (editor, theme manager, asset manager, plugins) must react to
 * each other without importing each other. They publish/subscribe to events
 * here instead, keeping the dependency graph a tree rather than a web.
 *
 * Usage:
 *   const off = bus.on("project:saved", ({ projectId }) => ...);
 *   bus.emit("project:saved", { projectId });
 *   off();
 *
 * To add an event: extend `AppEvents`. Payloads are fully type-checked.
 */

export interface AppEvents {
  /* app lifecycle */
  "app:ready": { at: string };
  "app:error": { message: string; source?: string };

  /* project lifecycle */
  "project:created": { projectId: string; name: string };
  "project:opened": { projectId: string; name: string };
  "project:saved": { projectId: string; auto: boolean };
  "project:closed": { projectId: string };
  "project:dirty": { projectId: string; dirty: boolean };

  /* ui */
  "ui:command-palette": { open: boolean };
  "ui:search": { open: boolean };
  "ui:theme-changed": { theme: string };
  "ui:layout-changed": { key: string };

  /* history (undo/redo engine) */
  "history:changed": { scope: string; canUndo: boolean; canRedo: boolean };

  /* reserved for later milestones */
  "editor:selection": { nodeId: string | null };
  "plugin:registered": { pluginId: string };
}

export type EventName = keyof AppEvents;
type Handler<K extends EventName> = (payload: AppEvents[K]) => void;

export class EventBus {
  private handlers = new Map<EventName, Set<(payload: never) => void>>();

  on<K extends EventName>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as (payload: never) => void);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  once<K extends EventName>(event: K, handler: Handler<K>): () => void {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends EventName>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as (payload: never) => void);
  }

  emit<K extends EventName>(event: K, payload: AppEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Copy so handlers may unsubscribe during dispatch.
    for (const handler of [...set]) {
      try {
        (handler as Handler<K>)(payload);
      } catch (error) {
        console.error(`[EventBus] handler for "${String(event)}" threw`, error);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** App-wide singleton. Tests may construct their own EventBus. */
export const bus = new EventBus();
