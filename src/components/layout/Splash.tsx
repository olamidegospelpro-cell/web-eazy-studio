/**
 * Splash screen — shown while the application boots.
 * In the web build we fake a short delay; in the Tauri build this will hide
 * once the native window signals `ready`.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/branding/Logo";

export function Splash({
  children,
  minDurationMs = 700,
}: {
  children: ReactNode;
  minDurationMs?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  return (
    <>
      {children}
      {!ready && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6">
            <Logo size={56} showWordmark={false} />
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl font-semibold tracking-tight text-foreground">WebEazy</span>
              <span className="text-xs text-muted-foreground">
                Design beautiful websites faster
              </span>
            </div>
            <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-[splash_1.2s_ease-in-out_infinite] bg-brand" />
            </div>
          </div>
          <style>{`@keyframes splash { 0% { transform: translateX(-100%);} 100% { transform: translateX(200%);} }`}</style>
        </div>
      )}
    </>
  );
}
