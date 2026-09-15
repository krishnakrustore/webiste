import { api } from "./client";
import type { Product } from "../types/product";

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  customer: CustomerProfile;
}

export const CustomersApi = {
  register: (input: { name: string; email: string; phone: string; password: string }) =>
    api.post<AuthResponse>("/customers/register", input),
  login: (input: { email: string; password: string }) => api.post<AuthResponse>("/customers/login", input),
  me: () => api.get<CustomerProfile>("/customers/me", "customer"),
  myOrders: () => api.get("/customers/me/orders", "customer"),
};

export const WishlistApi = {
  list: () => api.get<Product[]>("/wishlist", "customer"),
  add: (productId: string) => api.post("/wishlist", { productId }, "customer"),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`, "customer"),
};
