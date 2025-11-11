// src/components/FormRow.tsx
import type { ReactNode } from "react";

export default function FormRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, marginBottom: 10 }}>
      <label style={{ lineHeight: "28px" }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}
