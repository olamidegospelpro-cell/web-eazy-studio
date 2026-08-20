export type AssetKind = "image" | "video" | "audio" | "font" | "icon" | "document" | "other";

export interface AssetMetadata {
  width?: number;
  height?: number;
  durationMs?: number;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  kind: AssetKind;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  metadata: AssetMetadata;
  tags: string[];
  folder: string;
  favorite: boolean;
}

export interface AssetFilter {
  query?: string;
  kind?: AssetKind | "all";
  folder?: string;
  favorite?: boolean;
}

export function matchesAssetFilter(asset: AssetRecord, filter: AssetFilter): boolean {
  if (filter.kind && filter.kind !== "all" && asset.kind !== filter.kind) return false;
  if (filter.folder && asset.folder !== filter.folder) return false;
  if (filter.favorite !== undefined && asset.favorite !== filter.favorite) return false;
  if (!filter.query) return true;
  const query = filter.query.trim().toLowerCase();
  return [asset.name, asset.relativePath, asset.mimeType, ...asset.tags].some((value) =>
    value.toLowerCase().includes(query),
  );
}
