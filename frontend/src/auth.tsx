import React, { createContext, useContext, useEffect, useState } from "react";
import { clearToken, decodeRole, getToken } from "./services/session";

// 🔧 Tipo extendido de usuario
export type User = {
  role: "ALCHEMIST" | "SUPERVISOR";
  email?: string;   // 👈 ahora puedes acceder a user.email sin error
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
    const token = getToken();
    if (token) {
      const role = decodeRole();
      // Si luego incluyes email o id en el JWT, los puedes decodificar aquí también
      if (role) {
        setUser({ role, token });
      }
    }
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
