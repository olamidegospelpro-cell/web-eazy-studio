import { createFileRoute } from "@tanstack/react-router";

// Gemini 2.5 Flash-Lite is no longer available to new API users.
// If Vercel still has the old model variable configured, ignore that deprecated value.
const configuredModel = process.env.WEBEAZY_GEMINI_MODEL?.trim();
const MODEL = configuredModel && configuredModel !== "gemini-2.5-flash-lite"
  ? configuredModel
  : "gemini-3.5-flash-lite";
// Support the documented variable name plus the existing Vercel variable name while debugging.
const API_KEY = process.env.GEMINI_API_KEY || process.env["Gemini-api-key"];

const jsonHeaders = { "Content-Type": "application/json" };

export const Route = createFileRoute("/api/webeazy-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!API_KEY) {
          console.error("[WebEazy AI] Gemini API key is missing. Checked GEMINI_API_KEY and Gemini-api-key.");
          return Response.json(
            { error: "Gemini API key is not configured on the server" },
            { status: 503, headers: jsonHeaders },
          );
        }

        try {
          const body = await request.json() as {
            action?: string;
            prompt?: string;
            block?: unknown;
            instruction?: string;
            primary?: string;
          };
          const action = body.action || "generate";
          const prompt = action === "refine"
            ? `You are WebEazy AI, an AI design assistant inside a visual website editor. Return ONLY valid JSON with a single key "patch". The patch may contain only fields from this element: text, x, y, width, height, background, color, radius, locked. Do not change id, type, or name. Apply the user's instruction while preserving the element's intent. Element: ${JSON.stringify(body.block)}. Brand primary colour: ${body.primary || "#22c55e"}. Instruction: ${body.instruction || "Improve this element"}.`
            : `You are WebEazy AI, an AI website design agent. Turn the user's business request into a polished editable website layout. Return ONLY valid JSON matching this exact shape: {"businessName":string,"businessType":string,"tagline":string,"primary":string,"secondary":string,"blocks":[{"id":string,"type":"heading"|"text"|"button"|"card"|"shape","name":string,"text":string,"x":number,"y":number,"width":number,"height":number,"background":string,"color":string,"radius":number,"locked":boolean}]}. Use 7-12 blocks. Make the layout desktop-friendly, visually coherent and suitable for a Nigerian small business. Use natural copy. Keep x/y/width/height within a 1120x900 canvas. The user request is: ${body.prompt || "Create a professional business website"}`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": API_KEY,
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.7,
                maxOutputTokens: 5000,
              },
            }),
          });

          const raw = await response.text();
          let data: { error?: { message?: string; status?: string; code?: number } } | null = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = null;
          }

          if (!response.ok) {
            const message = data?.error?.message || raw || "Gemini request failed";
            console.error("[WebEazy AI] Gemini request failed", {
              status: response.status,
              statusText: response.statusText,
              model: MODEL,
              message,
            });
            return Response.json(
              {
                error: message,
                provider: "Gemini",
                status: response.status,
                model: MODEL,
              },
              { status: 502, headers: jsonHeaders },
            );
          }

          const successData = data as unknown as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          } | null;
          const text = successData?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("") || "";

          if (!text) {
            console.error("[WebEazy AI] Gemini returned a successful response with no text", {
              model: MODEL,
              rawResponse: raw.slice(0, 1000),
            });
            return Response.json(
              { error: "Gemini returned no content", provider: "Gemini", model: MODEL },
              { status: 502, headers: jsonHeaders },
            );
          }

          return new Response(text, { headers: jsonHeaders });
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI request failed";
          console.error("[WebEazy AI] Server error", { message, model: MODEL });
          return Response.json(
            { error: message, provider: "WebEazy AI" },
            { status: 500, headers: jsonHeaders },
          );
        }
      },
    },
  },
});
