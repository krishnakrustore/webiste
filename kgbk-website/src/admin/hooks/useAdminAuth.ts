import { useCallback, useState } from "react";
import { api, ApiError, getAdminToken, setAdminToken } from "../../api/client";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAdminToken()));

  const login = useCallback(async (username: string, password: string) => {
    try {
      const { token } = await api.post<{ token: string }>("/auth/login", { username, password });
      setAdminToken(token);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setAdminToken(null);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
