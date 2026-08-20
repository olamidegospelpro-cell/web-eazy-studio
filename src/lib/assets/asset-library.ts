import type { AssetFilter, AssetRecord } from "./asset-types";
import { matchesAssetFilter } from "./asset-types";

export class AssetLibrary {
  private assets = new Map<string, AssetRecord>();

  list(filter: AssetFilter = {}): AssetRecord[] {
    return [...this.assets.values()]
      .filter((asset) => matchesAssetFilter(asset, filter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): AssetRecord | undefined {
    return this.assets.get(id);
  }

  upsert(asset: AssetRecord): void {
    this.assets.set(asset.id, asset);
  }

  remove(id: string): boolean {
    return this.assets.delete(id);
  }

  setFavorite(id: string, favorite: boolean): void {
    const asset = this.assets.get(id);
    if (!asset) return;
    this.assets.set(id, { ...asset, favorite, updatedAt: new Date().toISOString() });
  }

  clear(): void {
    this.assets.clear();
  }
}

export const assetLibrary = new AssetLibrary();
