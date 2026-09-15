const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const ADMIN_TOKEN_KEY = "kgbk-admin-token";
const CUSTOMER_TOKEN_KEY = "kgbk-customer-token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string | null) {
  if (token) localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  else localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** `true`/`false` = admin auth (existing behavior); `"customer"` = customer auth. */
type Auth = boolean | "customer";

async function request<T>(path: string, options: RequestInit = {}, auth: Auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string>) };
  if (auth === "customer") {
    const token = getCustomerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string })?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, auth: Auth = false) => request<T>(path, { method: "GET" }, auth),
  post: <T>(path: string, data?: unknown, auth: Auth = false) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }, auth),
  put: <T>(path: string, data?: unknown, auth: Auth = false) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }, auth),
  patch: <T>(path: string, data?: unknown, auth: Auth = false) =>
    request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined }, auth),
  delete: <T>(path: string, auth: Auth = false) => request<T>(path, { method: "DELETE" }, auth),
};
