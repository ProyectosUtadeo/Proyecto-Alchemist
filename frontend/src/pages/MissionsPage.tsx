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
    <div style={{ padding: 20 }}>
      <h2>Missions</h2>

      <form onSubmit={onSubmit} style={{ maxWidth: 460 }}>
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
            <option value="">(none)</option>
            {alchs
              .filter((a) => typeof a.id === "number")
              .map((a, i) => (
                <option key={`alch-${a.id ?? "noid"}-${i}`} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </FormRow>

        <button type="submit">{editing ? "Update" : "Create"}</button>
      </form>

      <div style={{ marginTop: 24 }}>
        <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#eee" }}>
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
                  <td>{m.status}</td>
                  <td>
                    <button onClick={() => onEdit(m)}>Edit</button>{" "}
                    <button onClick={() => onDelete(m.id)}>Delete</button>
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
    </div>
  );
}
