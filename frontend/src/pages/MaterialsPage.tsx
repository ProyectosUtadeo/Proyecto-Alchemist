// src/pages/MaterialsPage.tsx
import { useEffect, useState } from "react";
import type { Material } from "../services/api";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../services/api";
import FormRow from "../components/FormRow";

export default function MaterialsPage() {
  const [list, setList] = useState<Material[]>([]);
  const [form, setForm] = useState<Omit<Material, "id" | "created_at">>({
    name: "",
    unit: "",
    cost: 0,
    stock: 0,
  });
  const [editing, setEditing] = useState<Material | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const load = async () => {
    try {
      setErrMsg("");
      const data = await getMaterials();
      setList(data);
    } catch (err: any) {
      setErrMsg(err?.message ?? "Failed to fetch materials");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitizar stock
    const stock = Number.isFinite(Number(form.stock)) ? Number(form.stock) : 0;
    const cost = Number.isFinite(Number(form.cost)) ? Number(form.cost) : 0;

    if (editing?.id) {
      await updateMaterial(editing.id, { ...form, stock, cost });
    } else {
      await createMaterial({ ...form, stock, cost });
    }
    setEditing(null);
    setForm({ name: "", unit: "", cost: 0, stock: 0 });
    load();
  };

  const onEdit = (m: Material) => {
    setEditing(m);
    setForm({ name: m.name, unit: m.unit, cost: m.cost, stock: m.stock });
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete material?")) return;
    await deleteMaterial(id);
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Materials</h2>

      {errMsg && (
        <div style={{ color: "crimson", margin: "8px 0" }}>{errMsg}</div>
      )}

      {/* Formulario */}
      <form onSubmit={onSubmit} style={{ maxWidth: 420, marginBottom: 18 }}>
        <FormRow label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormRow>
        <FormRow label="Unit">
          <input
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
        </FormRow>
        <FormRow label="Cost">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.cost}
            onChange={(e) =>
              setForm((f) => ({ ...f, cost: Number(e.target.value) }))
            }
          />
        </FormRow>
        <FormRow label="Stock">
          <input
            type="number"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) =>
              setForm((f) => ({ ...f, stock: Number(e.target.value) }))
            }
          />
        </FormRow>
        <button type="submit">{editing ? "Update" : "Create"}</button>
        {editing && (
          <button
            type="button"
            style={{ marginLeft: 8 }}
            onClick={() => {
              setEditing(null);
              setForm({ name: "", unit: "", cost: 0, stock: 0 });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Tabla */}
      <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
        <thead style={{ background: "#eee" }}>
          <tr>
            <th align="left">ID</th>
            <th align="left">Name</th>
            <th align="left">Unit</th>
            <th align="right">Cost</th>
            <th align="right">Stock</th>
            <th align="left">Created</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.length ? (
            list.map((m) => (
              <tr key={`mat-${m.id}`}>
                <td>{m.id}</td>
                <td>{m.name}</td>
                <td>{m.unit || "-"}</td>
                <td align="right">{m.cost.toLocaleString(undefined, { style: "currency", currency: "USD" })}</td>
                <td align="right">{m.stock}</td>
                <td>{m.created_at ? new Date(m.created_at).toLocaleString() : "-"}</td>
                <td>
                  <button onClick={() => onEdit(m)}>Edit</button>
                  <button style={{ marginLeft: 6 }} onClick={() => onDelete(m.id)}>
                    Delete
                  </button>
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
  );
}