import { useEffect, useMemo, useState } from "react";
import {
  getMissions,
  getTransmutations,
  getMaterials,
  type Mission,
  type Transmutation,
  type Material,
} from "../services/api";
import { ChartCard, SimpleBar, SimplePie } from "../components/ChartCard";
import { useAuth } from "../auth";

export default function DashboardAlchemist() {
  const { user } = useAuth();
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

  const missionByStatus = useMemo(() => {
    const map = new Map<string, number>();
    missions.forEach((m) => map.set(m.status, (map.get(m.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [missions]);

  const materialsStock = useMemo(
    () => materials.map((m) => ({ name: m.name, stock: m.stock })),
    [materials],
  );

  const recentTrans = useMemo(
    () => [...transmutations].sort((a, b) => b.id - a.id).slice(0, 6),
    [transmutations],
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Panel de alquimista</h1>
          <p className="page-subtitle">
            Bienvenido{user?.email ? `, ${user.email}` : ""}. Aquí tienes una visión
            serena de tus misiones y recursos.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="card">Cargando…</div>
      ) : (
        <div className="grid grid--responsive-3">
          <ChartCard title="Misiones por estado">
            <SimpleBar data={missionByStatus} xKey="status" yKey="count" />
          </ChartCard>

          <ChartCard title="Stock de materiales (top 8)">
            <SimpleBar data={materialsStock.slice(0, 8)} xKey="name" yKey="stock" />
          </ChartCard>

          <ChartCard title="Estados de transmutaciones">
            <SimplePie
              data={countBy(transmutations.map((t) => t.status))}
              nameKey="name"
              valueKey="value"
            />
          </ChartCard>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Últimas transmutaciones</h2>
          <p className="card-subtitle">Resumen de actividad reciente en el taller.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Alchemist</th>
              <th align="left">Descripción</th>
              <th align="left">Estado</th>
              <th align="left">Creada</th>
            </tr>
          </thead>
          <tbody>
            {recentTrans.length ? (
              recentTrans.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.alchemist?.name ?? `#${t.alchemist_id}`}</td>
                  <td>{t.description}</td>
                  <td>
                    <span className="badge">{t.status}</span>
                  </td>
                  <td>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} align="center">
                  Sin transmutaciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function countBy(items: string[]) {
  const map = new Map<string, number>();
  items.forEach((s) => map.set(s, (map.get(s) ?? 0) + 1));
  return Array.from(map, ([name, value]) => ({ name, value }));
}