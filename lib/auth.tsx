"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, getToken, setToken, clearToken, type AuthUser } from "./api";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  canMutate: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  canMutate: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // /login is where we bounce to; /public is login-free (community view) —
    // neither may redirect to /login, with or without a token. Standalone routes
    // also skip the me() bootstrap entirely: /public must never spend the stored
    // analyst JWT (a transient 401 there would silently clear the session).
    const standalone = pathname === "/" || pathname === "/login" || pathname === "/public";
    if (!getToken() || standalone) {
      // Initial auth bootstrap: synchronously settling loading on mount is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      if (!getToken() && !standalone) router.replace("/login");
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
    router.replace("/overview");
  };
  const logout = () => {
    clearToken();
    setUser(null);
    router.replace("/login");
  };

  const canMutate = !!user && user.role !== "external_viewer";

  return <Ctx.Provider value={{ user, loading, canMutate, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export const ROLE_LABELS: Record<string, string> = {
  field_validator: "Field validator",
  co_analyst: "Country Office analyst",
  regional_analyst: "Regional Bureau analyst",
  crisis_admin: "Crisis Bureau admin",
  external_viewer: "External viewer",
};
