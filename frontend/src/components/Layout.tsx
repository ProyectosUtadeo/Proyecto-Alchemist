// src/components/Layout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();
  const link = (to: string, label: string) => (
    <Link
      to={to}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        textDecoration: "none",
        background: pathname === to ? "#222" : "#eee",
        color: pathname === to ? "#fff" : "#333",
        fontWeight: 600,
      }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ padding: 16, borderBottom: "1px solid #ddd", display: "flex", gap: 12 }}>
        {link("/", "Dashboard")}
        {link("/alchemists", "Alchemists")}
        {link("/materials", "Materials")}
        {link("/missions", "Missions")}
        {link("/transmutations", "Transmutations")}
        {link("/audits", "Audits")}
      </header>
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
}
