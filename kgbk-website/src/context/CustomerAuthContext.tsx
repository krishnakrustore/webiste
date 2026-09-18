import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CustomersApi, WishlistApi, type CustomerProfile } from "../api/customers";
import { getCustomerToken, setCustomerToken, ApiError } from "../api/client";
import type { Product } from "../types/product";

interface CustomerAuthValue {
  customer: CustomerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  wishlist: Product[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!getCustomerToken()) {
      setLoading(false);
      return;
    }
    CustomersApi.me()
      .then((profile) => {
        setCustomer(profile);
        return WishlistApi.list();
      })
      .then(setWishlist)
      .catch(() => setCustomerToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, customer } = await CustomersApi.login({ email, password });
    setCustomerToken(token);
    setCustomer(customer);
    setWishlist(await WishlistApi.list());
  }

  async function register(name: string, email: string, phone: string, password: string) {
    const { token, customer } = await CustomersApi.register({ name, email, phone, password });
    setCustomerToken(token);
    setCustomer(customer);
  }

  async function loginWithGoogle(idToken: string) {
    const { token, customer } = await CustomersApi.google(idToken);
    setCustomerToken(token);
    setCustomer(customer);
    setWishlist(await WishlistApi.list());
  }

  function logout() {
    setCustomerToken(null);
    setCustomer(null);
    setWishlist([]);
  }

  function isWishlisted(productId: string) {
    return wishlist.some((p) => p.id === productId);
  }

  async function toggleWishlist(product: Product) {
    if (!customer) {
      setAuthOpen(true);
      return;
    }
    if (isWishlisted(product.id)) {
      setWishlist((w) => w.filter((p) => p.id !== product.id));
      try {
        await WishlistApi.remove(product.id);
      } catch {
        setWishlist((w) => [...w, product]);
      }
    } else {
      setWishlist((w) => [product, ...w]);
      try {
        await WishlistApi.add(product.id);
      } catch (err) {
        setWishlist((w) => w.filter((p) => p.id !== product.id));
        if (!(err instanceof ApiError)) throw err;
      }
    }
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        customer, loading, login, register, loginWithGoogle, logout,
        wishlist, isWishlisted, toggleWishlist,
        authOpen, openAuth: () => setAuthOpen(true), closeAuth: () => setAuthOpen(false),
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  return ctx;
}
