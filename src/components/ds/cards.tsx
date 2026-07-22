/**
 * Card variants.
 *
 * A single `Surface` primitive backs every card so hover/selected/disabled
 * states stay identical. Feature cards (ProjectCard, TemplateCard,
 * PluginCard, AssetCard, InfoCard) compose Surface with domain content.
 * Later milestones import these directly and pass real data.
 */
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

type SurfaceProps = {
  onClick?: () => void;
  href?: string;
  selected?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
};

export function Surface({
  onClick,
  selected,
  disabled,
  interactive = true,
  className,
  children,
}: SurfaceProps) {
  const Comp: React.ElementType = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      data-selected={selected ? "true" : undefined}
      className={cn(
        "group relative flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-xs text-left",
        interactive &&
          !disabled &&
          "transition-all hover:border-border-strong hover:shadow-sm hover:-translate-y-px",
        selected && "border-brand ring-2 ring-brand/25",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

/* -------------------- Project card -------------------- */
export function ProjectCard({
  name,
  updatedAt,
  thumbnail,
  onClick,
  selected,
}: {
  name: string;
  updatedAt: string;
  thumbnail?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <Surface onClick={onClick} selected={selected} className="overflow-hidden">
      <div className="aspect-video w-full overflow-hidden bg-canvas">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
            No preview
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{updatedAt}</p>
        </div>
      </div>
    </Surface>
  );
}

/* -------------------- Template card -------------------- */
export function TemplateCard({
  name,
  description,
  onClick,
  selected,
}: {
  name: string;
  description: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <Surface onClick={onClick} selected={selected} className="p-4 gap-2">
      <div className="aspect-[4/3] w-full rounded-md bg-brand-gradient opacity-90" />
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </Surface>
  );
}

/* -------------------- Plugin card -------------------- */
export function PluginCard({
  name,
  description,
  author,
  installed,
  onClick,
}: {
  name: string;
  description: string;
  author?: string;
  installed?: boolean;
  onClick?: () => void;
}) {
  return (
    <Surface onClick={onClick} className="p-4 gap-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{name}</p>
          {author && <p className="text-[11px] text-muted-foreground">by {author}</p>}
        </div>
        {installed && <StatusBadge tone="success">Installed</StatusBadge>}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Surface>
  );
}

/* -------------------- Asset card -------------------- */
export function AssetCard({
  name,
  src,
  onClick,
  selected,
}: {
  name: string;
  src?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <Surface onClick={onClick} selected={selected} className="overflow-hidden">
      <div className="aspect-square w-full bg-muted">
        {src && <img src={src} alt={name} className="h-full w-full object-cover" />}
      </div>
      <p className="truncate border-t border-border px-2 py-1.5 text-[11px] text-muted-foreground">
        {name}
      </p>
    </Surface>
  );
}

/* -------------------- Info card (settings/about panels) -------------------- */
export function InfoCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Surface interactive={false} className={cn("p-4 gap-3", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="mt-0.5 rounded-md bg-accent p-1.5 text-brand">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold">{title}</h3>}
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </Surface>
  );
}
