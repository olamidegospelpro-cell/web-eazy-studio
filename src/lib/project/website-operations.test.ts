import assert from "node:assert/strict";
import test from "node:test";
import { createWebsiteNode } from "./website-document.ts";
import {
  insertWebsiteNode,
  removeWebsiteNodeTree,
  reorderWebsiteSibling,
} from "./website-operations.ts";

const makeNode = (
  id: string,
  type: "section" | "container" | "text",
  parentId: string | null = null,
) =>
  createWebsiteNode({
    id,
    type,
    name: id,
    text: "",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    background: "transparent",
    color: "#111111",
    radius: 0,
    locked: false,
    parentId,
  });

test("inserts children into valid structural parents and rejects duplicate IDs", () => {
  const section = makeNode("section", "section");
  const child = makeNode("child", "text");
  const inserted = insertWebsiteNode([section], child, section.id);

  assert.deepEqual(inserted[0].childIds, ["child"]);
  assert.equal(inserted[1].parentId, "section");
  assert.throws(() => insertWebsiteNode(inserted, child), /already exists/);
});

test("removes a nested tree and unlinks it from its parent", () => {
  const section = makeNode("section", "section");
  const container = makeNode("container", "container", section.id);
  const text = makeNode("text", "text", container.id);
  const nodes = insertWebsiteNode(
    insertWebsiteNode([section], container, section.id),
    text,
    container.id,
  );

  assert.deepEqual(
    removeWebsiteNodeTree(nodes, container.id).map((node) => node.id),
    ["section"],
  );
  assert.deepEqual(removeWebsiteNodeTree(nodes, container.id)[0].childIds, []);
});

test("reorders only siblings at the requested hierarchy level", () => {
  const section = makeNode("section", "section");
  const first = makeNode("first", "text", section.id);
  const second = makeNode("second", "text", section.id);
  const nodes = insertWebsiteNode(
    insertWebsiteNode(insertWebsiteNode([section], first, section.id), second, section.id),
    makeNode("other-section", "section"),
  );
  const reordered = reorderWebsiteSibling(nodes, "second", -1);

  assert.deepEqual(reordered[0].childIds, ["second", "first"]);
  assert.deepEqual(reorderWebsiteSibling(reordered, "second", 1)[0].childIds, ["first", "second"]);
  assert.deepEqual(reorderWebsiteSibling(nodes, "first", -1)[0].childIds, ["first", "second"]);
});
