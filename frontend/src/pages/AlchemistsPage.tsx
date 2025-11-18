// src/pages/AlchemistsPage.tsx
import { useEffect, useState } from "react";
import type { Alchemist } from "../services/api";
import {
  getAlchemists,
  createAlchemist,
  updateAlchemist,
  deleteAlchemist,
} from "../services/api";
import FormRow from "../components/FormRow";

export default function AlchemistsPage() {
  const [list, setList] = useState<Alchemist[]>([]);
  const [form, setForm] = useState<Omit<Alchemist, "id" | "created_at">>({
    name: "",
    specialty: "",
    rank: "",
  });
  const [editing, setEditing] = useState<Alchemist | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const load = async () => {
    setErrMsg("");
    try {
      setList(await getAlchemists());
    } catch (e: any) {
      setErrMsg(e?.message ?? "Failed to fetch alchemists");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg("");
    try {
      if (editing?.id) {
        await updateAlchemist(editing.id, form);
        setEditing(null);
      } else {
       await createAlchemist(form);
      }
      setForm({ name: "", specialty: "", rank: "" });
      load();
    } catch (e: any) {
      setErrMsg(e?.message ?? "Failed to save alchemist");
    }
  };

  const onEdit = (a: Alchemist) => {
    setEditing(a);
    setForm({ name: a.name, specialty: a.specialty, rank: a.rank });
  };

  const onDelete = async (id: number) => {
    setErrMsg("");
    try {
      await deleteAlchemist(id);
      load();
    } catch (e: any) {
      setErrMsg(e?.message ?? "Failed to delete alchemist");
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Alchemists</h1>
          <p className="page-subtitle">
            Gestiona la orden y mantén actualizada su especialidad y rango.
          </p>
        </div>
      </header>

      {errMsg && <div className="alert alert--danger">{errMsg}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">
            {editing ? "Editar alquimista" : "Nuevo alquimista"}
          </h2>
          <p className="card-subtitle">
            Completa la información esencial para tu alquimista de laboratorio.
          </p>
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <FormRow label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormRow>
          <FormRow label="Specialty">
            <input
              value={form.specialty}
              onChange={(e) =>
                setForm((f) => ({ ...f, specialty: e.target.value }))
              }
            />
          </FormRow>
          <FormRow label="Rank">
            <input
              value={form.rank}
              onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
            />
          </FormRow>

          <div className="form-actions">
            <button type="submit">
              {editing ? "Actualizar" : "Crear"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", specialty: "", rank: "" });
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
          <h2 className="section-title">Listado de alquimistas</h2>
          <p className="card-subtitle">
            Visualiza y edita cada perfil con acciones rápidas.
          </p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Name</th>
              <th align="left">Specialty</th>
              <th align="left">Rank</th>
              <th align="left">Created</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((a, idx) => (
                <tr key={a.id ?? `alch-${idx}`}>
                  <td>{a.id}</td>
                  <td>{a.name}</td>
                  <td>{a.specialty}</td>
                  <td>{a.rank}</td>
                  <td>
                    {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                  </td>
                  <td>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary btn--sm"
                        onClick={() => onEdit(a)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn--sm"
                        onClick={() => onDelete(a.id!)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr key="empty">
                <td colSpan={6} align="center">
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