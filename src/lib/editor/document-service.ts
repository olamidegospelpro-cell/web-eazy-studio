import { z } from "zod";
import { DOCUMENT_SCHEMA_VERSION, type EditorDocument } from "./document-types";

const nodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  props: z.record(z.unknown()),
  styles: z.record(z.unknown()),
  responsive: z.record(z.unknown()).optional(),
  locked: z.boolean().optional(),
  hidden: z.unknown().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const documentSchema = z.object({
  schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
  pageId: z.string(),
  nodes: z.record(nodeSchema),
  rootNodeId: z.string(),
  selectedNodeIds: z.array(z.string()),
  updatedAt: z.string(),
});

export function serializeDocument(document: EditorDocument): string {
  return JSON.stringify(document, null, 2);
}

export function parseDocument(input: string): EditorDocument {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new Error("WebEazy could not read this document because its JSON is invalid.");
  }

  const result = documentSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid WebEazy document: ${result.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return result.data as EditorDocument;
}

export interface DocumentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDocument(document: EditorDocument): DocumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const root = document.nodes[document.rootNodeId];

  if (!root) errors.push(`Root node "${document.rootNodeId}" does not exist.`);
  if (root && root.parentId !== null) errors.push("The root node must not have a parent.");

  for (const [id, node] of Object.entries(document.nodes)) {
    if (node.id !== id) errors.push(`Node map key "${id}" does not match node.id.`);
    for (const childId of node.childIds) {
      const child = document.nodes[childId];
      if (!child) errors.push(`Node "${id}" references missing child "${childId}".`);
      else if (child.parentId !== id) {
        errors.push(`Child "${childId}" does not point back to parent "${id}".`);
      }
    }
  }

  const reachable = new Set<string>();
  const visit = (id: string) => {
    if (reachable.has(id)) {
      errors.push(`A node cycle was detected at "${id}".`);
      return;
    }
    reachable.add(id);
    for (const childId of document.nodes[id]?.childIds ?? []) visit(childId);
  };
  if (root) visit(root.id);

  for (const id of Object.keys(document.nodes)) {
    if (!reachable.has(id)) warnings.push(`Node "${id}" is not reachable from the root.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
