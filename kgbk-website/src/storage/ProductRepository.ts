import type { Product, ProductInput } from "../types/product";
import { api } from "../api/client";

const CHANNEL_NAME = "kgbk-catalogue-sync";
let channel: BroadcastChannel | null = null;
function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export type CatalogueChangeEvent =
  | { type: "product:created" | "product:updated" | "product:deleted"; productId: string };

function broadcast(event: CatalogueChangeEvent) {
  getChannel()?.postMessage(event);
}

export function subscribeToCatalogueChanges(handler: (event: CatalogueChangeEvent) => void) {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = (e: MessageEvent<CatalogueChangeEvent>) => handler(e.data);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

export const ProductRepository = {
  async getProducts(params?: { category?: string; featured?: boolean; q?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.featured) query.set("featured", "true");
    if (params?.q) query.set("q", params.q);
    const qs = query.toString();
    return api.get<Product[]>(`/products${qs ? `?${qs}` : ""}`);
  },

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      return await api.get<Product>(`/products/${id}`);
    } catch {
      return undefined;
    }
  },

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    try {
      return await api.get<Product>(`/products/slug/${slug}`);
    } catch {
      return undefined;
    }
  },

  async createProduct(input: ProductInput): Promise<Product> {
    const product = await api.post<Product>("/products", input, true);
    broadcast({ type: "product:created", productId: product.id });
    return product;
  },

  async updateProduct(product: Product): Promise<Product> {
    const updated = await api.put<Product>(`/products/${product.id}`, product, true);
    broadcast({ type: "product:updated", productId: product.id });
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`, true);
    broadcast({ type: "product:deleted", productId: id });
  },
};
