// app/auth-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

type User = any;

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync("user");
        const storedToken = await SecureStore.getItemAsync("token");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: any) => {
    const t =
      payload?.token ||
      payload?.access ||
      payload?.key ||
      payload?.auth_token ||
      payload?.data?.token ||
      payload?.data?.access ||
      null;

    const u = payload?.user || payload;

    setUser(u);
    setToken(t);

    await SecureStore.setItemAsync("user", JSON.stringify(u));
    if (t) await SecureStore.setItemAsync("token", t);
    else await SecureStore.deleteItemAsync("token");
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("token");
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
