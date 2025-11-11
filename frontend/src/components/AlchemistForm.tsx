// src/components/AlchemistForm.tsx
import { useEffect, useState } from "react";
import type { Alchemist } from "../services/api";
import FormRow from "./FormRow";

export default function AlchemistForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Alchemist | null;
  onSubmit: (data: Omit<Alchemist, "id" | "created_at">) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Omit<Alchemist, "id" | "created_at">>({
    name: "",
    specialty: "",
    rank: "",
  });

  useEffect(() => {
    if (initial) {
      const { name, specialty, rank } = initial;
      setForm({ name, specialty, rank });
    } else {
      setForm({ name: "", specialty: "", rank: "" });
    }
  }, [initial]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormRow label="Name">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FormRow>
      <FormRow label="Specialty">
        <input
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        />
      </FormRow>
      <FormRow label="Rank">
        <input
          value={form.rank}
          onChange={(e) => setForm({ ...form, rank: e.target.value })}
        />
      </FormRow>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit">{initial?.id ? "Update" : "Create"}</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
