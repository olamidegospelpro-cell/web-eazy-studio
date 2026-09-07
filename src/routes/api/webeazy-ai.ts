import { createFileRoute } from "@tanstack/react-router";

const MODEL = process.env.WEBEAZY_GEMINI_MODEL || "gemini-2.5-flash-lite";
const API_KEY = process.env.GEMINI_API_KEY;

const jsonHeaders = { "Content-Type": "application/json" };

export const Route = createFileRoute("/api/webeazy-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!API_KEY) return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503, headers: jsonHeaders });
        try {
          const body = await request.json() as { action?: string; prompt?: string; block?: unknown; instruction?: string; primary?: string };
          const action = body.action || "generate";
          const prompt = action === "refine"
            ? `You are WebEazy AI, an AI design assistant inside a visual website editor. Return ONLY valid JSON with a single key \"patch\". The patch may contain only fields from this element: text, x, y, width, height, background, color, radius, locked. Do not change id, type, or name. Apply the user's instruction while preserving the element's intent. Element: ${JSON.stringify(body.block)}. Brand primary colour: ${body.primary || "#22c55e"}. Instruction: ${body.instruction || "Improve this element"}.`
            : `You are WebEazy AI, an AI website design agent. Turn the user's business request into a polished editable website layout. Return ONLY valid JSON matching this exact shape: {"businessName":string,"businessType":string,"tagline":string,"primary":string,"secondary":string,"blocks":[{"id":string,"type":"heading"|"text"|"button"|"card"|"shape","name":string,"text":string,"x":number,"y":number,"width":number,"height":number,"background":string,"color":string,"radius":number,"locked":boolean}]}. Use 7-12 blocks. Make the layout desktop-friendly, visually coherent and suitable for a Nigerian small business. Use natural copy. Keep x/y/width/height within a 1120x900 canvas. The user request is: ${body.prompt || "Create a professional business website"}`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { response_mime_type: "application/json", temperature: 0.7, maxOutputTokens: 5000 },
            }),
          });
          const data = await response.json();
          if (!response.ok) return Response.json({ error: data?.error?.message || "Gemini request failed" }, { status: 502, headers: jsonHeaders });
          const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
          if (!text) return Response.json({ error: "Gemini returned no content" }, { status: 502, headers: jsonHeaders });
          return new Response(text, { headers: jsonHeaders });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "AI request failed" }, { status: 500, headers: jsonHeaders });
        }
      },
    },
  },
});
