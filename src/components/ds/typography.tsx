/**
 * Typography primitives.
 *
 * Every text style used in WebEazy should route through one of these
 * components. Adding a new style? Extend `typographyVariants` — don't
 * sprinkle new className combos across features.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      display: "text-4xl font-bold tracking-tight leading-tight",
      h1: "text-2xl font-semibold tracking-tight leading-snug",
      h2: "text-xl font-semibold tracking-tight leading-snug",
      h3: "text-base font-semibold leading-snug",
      h4: "text-sm font-semibold leading-snug",
      bodyLg: "text-base font-normal leading-relaxed",
      body: "text-sm font-normal leading-relaxed",
      bodySm: "text-xs font-normal leading-relaxed text-muted-foreground",
      caption: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
      label: "text-xs font-medium text-foreground",
      code: "font-mono text-[12px] rounded bg-muted px-1.5 py-0.5 text-foreground",
      kbd: "font-mono text-[11px] rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground shadow-xs",
    },
  },
  defaultVariants: { variant: "body" },
});

type BaseProps = VariantProps<typeof typographyVariants> & {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
};

const defaultTag: Record<NonNullable<BaseProps["variant"]>, keyof React.JSX.IntrinsicElements> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  bodyLg: "p",
  body: "p",
  bodySm: "p",
  caption: "span",
  label: "span",
  code: "code",
  kbd: "kbd",
};

export function Text({
  variant = "body",
  asChild,
  className,
  children,
  ...rest
}: BaseProps & React.HTMLAttributes<HTMLElement>) {
  const Tag = (asChild ? Slot : defaultTag[variant ?? "body"]) as React.ElementType;
  return (
    <Tag className={cn(typographyVariants({ variant }), className)} {...rest}>
      {children}
    </Tag>
  );
}

export const Display = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="display" {...p} />;
export const H1 = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="h1" {...p} />;
export const H2 = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="h2" {...p} />;
export const H3 = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="h3" {...p} />;
export const H4 = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="h4" {...p} />;
export const BodyLg = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="bodyLg" {...p} />;
export const Body = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="body" {...p} />;
export const BodySm = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="bodySm" {...p} />;
export const Caption = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="caption" {...p} />;
export const Label = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="label" {...p} />;
export const Code = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="code" {...p} />;
export const Kbd = (p: React.HTMLAttributes<HTMLElement>) => <Text variant="kbd" {...p} />;
