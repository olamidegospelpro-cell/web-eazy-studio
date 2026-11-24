import assert from "node:assert/strict";
import test from "node:test";
import "./website-operations.test.ts";
import { migratePageDocument, websitePageSchema } from "./website-document.ts";
import "../../components/hackathon/site-export.test.ts";

const page = {
  schemaVersion: 2,
  id: "page_home",
  name: "Home",
  slug: "index",
  title: "Home",
  description: "",
  documentType: "website",
  breakpoints: { desktop: 1120, tablet: 760, mobile: 390 },
  nodes: [
    {
      id: "section_1",
      type: "section",
      name: "Hero",
      text: "",
      x: 0,
      y: 0,
      width: 1120,
      height: 360,
      background: "#111827",
      color: "#ffffff",
      radius: 0,
      locked: false,
      parentId: null,
      childIds: ["text_1"],
      visible: true,
    },
    {
      id: "text_1",
      type: "text",
      name: "Heading",
      text: "Welcome",
      x: 40,
      y: 48,
      width: 420,
      height: 64,
      background: "transparent",
      color: "#ffffff",
      radius: 0,
      locked: false,
      parentId: "section_1",
      childIds: [],
      visible: true,
      responsive: { mobile: { width: 320 } },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  lastModified: "2026-01-01T00:00:00.000Z",
};

test("validates typed website nodes, parent links, and responsive overrides", () => {
  assert.equal(websitePageSchema.safeParse(page).success, true);
});

test("rejects duplicate IDs and invalid parent-child references", () => {
  const duplicate = { ...page, nodes: [page.nodes[0], { ...page.nodes[1], id: "section_1" }] };
  assert.equal(websitePageSchema.safeParse(duplicate).success, false);

  const brokenParent = { ...page, nodes: [{ ...page.nodes[0], childIds: [] }, page.nodes[1]] };
  assert.equal(websitePageSchema.safeParse(brokenParent).success, false);
});

test("migrates v1 blocks without changing their IDs, geometry, styling, or image data", () => {
  const image = "data:image/png;base64,AA==";
  const migrated = migratePageDocument({
    schemaVersion: 1,
    id: "page_old",
    name: "Old page",
    slug: "index",
    title: "Old page",
    description: "",
    nodes: [
      {
        id: "image_1",
        type: "image",
        name: "Uploaded image",
        text: "",
        x: 12,
        y: 34,
        width: 160,
        height: 90,
        background: "#000000",
        color: "#ffffff",
        radius: 8,
        locked: true,
        src: image,
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    lastModified: "2026-01-02T00:00:00.000Z",
  });

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.nodes[0].id, "image_1");
  assert.deepEqual(
    [migrated.nodes[0].x, migrated.nodes[0].y, migrated.nodes[0].width, migrated.nodes[0].height],
    [12, 34, 160, 90],
  );
  assert.equal(migrated.nodes[0].src, image);
  assert.equal(migrated.nodes[0].locked, true);
  assert.equal(migrated.nodes[0].parentId, null);
});

test("rejects unsupported legacy node types instead of silently dropping them", () => {
  assert.throws(() =>
    migratePageDocument({
      schemaVersion: 1,
      id: "page_old",
      name: "Old page",
      slug: "index",
      title: "",
      description: "",
      nodes: [{ id: "bad", type: "unknown", x: 0, y: 0, width: 1, height: 1 }],
      createdAt: "2026-01-01T00:00:00.000Z",
      lastModified: "2026-01-01T00:00:00.000Z",
    }),
  );
});
