/**
 * Live theme preview — a miniature website rendered with the draft theme.
 * Uses ThemeService.toCssVars so preview and exported theme always match.
 */
import { ThemeService, type ProjectTheme } from "@/lib/project";

export function ThemePreview({ theme }: { theme: ProjectTheme }) {
  const vars = ThemeService.toCssVars(theme) as React.CSSProperties;

  return (
    <div style={vars} className="overflow-hidden rounded-lg border border-border">
      <div style={{ background: "var(--wz-background)", color: "var(--wz-text)" }} className="p-4">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--wz-font-heading)" }} className="text-sm font-semibold">
            {theme.name || "Preview"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full" style={{ background: "var(--wz-primary)" }} />
            <span
              className="h-1.5 w-4 rounded-full"
              style={{ background: "var(--wz-secondary)" }}
            />
            <span className="h-1.5 w-3 rounded-full" style={{ background: "var(--wz-accent)" }} />
          </div>
        </div>

        <h3
          style={{ fontFamily: "var(--wz-font-heading)" }}
          className="mt-4 text-lg font-bold leading-snug"
        >
          Build websites without the busywork
        </h3>
        <p
          style={{ fontFamily: "var(--wz-font-body)", opacity: 0.75 }}
          className="mt-1 text-xs leading-relaxed"
        >
          This preview updates as you change colors and fonts.
        </p>

        <div className="mt-3 flex gap-2">
          <span
            style={{
              background: "var(--wz-primary)",
              color: "#fff",
              borderRadius: "var(--wz-radius-md)",
              fontFamily: "var(--wz-font-button)",
            }}
            className="px-3 py-1.5 text-[11px] font-medium"
          >
            Get started
          </span>
          <span
            style={{
              background: "transparent",
              color: "var(--wz-secondary)",
              border: "1px solid var(--wz-secondary)",
              borderRadius: "var(--wz-radius-md)",
              fontFamily: "var(--wz-font-button)",
            }}
            className="px-3 py-1.5 text-[11px] font-medium"
          >
            Learn more
          </span>
        </div>

        <div
          style={{
            background: "var(--wz-surface)",
            borderRadius: "var(--wz-radius-lg)",
            boxShadow: "var(--wz-shadow-md)",
          }}
          className="mt-4 grid grid-cols-3 gap-2 p-3"
        >
          {(["success", "warning", "danger"] as const).map((key) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: `var(--wz-${key})` }} />
              <span
                style={{ fontFamily: "var(--wz-font-body)" }}
                className="text-[10px] capitalize opacity-70"
              >
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
