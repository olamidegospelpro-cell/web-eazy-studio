/**
 * GlobalSearch — UI shell only (Ctrl/⌘ + P).
 *
 * Indexing is intentionally out of scope for this milestone: the component
 * accepts a pluggable `SearchProvider` list so later milestones can register
 * page/asset/widget indexes without touching this file. Until then it falls
 * back to searching registered commands and shows an explanatory empty state.
 */
import { useEffect, useMemo, useState } from "react";
import { FileSearch } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CommandRegistry, scoreMatch, useUi } from "@/lib/core";
import { commandIcon } from "./command-icons";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  icon?: string;
  run: () => void;
}

export type SearchProvider = (query: string) => SearchResult[] | Promise<SearchResult[]>;

const providers = new Set<SearchProvider>();

/** Later milestones call this to contribute pages/assets/widgets to search. */
export function registerSearchProvider(provider: SearchProvider): () => void {
  providers.add(provider);
  return () => providers.delete(provider);
}

export function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useUi();
  const [query, setQuery] = useState("");
  const [external, setExternal] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setExternal([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    let cancelled = false;
    if (!query.trim() || providers.size === 0) {
      setExternal([]);
      return;
    }
    void Promise.all([...providers].map((provider) => provider(query))).then((batches) => {
      if (!cancelled) setExternal(batches.flat());
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const commandResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    return CommandRegistry.list()
      .map((command) => ({ command, score: scoreMatch(query, command) }))
      .filter((entry) => entry.score >= 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ command }) => ({
        id: command.id,
        title: command.title,
        subtitle: command.category,
        group: "Commands",
        icon: command.icon,
        run: () => void CommandRegistry.execute(command.id),
      }));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const result of [...external, ...commandResults]) {
      const list = map.get(result.group) ?? [];
      list.push(result);
      map.set(result.group, list);
    }
    return [...map.entries()];
  }, [external, commandResults]);

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Search project — pages, assets, settings…"
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1.5 py-6 text-center">
            <FileSearch className="h-5 w-5 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {query ? "Nothing found." : "Start typing to search."}
            </p>
            <p className="text-xs text-muted-foreground/70">
              Project indexing (pages, assets, widgets) arrives with the editor.
            </p>
          </div>
        </CommandEmpty>
        {grouped.map(([group, results]) => (
          <CommandGroup key={group} heading={group}>
            {results.map((result) => {
              const Icon = commandIcon(result.icon);
              return (
                <CommandItem
                  key={`${group}:${result.id}`}
                  value={`${result.title} ${result.subtitle ?? ""}`}
                  onSelect={() => {
                    setSearchOpen(false);
                    result.run();
                  }}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
