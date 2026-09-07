export type DemoBlockType = "heading" | "text" | "button" | "card" | "shape";

export interface DemoBlock {
  id: string;
  type: DemoBlockType;
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  color: string;
  radius: number;
  locked: boolean;
}

export interface GeneratedSite {
  businessName: string;
  businessType: string;
  tagline: string;
  primary: string;
  secondary: string;
  blocks: DemoBlock[];
}

export interface AiPrototypeResult extends GeneratedSite {
  mode: "remote" | "local-prototype";
}

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function detectBusiness(prompt: string) {
  const lower = prompt.toLowerCase();
  const called = prompt.match(/(?:called|named)\s+([A-Z][\w&' -]{2,40})/i)?.[1]?.trim();
  const forMatch = prompt.match(/for\s+(?:a|an|the)?\s*([A-Z][\w&' -]{2,40}?)(?:\.|,|\s+(?:using|with|include|that|in)\b)/i)?.[1]?.trim();
  const businessName = called || forMatch || "Your Business";

  const businessType = lower.includes("solar")
    ? "solar and electrical company"
    : lower.includes("restaurant") || lower.includes("food")
      ? "food business"
      : lower.includes("fashion") || lower.includes("clothing")
        ? "fashion brand"
        : lower.includes("agency")
          ? "creative agency"
          : lower.includes("tech") || lower.includes("software")
            ? "technology company"
            : "growing business";

  return { businessName, businessType };
}

function palette(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("green") || lower.includes("solar")) return { primary: "#22c55e", secondary: "#111827" };
  if (lower.includes("purple")) return { primary: "#8b5cf6", secondary: "#18181b" };
  if (lower.includes("blue")) return { primary: "#2563eb", secondary: "#0f172a" };
  if (lower.includes("orange")) return { primary: "#f97316", secondary: "#1c1917" };
  return { primary: "#6d5dfc", secondary: "#171717" };
}

function copyFor(type: string, name: string) {
  if (type.includes("solar")) {
    return {
      tagline: "Reliable energy for homes and businesses.",
      intro: `${name} delivers practical solar, inverter and electrical solutions designed for dependable everyday power.`,
      services: ["Solar installation", "Inverter systems", "Electrical solutions"],
      cta: "Request a free consultation",
    };
  }
  if (type.includes("food")) {
    return {
      tagline: "Made fresh. Made memorable.",
      intro: `${name} brings thoughtful food, warm service and memorable experiences together in one place.`,
      services: ["Signature menu", "Catering", "Events"],
      cta: "Book or order today",
    };
  }
  if (type.includes("fashion")) {
    return {
      tagline: "Style with a point of view.",
      intro: `${name} creates distinctive fashion for people who want their style to feel personal, confident and current.`,
      services: ["New arrivals", "Custom pieces", "Style support"],
      cta: "Explore the collection",
    };
  }
  return {
    tagline: "Built to help your business move forward.",
    intro: `${name} combines clear strategy, useful services and a customer-first experience to help people get results faster.`,
    services: ["Core service", "Business support", "Customer solutions"],
    cta: "Start a conversation",
  };
}

export function generateLocally(prompt: string): GeneratedSite {
  const { businessName, businessType } = detectBusiness(prompt);
  const { primary, secondary } = palette(prompt);
  const copy = copyFor(businessType, businessName);

  const blocks: DemoBlock[] = [
    { id: uid("hero-shape"), type: "shape", name: "Hero background", text: "", x: 50, y: 50, width: 1010, height: 310, background: secondary, color: "#ffffff", radius: 28, locked: false },
    { id: uid("hero-title"), type: "heading", name: "Hero heading", text: businessName, x: 100, y: 105, width: 600, height: 70, background: "transparent", color: "#ffffff", radius: 0, locked: false },
    { id: uid("hero-copy"), type: "text", name: "Hero copy", text: copy.tagline, x: 100, y: 185, width: 560, height: 58, background: "transparent", color: "#d1d5db", radius: 0, locked: false },
    { id: uid("hero-button"), type: "button", name: "Primary CTA", text: copy.cta, x: 100, y: 270, width: 220, height: 50, background: primary, color: "#ffffff", radius: 12, locked: false },
    { id: uid("about"), type: "text", name: "About copy", text: copy.intro, x: 80, y: 415, width: 980, height: 70, background: "transparent", color: secondary, radius: 0, locked: false },
    ...copy.services.map((service, index) => ({
      id: uid(`service-${index}`),
      type: "card" as const,
      name: `Service ${index + 1}`,
      text: service,
      x: 80 + index * 330,
      y: 525,
      width: 300,
      height: 150,
      background: "#ffffff",
      color: secondary,
      radius: 18,
      locked: false,
    })),
    { id: uid("final-cta"), type: "button", name: "Final CTA", text: "Talk to us", x: 80, y: 730, width: 180, height: 48, background: secondary, color: "#ffffff", radius: 12, locked: false },
  ];

  return { businessName, businessType, tagline: copy.tagline, primary, secondary, blocks };
}

export async function generateWithAiPrototype(prompt: string): Promise<AiPrototypeResult> {
  const endpoint = (import.meta.env.VITE_WEBEAZY_AI_ENDPOINT as string | undefined)?.trim();

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, product: "WebEazy" }),
      });
      if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`);
      const data = (await response.json()) as GeneratedSite;
      if (!data?.blocks?.length) throw new Error("AI endpoint returned an invalid layout");
      return { ...data, mode: "remote" };
    } catch (error) {
      console.warn("WebEazy AI endpoint failed; using local prototype engine.", error);
    }
  }

  return { ...generateLocally(prompt), mode: "local-prototype" };
}

export function refineBlockLocally(block: DemoBlock, instruction: string, primary: string): DemoBlock {
  const lower = instruction.toLowerCase();
  const next = { ...block };

  if (lower.includes("premium") || lower.includes("modern")) {
    next.radius = Math.max(next.radius, 18);
    if (block.type === "card") next.background = "#f8fafc";
  }
  if (lower.includes("green")) next.background = "#22c55e";
  if (lower.includes("purple")) next.background = "#8b5cf6";
  if (lower.includes("brand") || lower.includes("primary")) next.background = primary;
  if (lower.includes("bigger") || lower.includes("large")) {
    next.width = Math.min(1100, Math.round(next.width * 1.15));
    next.height = Math.min(800, Math.round(next.height * 1.12));
  }
  if (lower.includes("shorter") || lower.includes("concise")) {
    const words = next.text.split(/\s+/).filter(Boolean);
    next.text = words.slice(0, Math.max(3, Math.ceil(words.length * 0.65))).join(" ");
  }
  if (lower.includes("stronger") || lower.includes("rewrite")) {
    if (next.type === "heading") next.text = `${next.text} — built for what comes next`;
    if (next.type === "button") next.text = next.text.toLowerCase().includes("start") ? "Start now" : "Get started";
  }

  return next;
}
