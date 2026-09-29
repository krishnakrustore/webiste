import { api } from "./client";
import type { Order, OrderStatus } from "../types/product";

export const AdminOrdersApi = {
  list: () => api.get<Order[]>("/orders", true),
  updateStatus: (id: string, status: OrderStatus) => api.patch<Order>(`/orders/${id}/status`, { status }, true),
  createShipment: (orderId: string) => api.post<{ order_id: number }>(`/shipping/orders/${orderId}/create-shipment`, undefined, true),
};

export type AiShot = "Catalogue" | "Blouse" | "Pallu";

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
  altBlouse: string;
  altPallu: string;
}

export const AiApi = {
  status: () => api.get<AiStatus>("/ai/status", true),
  describe: (photos: string[], notes: string) => api.post<AiListing>("/ai/describe", { photos, notes }, true),
  image: (photos: string[], kind: AiShot, notes: string) =>
    api.post<{ kind: AiShot; src: string }>("/ai/image", { photos, kind, notes }, true),
};
