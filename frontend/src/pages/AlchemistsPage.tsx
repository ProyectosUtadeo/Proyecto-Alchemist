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
    <div style={{ padding: 20 }}>
      <h2>Alchemists</h2>

      {errMsg && (
        <div style={{ marginBottom: 12, color: "crimson" }}>
          {errMsg}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
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

        <button type="submit">{editing ? "Update" : "Create"}</button>
        {editing && (
          <button
            type="button"
            style={{ marginLeft: 8 }}
            onClick={() => {
              setEditing(null);
              setForm({ name: "", specialty: "", rank: "" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div style={{ marginTop: 24 }}>
        <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#eee" }}>
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
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : "—"}</td>
                  <td>
                    <button onClick={() => onEdit(a)}>Edit</button>{" "}
                    <button onClick={() => onDelete(a.id)}>Delete</button>
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
    </div>
  );
}
