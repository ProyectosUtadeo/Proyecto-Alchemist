// src/pages/LoginPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { setToken } from "../services/session";

const BASE = "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setToken(data.token);
      window.location.href = "/";
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="stack">
          <div className="auth-logo">🜁</div>
          <div>
            <h1 className="auth-title">Bienvenido de nuevo</h1>
            <p className="auth-subtitle">
              Ingresa para continuar con tus experimentos alquímicos.
            </p>
          </div>
        </div>

        {err && <div className="alert alert--danger">{err}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              placeholder="tú@alquimia.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              placeholder="••••••••"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes cuenta? {" "}
          <Link className="link" to="/register">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}