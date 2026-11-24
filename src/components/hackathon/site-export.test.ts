import assert from "node:assert/strict";
import test from "node:test";
import { buildGeneratedSiteExportHtml } from "./site-export.ts";

test("exports responsive page content from the saved nodes", () => {
  const html = buildGeneratedSiteExportHtml("A & B", [
    {
      id: "copy",
      type: "text",
      name: "Copy",
      text: "<hello>",
      x: 8,
      y: 12,
      width: 420,
      height: 80,
      background: "transparent",
      color: "#ffffff",
      radius: 0,
      locked: false,
      parentId: null,
      childIds: [],
      visible: true,
      responsive: { mobile: { x: 16, width: 320 } },
    },
    {
      id: "section",
      type: "section",
      name: "Hero",
      text: "",
      x: 100,
      y: 120,
      width: 800,
      height: 300,
      background: "#111827",
      color: "#ffffff",
      radius: 0,
      locked: false,
      parentId: null,
      childIds: ["heading"],
      visible: true,
    },
    {
      id: "heading",
      type: "heading",
      name: "Heading",
      text: "Nested title",
      x: 124,
      y: 144,
      width: 400,
      height: 64,
      background: "transparent",
      color: "#ffffff",
      radius: 0,
      locked: false,
      parentId: "section",
      childIds: [],
      visible: true,
    },
  ]);

  assert.match(html, /<title>A &amp; B<\/title>/);
  assert.match(html, /&lt;hello&gt;/);
  assert.match(html, /max-width:1120px/);
  assert.match(html, /@media\(max-width:390px\)\{\.node-0\{left:16px;width:320px\}\}/);
  assert.match(html, /<section class="node-1"/);
  assert.match(html, /class="node-2" style="position:absolute;left:24px;top:24px/);
});
