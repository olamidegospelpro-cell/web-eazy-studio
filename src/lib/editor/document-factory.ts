import { createEditorNode, createNodeId } from "./node-factory";
import type { EditorDocument, EditorNode, EditorPage } from "./document-types";
import { DOCUMENT_SCHEMA_VERSION } from "./document-types";

export function createStarterDocument(pageId = createNodeId("page")): EditorDocument {
  const root = createEditorNode("root", { id: createNodeId("root"), name: "Home" });
  const hero = createEditorNode("section", {
    name: "Hero",
    parentId: root.id,
    styles: { minHeight: "560px", display: "flex", alignItems: "center" },
  });
  const container = createEditorNode("container", {
    name: "Hero Container",
    parentId: hero.id,
    styles: { maxWidth: "1200px", marginInline: "auto", paddingInline: "24px" },
  });
  const heading = createEditorNode("heading", {
    name: "Hero Heading",
    parentId: container.id,
    props: { text: "Build something beautiful", level: 1 },
  });
  const text = createEditorNode("text", {
    name: "Hero Copy",
    parentId: container.id,
    props: { text: "Start with a clean canvas and make it yours." },
  });
  const button = createEditorNode("button", {
    name: "Hero Button",
    parentId: container.id,
    props: { text: "Get started", href: "#" },
  });

  const nodes: Record<string, EditorNode> = {
    [root.id]: root,
    [hero.id]: hero,
    [container.id]: container,
    [heading.id]: heading,
    [text.id]: text,
    [button.id]: button,
  };

  nodes[root.id] = { ...root, childIds: [hero.id] };
  nodes[hero.id] = { ...hero, childIds: [container.id] };
  nodes[container.id] = { ...container, childIds: [heading.id, text.id, button.id] };

  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    pageId,
    nodes,
    rootNodeId: root.id,
    selectedNodeIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createStarterPage(name = "Home", slug = "home"): EditorPage {
  const now = new Date().toISOString();
  const pageId = createNodeId("page");
  const document = createStarterDocument(pageId);
  return {
    id: pageId,
    name,
    slug,
    title: name,
    description: "",
    rootNodeId: document.rootNodeId,
    nodeIds: Object.keys(document.nodes),
    isHome: true,
    createdAt: now,
    updatedAt: now,
  };
}
