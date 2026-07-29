/**
 * NotificationService — one API for every user-visible message.
 *
 * Wraps `notify` (sonner) from the design system and adds the two shapes
 * features keep re-inventing: promise-bound loading toasts and determinate
 * progress toasts. Modules should import from here rather than sonner so
 * styling/placement stays consistent app-wide.
 */
import { toast as sonner } from "sonner";
import { notify } from "@/components/ds/toast";
import { log } from "./logger";

export type NotificationHandle = string | number;

export interface ProgressHandle {
  /** 0–100. */
  update(percent: number, message?: string): void;
  done(message?: string): void;
  fail(message?: string): void;
}

function bar(percent: number) {
  const filled = Math.round(Math.min(100, Math.max(0, percent)) / 10);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)} ${Math.round(percent)}%`;
}

export const NotificationService = {
  success: (message: string, description?: string) => {
    log.scoped("notify").debug(message);
    return notify.success(message, description);
  },
  info: (message: string, description?: string) => notify.info(message, description),
  warning: (message: string, description?: string) => {
    log.scoped("notify").warn(message);
    return notify.warning(message, description);
  },
  error: (message: string, description?: string) => {
    log.scoped("notify").error(message, description);
    return notify.error(message, description);
  },

  /** Indeterminate spinner toast. Dismiss with `NotificationService.dismiss(id)`. */
  loading: (message: string): NotificationHandle => notify.loading(message),

  /** Binds a toast to a promise: loading → success/error automatically. */
  promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((value: T) => string); error: string | ((error: unknown) => string) },
  ): Promise<T> {
    sonner.promise(promise, messages);
    return promise;
  },

  /** Determinate progress toast for long tasks (exports, bulk saves). */
  progress(message: string): ProgressHandle {
    const id = sonner.loading(message, { description: bar(0), duration: Infinity });
    return {
      update(percent, next) {
        sonner.loading(next ?? message, { id, description: bar(percent), duration: Infinity });
      },
      done(next) {
        sonner.success(next ?? `${message} — done`, { id, description: undefined, duration: 3000 });
      },
      fail(next) {
        sonner.error(next ?? `${message} — failed`, { id, description: undefined, duration: 5000 });
      },
    };
  },

  dismiss: (id?: NotificationHandle) => sonner.dismiss(id),
};
