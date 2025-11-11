// src/pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
// Si tienes helpers de sesión, descomenta esto y usa setToken abajo
// import { setToken } from "../services/session";

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
        payload.alchemist_id
      );

      // Guarda el token y navega
      // Preferido si tienes helpers de sesión:
      // setToken(res.token);
      localStorage.setItem("jwt", res.token);

      nav("/");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Crear cuenta</h2>

      {error && (
        <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>
      )}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Email</label>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="ALCHEMIST">ALCHEMIST</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
          </select>
        </div>

        {role === "ALCHEMIST" && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Alchemist ID (opcional)
            </label>
            <input
              type="number"
              value={alchemistId}
              onChange={(e) =>
                setAlchemistId(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Si ya existe un alquimista, relaciónalo aquí"
              min={1}
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Registrarme"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </div>
    </div>
  );
}
