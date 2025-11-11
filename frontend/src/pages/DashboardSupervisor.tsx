import { useEffect, useMemo, useState } from "react";
import { getTransmutations, getAudits, type Transmutation, type Audit } from "../services/api";
import { ChartCard, SimpleBar, SimplePie } from "../components/ChartCard";

export default function DashboardSupervisor() {
  const [trans, setTrans] = useState<Transmutation[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [t, a] = await Promise.all([getTransmutations(), getAudits()]);
      setTrans(t);
      setAudits(a);
      setLoading(false);
    })();
  }, []);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    trans.forEach(t => m.set(t.status, (m.get(t.status) ?? 0) + 1));
    return Array.from(m, ([status, count]) => ({ status, count }));
  }, [trans]);

  const byAlchemist = useMemo(() => {
    const m = new Map<string, number>();
    trans.forEach(t => {
      const k = t.alchemist?.name ?? `#${t.alchemist_id}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    const arr = Array.from(m, ([name, count]) => ({ name, count }));
    // top 10
    return arr.sort((a,b)=> b.count - a.count).slice(0,10);
  }, [trans]);

  const recentAudits = useMemo(
    () => [...audits].sort((a,b)=> b.id - a.id).slice(0, 10),
    [audits]
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel (Supervisor)</h2>

      {loading ? <div>Cargando…</div> : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <ChartCard title="Transmutaciones por estado">
            <SimplePie data={byStatus.map(x => ({ name: x.status, value: x.count }))} nameKey="name" valueKey="value" />
          </ChartCard>

          <ChartCard title="Transmutaciones por alquimista (top 10)">
            <SimpleBar data={byAlchemist} xKey="name" yKey="count" />
          </ChartCard>

          <ChartCard title="Auditorías (últimas 24h)">
            <SimpleBar
              data={groupAuditsByHour(recentAudits)}
              xKey="hour"
              yKey="events"
            />
          </ChartCard>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3>Auditorías recientes</h3>
        <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#eee" }}>
            <tr>
              <th align="left">ID</th>
              <th align="left">Acción</th>
              <th align="left">Entidad</th>
              <th align="left">Entidad ID</th>
              <th align="left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recentAudits.length ? recentAudits.map(a => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.action}</td>
                <td>{a.entity}</td>
                <td>{a.entity_id}</td>
                <td>{a.created_at ? new Date(a.created_at).toLocaleString() : "-"}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} align="center">Sin auditorías</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function groupAuditsByHour(audits: Audit[]) {
  const map = new Map<string, number>();
  audits.forEach(a => {
    const d = a.created_at ? new Date(a.created_at) : new Date();
    const label = d.getHours().toString().padStart(2, "0") + ":00";
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map, ([hour, events]) => ({ hour, events })).sort((x,y)=> x.hour.localeCompare(y.hour));
}
