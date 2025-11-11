import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";   // 👈 importa el tipo como 'type'
import { getToken } from "./services/session";
import { useAuth } from "./auth";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

export function RoleRoute({
  role,
  children,
}: {
  role: "ALCHEMIST" | "SUPERVISOR";
  children: ReactNode;
}) {
  const token = getToken();
  const { user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== role) return <Navigate to="/" replace />;
  return children;
}
