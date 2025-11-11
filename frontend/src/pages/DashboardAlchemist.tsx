import { useEffect, useMemo, useState } from "react";
import { getMissions, getTransmutations, getMaterials, type Mission, type Transmutation, type Material } from "../services/api";
import { ChartCard, SimpleBar, SimplePie } from "../components/ChartCard";
import { useAuth } from "../auth";

/**
 * Muestra: resumen de misiones por estado, últimas transmutaciones,
 * y stock de materiales. No requiere cambios en tu backend.
 */
export default function DashboardAlchemist() {
  const { user } = useAuth(); // role viene del JWT
  const [missions, setMissions] = useState<Mission[]>([]);
  const [transmutations, setTransmutations] = useState<Transmutation[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [m, t, mats] = await Promise.all([
        getMissions(),
        getTransmutations(),
        getMaterials(),
      ]);
      setMissions(m);
      setTransmutations(t);
      setMaterials(mats);
      setLoading(false);
    })();
  }, []);

  // Si en el futuro incluyes alchemist_id en el token o en /auth/me,
  // aquí filtras las misiones “del usuario”. De momento mostramos todas.
  const missionByStatus = useMemo(() => {
    const map = new Map<string, number>();
    missions.forEach(m => map.set(m.status, (map.get(m.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [missions]);

  const materialsStock = useMemo(
    () => materials.map(m => ({ name: m.name, stock: m.stock })),
    [materials]
  );

  const recentTrans = useMemo(
    () => [...transmutations].sort((a,b) => (b.id - a.id)).slice(0, 6),
    [transmutations]
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel (Alchemist)</h2>
      <div style={{ color: "#666", marginBottom: 8 }}>
        Bienvenido{user?.email ? `, ${user.email}` : ""}.
      </div>

      {loading ? <div>Cargando…</div> : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <ChartCard title="Misiones por estado">
            <SimpleBar data={missionByStatus} xKey="status" yKey="count" />
          </ChartCard>

          <ChartCard title="Stock de materiales (top 8)">
            <SimpleBar data={materialsStock.slice(0, 8)} xKey="name" yKey="stock" />
          </ChartCard>

          <ChartCard title="Estados de transmutaciones">
            <SimplePie
              data={countBy(transmutations.map(t => t.status))}
              nameKey="name"
              valueKey="value"
            />
          </ChartCard>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3>Últimas transmutaciones</h3>
        <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#eee" }}>
            <tr>
              <th align="left">ID</th>
              <th align="left">Alchemist</th>
              <th align="left">Descripción</th>
              <th align="left">Estado</th>
              <th align="left">Creada</th>
            </tr>
          </thead>
          <tbody>
            {recentTrans.length ? recentTrans.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.alchemist?.name ?? `#${t.alchemist_id}`}</td>
                <td>{t.description}</td>
                <td>{t.status}</td>
                <td>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} align="center">Sin transmutaciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function countBy(items: string[]) {
  const map = new Map<string, number>();
  items.forEach(s => map.set(s, (map.get(s) ?? 0) + 1));
  return Array.from(map, ([name, value]) => ({ name, value }));
}
