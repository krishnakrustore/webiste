import { api } from "./client";
import type { Order, OrderStatus } from "../types/product";

export const AdminOrdersApi = {
  list: () => api.get<Order[]>("/orders", true),
  updateStatus: (id: string, status: OrderStatus) => api.patch<Order>(`/orders/${id}/status`, { status }, true),
  createShipment: (orderId: string) => api.post<{ order_id: number }>(`/shipping/orders/${orderId}/create-shipment`, undefined, true),
};
