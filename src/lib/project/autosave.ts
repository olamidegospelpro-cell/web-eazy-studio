/**
 * AutosaveService — a timer, nothing more.
 *
 * Rules it guarantees:
 *  • never interrupts editing (async, fire-and-forget, no UI blocking)
 *  • only runs when something actually changed
 *  • skips a tick while a previous save is still in flight
 *
 * It receives callbacks rather than importing the store, so the store (and
 * later the editor) can be swapped without touching autosave logic.
 */
export interface AutosaveHooks {
  /** Returns true when there are unsaved changes. */
  isDirty: () => boolean;
  /** Performs the incremental save. */
  save: () => Promise<void>;
  onError?: (error: unknown) => void;
}

export class AutosaveService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private intervalMs: number;
  private hooks: AutosaveHooks;

  constructor(hooks: AutosaveHooks, intervalMs: number) {
    this.hooks = hooks;
    this.intervalMs = intervalMs;
  }

  start(intervalMs = this.intervalMs) {
    this.stop();
    this.intervalMs = intervalMs;
    if (typeof window === "undefined" || intervalMs <= 0) return;
    this.timer = setInterval(() => void this.tick(), intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  setInterval(intervalMs: number) {
    if (this.timer) this.start(intervalMs);
    else this.intervalMs = intervalMs;
  }

  get isRunning() {
    return this.timer !== null;
  }

  async tick() {
    if (this.running || !this.hooks.isDirty()) return;
    this.running = true;
    try {
      await this.hooks.save();
    } catch (error) {
      this.hooks.onError?.(error);
    } finally {
      this.running = false;
    }
  }
}
