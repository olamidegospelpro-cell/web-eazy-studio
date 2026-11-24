import { z } from "zod";
import { PROJECT_SCHEMA_VERSION, type PageDocument, type WebsiteNode } from "./types.ts";

const layoutSchema = z.object({
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  width: z.number().finite().positive().optional(),
  height: z.number().finite().positive().optional(),
});

export const websiteNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["heading", "text", "button", "card", "shape", "image", "section", "container"]),
    name: z.string(),
    text: z.string(),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
    background: z.string(),
    color: z.string(),
    radius: z.number().finite().nonnegative(),
    locked: z.boolean(),
    src: z.string().optional(),
    assetId: z.string().optional(),
    alt: z.string().optional(),
    imageFit: z.enum(["cover", "contain"]).optional(),
    shapeKind: z.enum(["rectangle", "ellipse", "line"]).optional(),
    href: z.string().optional(),
    fontSize: z.number().finite().positive().optional(),
    fontWeight: z.number().finite().positive().optional(),
    fontFamily: z.string().optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    padding: z.number().finite().nonnegative().optional(),
    shadow: z.boolean().optional(),
    border: z.string().optional(),
    borderWidth: z.number().finite().nonnegative().optional(),
    borderColor: z.string().optional(),
    opacity: z.number().finite().min(0).max(1).optional(),
    lineHeight: z.number().finite().positive().optional(),
    layoutMode: z.enum(["absolute", "flow"]).optional(),
    flowDirection: z.enum(["row", "column"]).optional(),
    gap: z.number().finite().nonnegative().optional(),
    parentId: z.string().nullable(),
    childIds: z.array(z.string()),
    visible: z.boolean(),
    responsive: z
      .object({
        tablet: layoutSchema.optional(),
        mobile: layoutSchema.optional(),
      })
      .optional(),
  })
  .passthrough();

const pageFields = {
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
  createdAt: z.string(),
  lastModified: z.string(),
};

export const websitePageSchema = z
  .object({
    ...pageFields,
    schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
    documentType: z.literal("website"),
    breakpoints: z.object({
      desktop: z.number().finite().positive(),
      tablet: z.number().finite().positive(),
      mobile: z.number().finite().positive(),
    }),
    nodes: z.array(websiteNodeSchema),
  })
  .superRefine((page, context) => {
    const nodesById = new Map<string, WebsiteNode>();
    for (const [index, node] of page.nodes.entries()) {
      if (nodesById.has(node.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "id"],
          message: `Duplicate node id "${node.id}"`,
        });
      } else {
        nodesById.set(node.id, node as WebsiteNode);
      }
    }

    for (const [index, node] of page.nodes.entries()) {
      if (node.parentId) {
        const parent = nodesById.get(node.parentId);
        if (!parent || !["section", "container"].includes(parent.type)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "parentId"],
            message: "Parent must reference an existing section or container",
          });
        } else if (!parent.childIds.includes(node.id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "parentId"],
            message: "Parent childIds must include this node",
          });
        }
      }

      for (const childId of node.childIds) {
        const child = nodesById.get(childId);
        if (!child || child.parentId !== node.id) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "childIds"],
            message: `Child "${childId}" must reference this node as its parent`,
          });
        }
      }

      const ancestors = new Set<string>([node.id]);
      let parentId = node.parentId;
      while (parentId) {
        if (ancestors.has(parentId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "parentId"],
            message: "Parent-child relationships cannot contain cycles",
          });
          break;
        }
        ancestors.add(parentId);
        parentId = nodesById.get(parentId)?.parentId ?? null;
      }
    }
  });

export const legacyPageSchema = z.object({
  ...pageFields,
  schemaVersion: z
    .number()
    .int()
    .positive()
    .max(PROJECT_SCHEMA_VERSION - 1),
  nodes: z.array(z.unknown()).default([]),
});

export const pageSchema = z.union([websitePageSchema, legacyPageSchema]);

export const legacyWebsiteNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["heading", "text", "button", "card", "shape", "image"]),
    name: z.string().default("Untitled element"),
    text: z.string().default(""),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
    background: z.string().default("transparent"),
    color: z.string().default("#ffffff"),
    radius: z.number().finite().nonnegative().default(0),
    locked: z.boolean().default(false),
    src: z.string().optional(),
    assetId: z.string().optional(),
    alt: z.string().optional(),
    imageFit: z.enum(["cover", "contain"]).optional(),
    shapeKind: z.enum(["rectangle", "ellipse", "line"]).optional(),
    href: z.string().optional(),
    fontSize: z.number().finite().positive().optional(),
    fontWeight: z.number().finite().positive().optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    padding: z.number().finite().nonnegative().optional(),
    shadow: z.boolean().optional(),
    border: z.string().optional(),
    borderWidth: z.number().finite().nonnegative().optional(),
    borderColor: z.string().optional(),
    opacity: z.number().finite().min(0).max(1).optional(),
    lineHeight: z.number().finite().positive().optional(),
  })
  .passthrough();

export function createWebsiteNode(
  node: Omit<WebsiteNode, "parentId" | "childIds" | "visible"> &
    Partial<Pick<WebsiteNode, "parentId" | "childIds" | "visible">>,
): WebsiteNode {
  return {
    ...node,
    parentId: node.parentId ?? null,
    childIds: node.childIds ?? [],
    visible: node.visible ?? true,
  };
}

export function migrateLegacyWebsiteNodes(input: unknown): WebsiteNode[] {
  return z
    .array(z.unknown())
    .parse(input)
    .map((rawNode) => {
      const node = legacyWebsiteNodeSchema.parse(rawNode);
      return createWebsiteNode(node);
    });
}

export function migratePageDocument(input: unknown): PageDocument {
  const currentPage = websitePageSchema.safeParse(input);
  if (currentPage.success) return currentPage.data as PageDocument;
  const parsedPage = legacyPageSchema.parse(input);
  const nodes = migrateLegacyWebsiteNodes(parsedPage.nodes);

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: parsedPage.id,
    name: parsedPage.name,
    slug: parsedPage.slug,
    title: parsedPage.title ?? "",
    description: parsedPage.description ?? "",
    documentType: "website",
    breakpoints: { desktop: 1120, tablet: 760, mobile: 390 },
    nodes,
    createdAt: parsedPage.createdAt,
    lastModified: parsedPage.lastModified,
  };
}
