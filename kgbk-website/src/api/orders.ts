import { api } from "./client";
import type { CheckoutAddress, Order } from "../types/product";

export interface CreateOrderPayload extends CheckoutAddress {
  items: { productId: string; quantity: number }[];
}

export const OrdersApi = {
  create: (payload: CreateOrderPayload) => api.post<Order>("/orders", payload),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  lookup: (orderNumber: string, email: string) =>
    api.get<Order>(`/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`),
};

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const PaymentsApi = {
  createRazorpayOrder: (orderId: string) => api.post<RazorpayOrderResponse>("/payments/create-razorpay-order", { orderId }),
  verify: (payload: VerifyPaymentPayload) => api.post<Order>("/payments/verify", payload),
};
