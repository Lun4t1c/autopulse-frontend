"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMe, removeToken, getToken } from "./api";

type User = { email: string; name: string; _id: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const me = await getMe();
    setUser(me);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}