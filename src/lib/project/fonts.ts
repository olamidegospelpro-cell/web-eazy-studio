/**
 * FontService — discovers fonts available on the user's machine.
 *
 * Strategy (no bundled font libraries, by requirement):
 *  1. `queryLocalFonts()` (Local Font Access API) gives the real installed list
 *     after a permission prompt — Chromium desktop, and Tauri later.
 *  2. Otherwise probe a curated list of common system faces with
 *     `document.fonts.check()`, which needs no permission.
 *  3. Web-safe generics are always offered as a last resort.
 */
export interface FontOption {
  family: string;
  source: "local" | "probed" | "generic";
}

const PROBE_LIST = [
  "Inter",
  "SF Pro Text",
  "Helvetica Neue",
  "Helvetica",
  "Arial",
  "Segoe UI",
  "Roboto",
  "Ubuntu",
  "Cantarell",
  "Noto Sans",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Georgia",
  "Times New Roman",
  "Palatino",
  "Garamond",
  "Baskerville",
  "Courier New",
  "JetBrains Mono",
  "SF Mono",
  "Menlo",
  "Consolas",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Futura",
  "Optima",
  "Gill Sans",
];

const GENERICS = ["system-ui", "sans-serif", "serif", "monospace", "cursive"];

type FontWindow = Window & {
  queryLocalFonts?: () => Promise<{ family: string }[]>;
};

export const FontService = {
  get supportsLocalFonts() {
    return (
      typeof window !== "undefined" && typeof (window as FontWindow).queryLocalFonts === "function"
    );
  },

  /** Permission-free detection — safe to call on mount. */
  probeSystemFonts(): FontOption[] {
    const found: FontOption[] = [];
    if (typeof document !== "undefined" && "fonts" in document) {
      for (const family of PROBE_LIST) {
        try {
          if (document.fonts.check(`12px "${family}"`)) found.push({ family, source: "probed" });
        } catch {
          /* ignore unsupported family strings */
        }
      }
    }
    if (found.length === 0) {
      found.push(
        ...PROBE_LIST.slice(0, 8).map((family) => ({ family, source: "probed" as const })),
      );
    }
    return [...found, ...GENERICS.map((family) => ({ family, source: "generic" as const }))];
  },

  /** Requests the full installed-font list. Requires a user gesture. */
  async requestLocalFonts(): Promise<FontOption[]> {
    const query = (window as FontWindow).queryLocalFonts;
    if (!query) throw new Error("This runtime cannot list installed fonts");
    const fonts = await query();
    const families = [...new Set(fonts.map((f) => f.family))].sort((a, b) => a.localeCompare(b));
    return [
      ...families.map((family) => ({ family, source: "local" as const })),
      ...GENERICS.map((family) => ({ family, source: "generic" as const })),
    ];
  },
};
