// src/components/AlchemistList.tsx
import type { Alchemist } from "../services/api";

export default function AlchemistList({
  items,
  onEdit,
  onDelete,
}: {
  items: Alchemist[];
  onEdit: (a: Alchemist) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
      <thead style={{ background: "#eee" }}>
        <tr>
          <th align="left">ID</th>
          <th align="left">Name</th>
          <th align="left">Specialty</th>
          <th align="left">Rank</th>
          <th align="left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.length ? (
          items.map((a, idx) => (
            <tr key={a.id ?? `alch-${a.name}-${idx}`}>
              <td>{a.id}</td>
              <td>{a.name}</td>
              <td>{a.specialty}</td>
              <td>{a.rank}</td>
              <td>
                <button onClick={() => onEdit(a)}>Edit</button>{" "}
                {a.id != null && (
                  <button onClick={() => onDelete(a.id!)}>Delete</button>
                )}
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
  );
}
