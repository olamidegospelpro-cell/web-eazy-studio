/**
 * ColorService — pure color math plus the user's color memory.
 *
 * All color parsing/formatting in WebEazy goes through here so hex, rgb(a) and
 * hsl inputs behave identically everywhere (color picker, validator, style
 * generator). Recent/favorite colors persist in localStorage — they are user
 * preferences, not project data, so they follow the user across projects.
 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
}

const RECENTS_KEY = "webeazy.colors.recent.v1";
const FAVORITES_KEY = "webeazy.colors.favorites.v1";
const RECENTS_LIMIT = 18;

const clamp = (n: number, min = 0, max = 255) => Math.min(max, Math.max(min, n));
const hex2 = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage full or blocked — color memory is non-critical */
  }
}

export const ColorService = {
  isValid(value: string): boolean {
    return ColorService.parse(value) !== null;
  },

  /** Accepts `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()/rgba()`, `hsl()/hsla()`. */
  parse(value: string): Rgb | null {
    const input = value?.trim().toLowerCase();
    if (!input) return null;

    if (input.startsWith("#")) {
      const h = input.slice(1);
      if (![3, 4, 6, 8].includes(h.length) || /[^0-9a-f]/.test(h)) return null;
      const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
      if (h.length <= 4) {
        return {
          r: expand(h[0]!),
          g: expand(h[1]!),
          b: expand(h[2]!),
          a: h.length === 4 ? expand(h[3]!) / 255 : 1,
        };
      }
      return {
        r: expand(h.slice(0, 2)),
        g: expand(h.slice(2, 4)),
        b: expand(h.slice(4, 6)),
        a: h.length === 8 ? expand(h.slice(6, 8)) / 255 : 1,
      };
    }

    const nums = input.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    if (input.startsWith("rgb") && nums.length >= 3) {
      return { r: clamp(nums[0]!), g: clamp(nums[1]!), b: clamp(nums[2]!), a: nums[3] ?? 1 };
    }
    if (input.startsWith("hsl") && nums.length >= 3) {
      return ColorService.hslToRgb({
        h: nums[0]!,
        s: nums[1]!,
        l: nums[2]!,
        a: nums[3] ?? 1,
      });
    }
    return null;
  },

  toHex(value: string | Rgb, withAlpha = false): string {
    const rgb = typeof value === "string" ? ColorService.parse(value) : value;
    if (!rgb) return "#000000";
    const base = `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`;
    return withAlpha && rgb.a < 1 ? `${base}${hex2(rgb.a * 255)}` : base;
  },

  toRgbString(value: string | Rgb): string {
    const rgb = typeof value === "string" ? ColorService.parse(value) : value;
    if (!rgb) return "rgb(0, 0, 0)";
    const { r, g, b, a } = rgb;
    return a < 1
      ? `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`
      : `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  },

  toHslString(value: string | Rgb): string {
    const hsl = ColorService.toHsl(value);
    const h = Math.round(hsl.h);
    const s = Math.round(hsl.s);
    const l = Math.round(hsl.l);
    return hsl.a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${Number(hsl.a.toFixed(3))})` : `hsl(${h}, ${s}%, ${l}%)`;
  },

  toHsl(value: string | Rgb): Hsl {
    const rgb = (typeof value === "string" ? ColorService.parse(value) : value) ?? {
      r: 0,
      g: 0,
      b: 0,
      a: 1,
    };
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100, a: rgb.a };
  },

  hslToRgb({ h, s, l, a = 1 }: Hsl): Rgb {
    const sN = Math.min(100, Math.max(0, s)) / 100;
    const lN = Math.min(100, Math.max(0, l)) / 100;
    const c = (1 - Math.abs(2 * lN - 1)) * sN;
    const hp = (((h % 360) + 360) % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    const [r1, g1, b1] =
      hp < 1
        ? [c, x, 0]
        : hp < 2
          ? [x, c, 0]
          : hp < 3
            ? [0, c, x]
            : hp < 4
              ? [0, x, c]
              : hp < 5
                ? [x, 0, c]
                : [c, 0, x];
    const m = lN - c / 2;
    return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255, a };
  },

  withOpacity(value: string, alpha: number): string {
    const rgb = ColorService.parse(value);
    if (!rgb) return value;
    return ColorService.toRgbString({ ...rgb, a: Math.min(1, Math.max(0, alpha)) });
  },

  getOpacity(value: string): number {
    return ColorService.parse(value)?.a ?? 1;
  },

  mix(a: string, b: string, weight = 0.5): string {
    const ca = ColorService.parse(a);
    const cb = ColorService.parse(b);
    if (!ca || !cb) return a;
    const w = Math.min(1, Math.max(0, weight));
    return ColorService.toHex({
      r: ca.r + (cb.r - ca.r) * w,
      g: ca.g + (cb.g - ca.g) * w,
      b: ca.b + (cb.b - ca.b) * w,
      a: 1,
    });
  },

  lighten: (value: string, amount = 0.1) => ColorService.mix(value, "#ffffff", amount),
  darken: (value: string, amount = 0.1) => ColorService.mix(value, "#000000", amount),

  /** Relative luminance (WCAG). */
  luminance(value: string): number {
    const rgb = ColorService.parse(value) ?? { r: 0, g: 0, b: 0, a: 1 };
    const channel = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  },

  contrast(a: string, b: string): number {
    const la = ColorService.luminance(a);
    const lb = ColorService.luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  },

  /** Readable foreground (`#ffffff`/near-black) for a given background. */
  readableOn(background: string): string {
    return ColorService.luminance(background) > 0.45 ? "#14161F" : "#FFFFFF";
  },

  /* ------------------ color memory (user preference) ------------------ */

  recents: () => readList(RECENTS_KEY),
  favorites: () => readList(FAVORITES_KEY),

  remember(value: string): string[] {
    const hex = ColorService.toHex(value, true);
    const next = [hex, ...readList(RECENTS_KEY).filter((c) => c !== hex)].slice(0, RECENTS_LIMIT);
    writeList(RECENTS_KEY, next);
    return next;
  },

  toggleFavorite(value: string): string[] {
    const hex = ColorService.toHex(value, true);
    const current = readList(FAVORITES_KEY);
    const next = current.includes(hex) ? current.filter((c) => c !== hex) : [hex, ...current].slice(0, 24);
    writeList(FAVORITES_KEY, next);
    return next;
  },
};
