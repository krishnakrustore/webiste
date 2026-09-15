import type { CategoryDef, FabricTypeDef } from "../types/product";
import { api } from "../api/client";

const CHANNEL_NAME = "kgbk-taxonomy-sync";
let channel: BroadcastChannel | null = null;
function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function broadcast() {
  getChannel()?.postMessage({ type: "taxonomy:changed" });
}

export function subscribeToTaxonomyChanges(handler: () => void) {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = () => handler();
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

/** One API-backed CRUD client reused for categories, occasions and fabric types. */
function makeListRepository<T extends { name: string; slug: string }>(basePath: string) {
  return {
    async getAll(): Promise<T[]> {
      return api.get<T[]>(basePath);
    },
    async create(item: Omit<T, "slug">): Promise<T> {
      const record = await api.post<T>(basePath, item, true);
      broadcast();
      return record;
    },
    async update(currentSlug: string, item: Omit<T, "slug">): Promise<T> {
      const record = await api.put<T>(`${basePath}/${currentSlug}`, item, true);
      broadcast();
      return record;
    },
    async remove(slug: string): Promise<void> {
      await api.delete(`${basePath}/${slug}`, true);
      broadcast();
    },
  };
}

export const CategoryRepository = makeListRepository<CategoryDef>("/categories");
export const OccasionRepository = makeListRepository<CategoryDef>("/occasions");
export const FabricTypeRepository = makeListRepository<FabricTypeDef>("/fabric-types");
