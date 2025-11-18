import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AUTH_CHANGED_EVENT,
  clearToken,
  decodeRole,
  getToken,
} from "./services/session";

//  Tipo extendido de usuario
export type User = {
  role: "ALCHEMIST" | "SUPERVISOR";
  email?: string;   
  id?: number;
  token?: string;
} | null;

// Contexto global
const Ctx = createContext<{ user: User; logout: () => void }>({
  user: null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const syncUser = () => {
      const token = getToken();
      if (token) {
        const role = decodeRole();
        if (role) {
          setUser({ role, token });
          return;
        }
      }
      setUser(null);
    };

    syncUser();

    const handler = () => syncUser();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <Ctx.Provider value={{ user, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);