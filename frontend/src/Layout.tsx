import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth";
import "./Layout.css";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/alchemists", label: "Alchemists" },
  { to: "/materials", label: "Materials" },
  { to: "/missions", label: "Missions" },
  { to: "/transmutations", label: "Transmutations" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  const roleLinks = user?.role === "SUPERVISOR"
    ? [...links, { to: "/audits", label: "Audits" }]
    : links;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__mark">🜂</span>
          <span>Proyecto Alchemist</span>
        </div>

        <nav className="sidebar__nav">
          {roleLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "sidebar__link is-active" : "sidebar__link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          {user && (
            <div className="sidebar__user">
              <span>{user.email}</span>
              <span className="sidebar__role">{user.role.toLowerCase()}</span>
            </div>
          )}
          <button className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-main__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
