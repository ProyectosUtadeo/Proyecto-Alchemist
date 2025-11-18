// src/pages/MissionsPage.tsx
import { useEffect, useState } from "react";
import type { Alchemist, Mission } from "../services/api";
import {
  createMission,
  deleteMission,
  getAlchemists,
  getMissions,
  updateMission,
} from "../services/api";
import FormRow from "../components/FormRow";

export default function MissionsPage() {
  const [list, setList] = useState<Mission[]>([]);
  const [alchs, setAlchs] = useState<Alchemist[]>([]);
  const [form, setForm] = useState<Omit<Mission, "id" | "created_at" | "status">>({
    title: "",
    description: "",
    assigned_to: null,
  });
  const [editing, setEditing] = useState<Mission | null>(null);

  const load = async () => {
    const [m, a] = await Promise.all([getMissions(), getAlchemists()]);
    setList(m);
    setAlchs(a);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (editing?.id) {
      await updateMission(editing.id, form);
      setEditing(null);
    } else {
      await createMission(form);
    }
    setForm({ title: "", description: "", assigned_to: null });
    await load();
  };

  const onEdit = (m: Mission) => {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description,
      assigned_to: m.assigned_to,
    });
  };

  const onDelete = async (id: number) => {
    await deleteMission(id);
    await load();
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Missions</h1>
          <p className="page-subtitle">
            Coordina objetivos y asigna alquimistas con claridad.
          </p>
        </div>
      </header>

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">
            {editing ? "Editar misión" : "Planear nueva misión"}
          </h2>
          <p className="card-subtitle">
            Define el objetivo, describe el reto y asigna a tu equipo ideal.
          </p>
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <FormRow label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </FormRow>

          <FormRow label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </FormRow>

          <FormRow label="Assigned To">
            <select
              value={form.assigned_to ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  assigned_to: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">(sin asignar)</option>
              {alchs
                .filter((a) => typeof a.id === "number")
                .map((a, i) => (
                  <option key={`alch-${a.id ?? "noid"}-${i}`} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </FormRow>

          <div className="form-actions">
            <button type="submit">{editing ? "Actualizar" : "Crear"}</button>
            {editing && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({ title: "", description: "", assigned_to: null });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Misiones activas</h2>
          <p className="card-subtitle">Seguimiento del progreso en tiempo real.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Title</th>
              <th align="left">Assigned</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((m) => (
                <tr key={`mis-${m.id}`}>
                  <td>{m.id}</td>
                  <td>{m.title}</td>
                  <td>
                    {m.assigned_to
                      ? alchs.find((a) => a.id === m.assigned_to)?.name ?? `#${m.assigned_to}`
                      : "—"}
                  </td>
                  <td>
                    <span className="badge">{m.status}</span>
                  </td>
                  <td>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary btn--sm"
                        onClick={() => onEdit(m)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn--sm"
                        onClick={() => onDelete(m.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr key="empty">
                <td colSpan={5} align="center">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
