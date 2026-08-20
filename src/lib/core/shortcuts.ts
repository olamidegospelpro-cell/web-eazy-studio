/**
 * ShortcutService — the single keyboard shortcut registry.
 *
 * Accelerator syntax: "mod+s", "mod+shift+p", "escape".
 *  • `mod` = Cmd on macOS, Ctrl elsewhere.
 *  • Registration is data-driven, so new shortcuts are one `register()` call.
 *  • Handlers registered later win for the same accelerator (scoped overrides),
 *    which lets the future editor shadow app-level bindings while focused.
 *  • Typing in inputs/textareas/contenteditable is never hijacked, except by
 *    shortcuts marked `allowInInput` (Save, Command Palette, Escape).
 */
import { log } from "./logger";
import { PreferencesService } from "./preferences";

const logger = log.scoped("shortcuts");

export interface ShortcutDefinition {
  /** Stable id, also used as the preference key for user overrides. */
  id: string;
  accelerator: string;
  description: string;
  handler: (event: KeyboardEvent) => void;
  /** Fire even while a text field has focus. */
  allowInInput?: boolean;
  /** Skip preventDefault (rare). */
  passive?: boolean;
  enabled?: () => boolean;
}

export const isMac =
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

/** Human label for the UI: "mod+shift+p" → "⌘⇧P" / "Ctrl+Shift+P". */
export function formatAccelerator(accelerator: string): string {
  const parts = accelerator.toLowerCase().split("+");
  const out = parts.map((part) => {
    if (part === "mod") return isMac ? "⌘" : "Ctrl";
    if (part === "shift") return isMac ? "⇧" : "Shift";
    if (part === "alt") return isMac ? "⌥" : "Alt";
    if (part === "escape") return "Esc";
    return part.toUpperCase();
  });
  return isMac ? out.join("") : out.join("+");
}

function normalize(accelerator: string): string {
  const parts = accelerator.toLowerCase().split("+").filter(Boolean);
  const key = parts.filter((p) => !["mod", "ctrl", "meta", "shift", "alt"].includes(p)).join("");
  const flags = [
    parts.includes("mod") || parts.includes("ctrl") || parts.includes("meta") ? "mod" : "",
    parts.includes("shift") ? "shift" : "",
    parts.includes("alt") ? "alt" : "",
  ].filter(Boolean);
  return [...flags, key].join("+");
}

function fromEvent(event: KeyboardEvent): string {
  const key = event.key.toLowerCase();
  const flags = [
    event.metaKey || event.ctrlKey ? "mod" : "",
    event.shiftKey ? "shift" : "",
    event.altKey ? "alt" : "",
  ].filter(Boolean);
  return [...flags, key].join("+");
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable === true
  );
}

class Shortcuts {
  private registry = new Map<string, ShortcutDefinition[]>();
  private attached = false;
  private detach?: () => void;

  /** Registers a shortcut and returns an unregister function. */
  register(definition: ShortcutDefinition): () => void {
    const override = PreferencesService.get().shortcuts[definition.id];
    const combo = normalize(override ?? definition.accelerator);
    const list = this.registry.get(combo) ?? [];
    list.push(definition);
    this.registry.set(combo, list);
    return () => {
      const current = this.registry.get(combo);
      if (!current) return;
      const next = current.filter((d) => d !== definition);
      if (next.length) this.registry.set(combo, next);
      else this.registry.delete(combo);
    };
  }

  registerAll(definitions: ShortcutDefinition[]): () => void {
    const offs = definitions.map((d) => this.register(d));
    return () => offs.forEach((off) => off());
  }

  /** All active bindings — powers the shortcut list in Settings. */
  list(): { accelerator: string; id: string; description: string }[] {
    const out: { accelerator: string; id: string; description: string }[] = [];
    for (const [combo, defs] of this.registry) {
      for (const def of defs)
        out.push({ accelerator: combo, id: def.id, description: def.description });
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Attaches the single global keydown listener. Idempotent. */
  attach(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.attached) return this.detach ?? (() => {});
    const onKeyDown = (event: KeyboardEvent) => this.handle(event);
    window.addEventListener("keydown", onKeyDown);
    this.attached = true;
    this.detach = () => {
      window.removeEventListener("keydown", onKeyDown);
      this.attached = false;
    };
    return this.detach;
  }

  private handle(event: KeyboardEvent) {
    const combo = fromEvent(event);
    const candidates = this.registry.get(combo);
    if (!candidates?.length) return;
    // Last registered wins (innermost scope).
    for (let i = candidates.length - 1; i >= 0; i--) {
      const def = candidates[i];
      if (def.enabled && !def.enabled()) continue;
      if (isEditable(event.target) && !def.allowInInput) continue;
      if (!def.passive) event.preventDefault();
      logger.debug(`fired ${def.id} (${combo})`);
      def.handler(event);
      return;
    }
  }
}

export const ShortcutService = new Shortcuts();
