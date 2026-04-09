import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getAuthToken, setAuthToken } from "./apiClient";
import type { User, UserRole } from "./types";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext provider");
  return ctx;
}

function mapUser(u: any): User {
  return {
    id: Number(u.id),
    name: String(u.name),
    email: String(u.email),
    role: u.role as UserRole,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api.get("/users/me");
      setUser(mapUser(r.data.user));
    } catch {
      logout();
    } finally {
      setAuthReady(true);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      refreshMe();
    } else {
      setAuthReady(true);
    }
  }, [token, refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post("/auth/login", { email, password });
    setAuthToken(r.data.token);
    setToken(r.data.token);
    setUser(mapUser(r.data.user));
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const r = await api.post("/auth/signup", { name, email, password });
    setAuthToken(r.data.token);
    setToken(r.data.token);
    setUser(mapUser(r.data.user));
  }, []);

  const role = user?.role ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      role,
      authReady,
      login,
      signup,
      logout,
    }),
    [token, user, role, authReady, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

