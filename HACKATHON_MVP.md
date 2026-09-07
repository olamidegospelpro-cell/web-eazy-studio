# WebEazy — IdentArk × 3MTT AI Hackathon MVP

This branch contains a focused hackathon vertical slice of WebEazy.

## Demo story

1. Open WebEazy and click **Launch AI Studio**.
2. Describe a business in natural language.
3. Generate a first website draft.
4. Select any generated element and move, resize, rewrite, recolour or lock it.
5. Use **AI refine selection** to apply a natural-language design instruction.
6. Switch between desktop, tablet and mobile widths.
7. Preview the website and export a standalone HTML file.

The product message is: **AI handles the complexity. You keep the creativity.**

## AI modes

The MVP deliberately has a zero-credit fallback so the interface remains demonstrable even when no paid AI provider is connected.

- Without configuration, `src/lib/hackathon/ai-prototype.ts` uses the local prototype engine.
- If `VITE_WEBEAZY_AI_ENDPOINT` is set, WebEazy POSTs the user's prompt to that endpoint first and uses the local engine only if the endpoint fails.

This keeps the canvas independent from any single AI vendor and makes it easy to connect a real model before final hackathon submission.

## Remote AI endpoint contract

Set:

```text
VITE_WEBEAZY_AI_ENDPOINT=https://your-endpoint.example/generate
```

WebEazy sends:

```json
{
  "prompt": "Create a modern website for ...",
  "product": "WebEazy"
}
```

The endpoint should return:

```json
{
  "businessName": "Vicky Tech Innovations",
  "businessType": "solar and electrical company",
  "tagline": "Reliable energy for homes and businesses.",
  "primary": "#22c55e",
  "secondary": "#111827",
  "blocks": [
    {
      "id": "hero-title-1",
      "type": "heading",
      "name": "Hero heading",
      "text": "Vicky Tech Innovations",
      "x": 100,
      "y": 105,
      "width": 600,
      "height": 70,
      "background": "transparent",
      "color": "#ffffff",
      "radius": 0,
      "locked": false
    }
  ]
}
```

Supported block types are `heading`, `text`, `button`, `card`, and `shape`.

## Before final submission

Connect a live AI endpoint, verify it generates the documented schema, deploy the `hackathon-ai-mvp` branch, and record a short demo showing prompt → generated canvas → manual design freedom → AI refinement → responsive preview → export.
