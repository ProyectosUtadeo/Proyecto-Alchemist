// src/pages/LoginPage.tsx
import { useState } from "react";
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
      setToken(data.token); // ✅ guarda el JWT
      window.location.href = "/"; // redirige al dashboard
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "64px auto" }}>
      <h2>Iniciar sesión</h2>

      {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

      <div style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>

      {/* 👇 Enlace agregado para ir a la página de registro */}
      <div style={{ marginTop: 12 }}>
        ¿No tienes cuenta? <a href="/register">Crear cuenta</a>
      </div>
    </form>
  );
}
