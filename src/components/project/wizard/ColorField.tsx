/**
 * Reusable color row: swatch + native picker + hex input.
 * Used by the wizard today and by the Theme Manager milestone later.
 */
import { Input } from "@/components/ui/input";

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `color-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
        style={{ background: value }}
        aria-label={`${label} color swatch`}
      >
        <input
          id={id}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="mt-1 h-7 font-mono text-[11px]"
          spellCheck={false}
          maxLength={9}
        />
      </div>
    </div>
  );
}
