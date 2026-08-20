/** Recent projects list with per-project actions (metadata-only removal vs. file deletion). */
import { useState } from "react";
import { FolderOpen, MoreHorizontal, Copy, Pencil, FolderSearch, X, Trash2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
} from "@/components/ds";
import { Surface } from "@/components/ds/cards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProject, WEBSITE_TYPES, type RecentProject } from "@/lib/project";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export function RecentProjectsPanel({ onNewProject }: { onNewProject: () => void }) {
  const store = useProject();
  const [renaming, setRenaming] = useState<RecentProject | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<RecentProject | null>(null);

  if (store.recents.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No recent projects yet"
        description="Projects you create or open will appear here with their folder path."
        action={
          <Button size="sm" onClick={onNewProject}>
            Create your first project
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {store.recents.map((recent) => (
          <Surface key={recent.id} interactive={false} className="overflow-hidden">
            <button
              type="button"
              onClick={() => void store.openLocation(recent.location)}
              className="flex aspect-video w-full items-center justify-center bg-canvas text-[11px] text-muted-foreground transition-colors hover:bg-accent/50"
            >
              No preview yet
            </button>
            <div className="flex items-start justify-between gap-2 border-t border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{recent.name}</p>
                <p
                  className="truncate font-mono text-[10px] text-muted-foreground"
                  title={recent.location.path}
                >
                  {recent.location.path}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/80">
                  {WEBSITE_TYPES.find((t) => t.value === recent.websiteType)?.label ??
                    recent.websiteType}{" "}
                  · created {formatDate(recent.createdAt)} · opened {formatDate(recent.lastOpened)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label={`Actions for ${recent.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void store.openLocation(recent.location)}>
                    <FolderOpen className="h-3.5 w-3.5" /> Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameValue(recent.name);
                      setRenaming(recent);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void store.duplicateRecent(recent, `${recent.name} copy`)}
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void store.revealRecent(recent)}>
                    <FolderSearch className="h-3.5 w-3.5" /> Reveal folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void store.removeRecent(recent.id)}>
                    <X className="h-3.5 w-3.5" /> Remove from recent
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-danger" onClick={() => setDeleting(recent)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete project folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Surface>
        ))}
      </div>

      <Dialog open={Boolean(renaming)} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Rename project</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={60}
          />
          <Button
            size="sm"
            onClick={() => {
              if (renaming && renameValue.trim().length > 1)
                void store.renameRecent(renaming.id, renameValue.trim());
              setRenaming(null);
            }}
          >
            Save name
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete project folder?"
        description={
          deleting
            ? `Every file inside "${deleting.location.path}" will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete files"
        tone="danger"
        onConfirm={() => {
          if (deleting) void store.deleteRecentFolder(deleting);
          setDeleting(null);
        }}
      />
    </>
  );
}
