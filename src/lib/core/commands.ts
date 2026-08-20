/**
 * CommandRegistry — every user-invokable action in one place.
 *
 * The Command Palette, keyboard shortcuts, menus and (later) plugins all read
 * from this registry, so an action is defined once and appears everywhere.
 * Commands are registered at runtime (usually by `AppCommandsProvider`) so
 * they can close over React state such as the project store or router.
 */
import { log } from "./logger";

export type CommandCategory =
  "Project" | "File" | "Edit" | "View" | "Navigate" | "Help" | "Plugins";

export interface Command {
  id: string;
  title: string;
  category: CommandCategory;
  /** lucide icon name resolved by the palette; keeps this module UI-free. */
  icon?: string;
  keywords?: string[];
  /** Accelerator id for display; the actual binding lives in ShortcutService. */
  accelerator?: string;
  disabled?: boolean;
  disabledReason?: string;
  run: () => void | Promise<void>;
}

class Registry {
  private commands = new Map<string, Command>();
  private listeners = new Set<(commands: Command[]) => void>();

  register(command: Command): () => void {
    this.commands.set(command.id, command);
    this.notify();
    return () => {
      this.commands.delete(command.id);
      this.notify();
    };
  }

  registerAll(commands: Command[]): () => void {
    const offs = commands.map((c) => this.register(c));
    return () => offs.forEach((off) => off());
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  list(): Command[] {
    return [...this.commands.values()];
  }

  async execute(id: string): Promise<void> {
    const command = this.commands.get(id);
    if (!command) {
      log.scoped("commands").warn(`unknown command "${id}"`);
      return;
    }
    if (command.disabled) return;
    log.scoped("commands").debug(`run ${id}`);
    await command.run();
  }

  subscribe(listener: (commands: Command[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = this.list();
    for (const listener of this.listeners) listener(list);
  }
}

export const CommandRegistry = new Registry();

/** Simple fuzzy-ish scorer used by the palette and global search. */
export function scoreMatch(query: string, command: Command): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const haystacks = [command.title, command.category, ...(command.keywords ?? [])].map((s) =>
    s.toLowerCase(),
  );
  let best = 0;
  for (const hay of haystacks) {
    if (hay === q) best = Math.max(best, 100);
    else if (hay.startsWith(q)) best = Math.max(best, 80);
    else if (hay.includes(q)) best = Math.max(best, 60);
    else if (q.split("").every((ch) => hay.includes(ch))) best = Math.max(best, 20);
  }
  return best;
}
