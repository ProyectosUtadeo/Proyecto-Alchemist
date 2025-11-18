// src/pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
import { setToken } from "../services/session";

type Role = "ALCHEMIST" | "SUPERVISOR";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ALCHEMIST");
  const [alchemistId, setAlchemistId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email y password son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const payload: {
        email: string;
        password: string;
        role: Role;
        alchemist_id?: number;
      } = { email: email.trim(), password, role };

      if (role === "ALCHEMIST" && alchemistId !== "") {
        payload.alchemist_id = Number(alchemistId);
      }

      const res = await register(
        payload.email,
        payload.password,
        payload.role,
        payload.alchemist_id,
      );

      setToken(res.token);
      localStorage.setItem("jwt", res.token);

      nav("/");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="stack">
          <div className="auth-logo">🜃</div>
          <div>
            <h1 className="auth-title">Crear cuenta</h1>
            <p className="auth-subtitle">
              Diseña un perfil para un nuevo alquimista o supervisor.
            </p>
          </div>
        </div>

        {error && <div className="alert alert--danger">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <label className="field">
            <span>Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="ALCHEMIST">Alchemist</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </label>

          {role === "ALCHEMIST" && (
            <label className="field">
              <span>Alchemist ID (opcional)</span>
              <input
                type="number"
                value={alchemistId}
                onChange={(e) =>
                  setAlchemistId(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Si ya existe un alquimista, relaciónalo aquí"
                min={1}
              />
            </label>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creando…" : "Registrarme"}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? {" "}
          <Link className="link" to="/login">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
