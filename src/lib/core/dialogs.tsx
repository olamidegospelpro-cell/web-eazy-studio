/**
 * DialogProvider — imperative dialog manager.
 *
 * Instead of every feature owning `useState` + an <AlertDialog>, call:
 *
 *   const dialogs = useDialogs();
 *   if (await dialogs.confirmDelete({ name: "Home page" })) ...
 *
 * All five shapes (confirm, warning, delete, info, error) render through the
 * same ConfirmDialog primitive so tone, spacing and button order never drift.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ds/confirm-dialog";
import { log } from "./logger";

export type DialogKind = "confirm" | "warning" | "delete" | "info" | "error";

export interface DialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface OpenDialog extends DialogOptions {
  kind: DialogKind;
  resolve: (value: boolean) => void;
}

export interface DialogApi {
  confirm(options: DialogOptions): Promise<boolean>;
  warn(options: DialogOptions): Promise<boolean>;
  confirmDelete(options: { name: string; description?: string; confirmLabel?: string }): Promise<boolean>;
  info(options: DialogOptions): Promise<boolean>;
  error(options: DialogOptions): Promise<boolean>;
  open(kind: DialogKind, options: DialogOptions): Promise<boolean>;
}

const DialogContext = createContext<DialogApi | null>(null);

const TONE: Record<DialogKind, "default" | "danger"> = {
  confirm: "default",
  warning: "danger",
  delete: "danger",
  info: "default",
  error: "danger",
};

const DEFAULT_CONFIRM: Record<DialogKind, string> = {
  confirm: "Confirm",
  warning: "Continue",
  delete: "Delete",
  info: "OK",
  error: "Dismiss",
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<OpenDialog | null>(null);

  const open = useCallback(
    (kind: DialogKind, options: DialogOptions) =>
      new Promise<boolean>((resolve) => {
        log.scoped("dialogs").debug(`open ${kind}: ${options.title}`);
        setCurrent({ kind, ...options, resolve });
      }),
    [],
  );

  const api = useMemo<DialogApi>(
    () => ({
      open,
      confirm: (options) => open("confirm", options),
      warn: (options) => open("warning", options),
      info: (options) => open("info", { cancelLabel: "Close", ...options }),
      error: (options) => open("error", { cancelLabel: "Close", ...options }),
      confirmDelete: ({ name, description, confirmLabel }) =>
        open("delete", {
          title: `Delete "${name}"?`,
          description: description ?? "This action cannot be undone.",
          confirmLabel: confirmLabel ?? "Delete",
        }),
    }),
    [open],
  );

  const settle = useCallback(
    (value: boolean) => {
      current?.resolve(value);
      setCurrent(null);
    },
    [current],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {current && (
        <ConfirmDialog
          open
          onOpenChange={(next) => !next && settle(false)}
          title={current.title}
          description={current.description}
          confirmLabel={current.confirmLabel ?? DEFAULT_CONFIRM[current.kind]}
          cancelLabel={current.cancelLabel ?? "Cancel"}
          tone={TONE[current.kind]}
          onConfirm={() => settle(true)}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialogs(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialogs must be used within <DialogProvider>");
  return ctx;
}
