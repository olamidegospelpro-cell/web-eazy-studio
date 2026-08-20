import { createStarterDocument, createNodeId } from "@/lib/editor";
import type { EditorDocument, EditorPage, PageId } from "@/lib/editor";

export class PageService {
  private pages = new Map<PageId, EditorPage>();
  private documents = new Map<PageId, EditorDocument>();

  list(): EditorPage[] {
    return [...this.pages.values()].sort((a, b) => Number(Boolean(b.isHome)) - Number(Boolean(a.isHome)) || a.name.localeCompare(b.name));
  }

  get(id: PageId): EditorPage | undefined { return this.pages.get(id); }
  getDocument(id: PageId): EditorDocument | undefined { return this.documents.get(id); }

  create(name = "New Page", slug = "new-page"): EditorPage {
    const pageId = createNodeId("page");
    const document = createStarterDocument(pageId);
    const now = new Date().toISOString();
    const page: EditorPage = {
      id: pageId, name, slug, title: name, description: "",
      rootNodeId: document.rootNodeId,
      nodeIds: Object.keys(document.nodes),
      isHome: this.pages.size === 0,
      createdAt: now, updatedAt: now,
    };
    this.pages.set(page.id, page);
    this.documents.set(page.id, document);
    return page;
  }

  duplicate(id: PageId, name?: string): EditorPage {
    const source = this.pages.get(id);
    const sourceDocument = this.documents.get(id);
    if (!source || !sourceDocument) throw new Error(`Page "${id}" does not exist.`);
    const page = this.create(name ?? `${source.name} Copy`, `${source.slug}-copy`);
    const cloned = structuredClone(sourceDocument);
    cloned.pageId = page.id;
    this.documents.set(page.id, cloned);
    const result = { ...page, nodeIds: Object.keys(cloned.nodes), rootNodeId: cloned.rootNodeId };
    this.pages.set(page.id, result);
    return result;
  }

  update(id: PageId, patch: Partial<Pick<EditorPage, "name" | "slug" | "title" | "description">>): void {
    const page = this.pages.get(id);
    if (!page) throw new Error(`Page "${id}" does not exist.`);
    this.pages.set(id, { ...page, ...patch, updatedAt: new Date().toISOString() });
  }

  replaceDocument(id: PageId, document: EditorDocument): void {
    const page = this.pages.get(id);
    if (!page) throw new Error(`Page "${id}" does not exist.`);
    this.documents.set(id, document);
    this.pages.set(id, { ...page, rootNodeId: document.rootNodeId, nodeIds: Object.keys(document.nodes), updatedAt: new Date().toISOString() });
  }

  delete(id: PageId): void {
    const page = this.pages.get(id);
    if (!page) return;
    this.pages.delete(id);
    this.documents.delete(id);
    if (page.isHome) {
      const next = this.pages.values().next().value as EditorPage | undefined;
      if (next) this.pages.set(next.id, { ...next, isHome: true });
    }
  }
}

export const pageService = new PageService();
