import { api } from "./client";

export type AiShot = "Catalogue" | "Detail" | "Pallu";

export interface AiStatus {
  enabled: boolean;
  textModel: string;
  imageModel: string;
  prompts: Record<AiShot, string>;
}

export interface AiListing {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory: string;
  occasion: string;
  material: string;
  color: string;
  pattern: string;
  seoTitle: string;
  seoDescription: string;
  altCatalogue: string;
  altDetail: string;
  altPallu: string;
}

export const AiApi = {
  status: () => api.get<AiStatus>("/ai/status", true),
  describe: (photos: string[], notes: string) => api.post<AiListing>("/ai/describe", { photos, notes }, true),
  image: (photos: string[], kind: AiShot, notes: string) =>
    api.post<{ kind: AiShot; src: string }>("/ai/image", { photos, kind, notes }, true),
};
