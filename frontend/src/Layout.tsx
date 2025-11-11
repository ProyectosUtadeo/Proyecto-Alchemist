// src/Layout.tsx
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: 200,
          background: "#222",
          color: "#fff",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link to="/" style={{ color: "#fff" }}>Dashboard</Link>
          <Link to="/alchemists" style={{ color: "#fff" }}>Alchemists</Link>
          <Link to="/materials" style={{ color: "#fff" }}>Materials</Link>
          <Link to="/missions" style={{ color: "#fff" }}>Missions</Link>
          <Link to="/transmutations" style={{ color: "#fff" }}>Transmutations</Link>

          {/* 🔒 Solo visible para SUPERVISOR */}
          {user?.role === "SUPERVISOR" && (
            <Link to="/audits" style={{ color: "#fff" }}>Audits</Link>
          )}
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 20,
            background: "crimson",
            border: "none",
            padding: "8px 12px",
            borderRadius: 6,
            color: "white",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
