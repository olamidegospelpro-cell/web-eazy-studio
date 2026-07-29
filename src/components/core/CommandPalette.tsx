/**
 * CommandPalette — global, searchable action launcher (Ctrl/⌘ + Shift + P).
 *
 * It renders whatever `CommandRegistry` contains, so new commands appear here
 * automatically. Results are grouped by category and ranked with `scoreMatch`.
 */
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { CommandRegistry, scoreMatch, formatAccelerator, useUi, type Command } from "@/lib/core";
import { commandIcon } from "./command-icons";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUi();
  const [commands, setCommands] = useState<Command[]>(() => CommandRegistry.list());
  const [query, setQuery] = useState("");

  useEffect(() => CommandRegistry.subscribe(setCommands), []);
  useEffect(() => {
    if (paletteOpen) setCommands(CommandRegistry.list());
    else setQuery("");
  }, [paletteOpen]);

  const groups = useMemo(() => {
    const scored = commands
      .map((command) => ({ command, score: scoreMatch(query, command) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const byCategory = new Map<string, Command[]>();
    for (const { command } of scored) {
      const list = byCategory.get(command.category) ?? [];
      list.push(command);
      byCategory.set(command.category, list);
    }
    return [...byCategory.entries()];
  }, [commands, query]);

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <CommandInput
        placeholder="Type a command…"
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>No matching commands.</CommandEmpty>
        {groups.map(([category, items], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((command) => {
                const Icon = commandIcon(command.icon);
                return (
                  <CommandItem
                    key={command.id}
                    value={`${command.title} ${command.keywords?.join(" ") ?? ""}`}
                    disabled={command.disabled}
                    onSelect={() => {
                      setPaletteOpen(false);
                      void CommandRegistry.execute(command.id);
                    }}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{command.title}</span>
                    {command.disabled && command.disabledReason && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {command.disabledReason}
                      </span>
                    )}
                    {command.accelerator && (
                      <CommandShortcut>{formatAccelerator(command.accelerator)}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
