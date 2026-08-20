import type { EditorDocument, EditorNode } from "./document-types";
import { serializeDocument } from "./document-service";

export const WEBEAZY_PROJECT_EXTENSION = ".webeazy";
function esc(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}
function renderNode(id: string, nodes: Record<string, EditorNode>): string {
  const node = nodes[id];
  if (!node || node.hidden?.desktop === true) return "";
  const children = node.childIds.map((child) => renderNode(child, nodes)).join("\n");
  const style = Object.entries(node.styles ?? {})
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${esc(value)}`)
    .join(";");
  const className = `webeazy-${node.type}-${node.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (node.type === "root") return children;
  if (node.type === "heading")
    return `<h1 class="${className}" style="${style}">${esc(node.props.text ?? "Heading")}</h1>`;
  if (node.type === "text")
    return `<p class="${className}" style="${style}">${esc(node.props.text ?? "Text")}</p>`;
  if (node.type === "button")
    return `<a class="${className}" href="${esc(node.props.href ?? "#")}" style="${style}">${esc(node.props.text ?? "Button")}</a>`;
  if (node.type === "image")
    return `<img class="${className}" src="${esc(node.props.src ?? "")}" alt="${esc(node.props.alt ?? "")}" style="${style}" />`;
  if (node.type === "shape")
    return `<div class="${className}" aria-hidden="true" style="${style}"></div>`;
  return `<section class="${className}" style="${style}">${children}</section>`;
}
export function generateStaticSite(document: EditorDocument) {
  const root = document.nodes[document.rootNodeId];
  const body = root ? renderNode(root.id, document.nodes) : "";
  const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>WebEazy Site</title>\n<link rel="stylesheet" href="style.css" />\n</head>\n<body>\n${body}\n<script src="script.js"></script>\n</body>\n</html>`;
  return {
    "index.html": html,
    "style.css": "/* WebEazy generated styles */\nbody{margin:0;min-height:100vh;}\n",
    "script.js": "// WebEazy generated JavaScript\n",
    "project.webeazy": serializeDocument(document),
  };
}
export async function exportProjectToFolder(document: EditorDocument, projectName: string) {
  if (!("showDirectoryPicker" in window))
    throw new Error(
      "This browser does not support direct folder saving. Use a Chromium-based browser or export the project JSON instead.",
    );
  const picker = (
    window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
  ).showDirectoryPicker;
  const parent = await picker();
  const folder = await parent.getDirectoryHandle(projectName.trim() || "WebEazy Project", {
    create: true,
  });
  const files = generateStaticSite(document);
  for (const [name, contents] of Object.entries(files)) {
    const handle = await folder.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
  }
  return folder.name;
}
declare global {
  interface FileSystemFileHandle {
    createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  }
  interface FileSystemDirectoryHandle {
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  }
}
