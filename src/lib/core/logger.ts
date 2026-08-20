/**
 * Logger — centralized logging.
 *
 * Every module should log through `log` instead of console.* so that:
 *  • output can be silenced in production with one flag
 *  • the Console tab of the bottom panel can render the same stream
 *  • logs carry a scope so noisy subsystems can be filtered later
 *
 * Levels: debug < info < warn < error < silent.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface LogEntry {
  id: number;
  level: Exclude<LogLevel, "silent">;
  scope: string;
  message: string;
  data?: unknown;
  at: number;
}

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const MAX_BUFFER = 300;

class Logger {
  /** Production builds default to "warn"; dev shows everything. */
  private level: LogLevel = import.meta.env.PROD ? "warn" : "debug";
  private buffer: LogEntry[] = [];
  private seq = 0;
  private listeners = new Set<(entries: LogEntry[]) => void>();
  private mirrorToConsole = true;

  setLevel(level: LogLevel) {
    this.level = level;
  }
  getLevel(): LogLevel {
    return this.level;
  }
  setConsoleMirror(enabled: boolean) {
    this.mirrorToConsole = enabled;
  }

  /** Snapshot of the in-memory ring buffer (newest last). */
  entries(): LogEntry[] {
    return this.buffer;
  }

  clear() {
    this.buffer = [];
    this.notify();
  }

  subscribe(listener: (entries: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Returns a logger bound to a scope: `const l = log.scoped("autosave")`. */
  scoped(scope: string) {
    return {
      debug: (message: string, data?: unknown) => this.write("debug", scope, message, data),
      info: (message: string, data?: unknown) => this.write("info", scope, message, data),
      warn: (message: string, data?: unknown) => this.write("warn", scope, message, data),
      error: (message: string, data?: unknown) => this.write("error", scope, message, data),
    };
  }

  debug = (message: string, data?: unknown) => this.write("debug", "app", message, data);
  info = (message: string, data?: unknown) => this.write("info", "app", message, data);
  warn = (message: string, data?: unknown) => this.write("warn", "app", message, data);
  error = (message: string, data?: unknown) => this.write("error", "app", message, data);

  private write(level: LogEntry["level"], scope: string, message: string, data?: unknown) {
    if (ORDER[level] < ORDER[this.level]) return;
    const entry: LogEntry = { id: ++this.seq, level, scope, message, data, at: Date.now() };
    this.buffer = [...this.buffer, entry].slice(-MAX_BUFFER);
    if (this.mirrorToConsole) {
      const fn =
        level === "debug"
          ? console.debug
          : level === "info"
            ? console.info
            : level === "warn"
              ? console.warn
              : console.error;
      fn(`[${scope}] ${message}`, data ?? "");
    }
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) listener(this.buffer);
  }
}

export const log = new Logger();
