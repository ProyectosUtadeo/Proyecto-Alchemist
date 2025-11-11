import { useEffect, useMemo, useState } from "react";
import {
  getTransmutations,
  getAudits,
  updateTransmutationStatus,
  type Transmutation,
  type Audit,
} from "../services/api";
import { ChartCard, SimpleBar, SimplePie } from "../components/ChartCard";

export default function DashboardSupervisor() {
  const [trans, setTrans] = useState<Transmutation[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveError, setApproveError] = useState("");
  const [approveSuccess, setApproveSuccess] = useState("");

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

  const pendingTransmutations = useMemo(
    () => trans.filter(t => t.status === "PENDING_APPROVAL"),
    [trans],
  );

  const recentAudits = useMemo(
    () => [...audits].sort((a,b)=> b.id - a.id).slice(0, 10),
    [audits]
  );

  const handleApprove = async (id: number) => {
    setApproveError("");
    setApproveSuccess("");
    setApprovingId(id);
    try {
      const updated = await updateTransmutationStatus(id, "IN_PROGRESS");
      setTrans(prev => {
        const idx = prev.findIndex(item => item.id === id);
        if (idx === -1) {
          return [updated, ...prev];
        }
        const copy = prev.slice();
        copy[idx] = updated;
        return copy;
      });
      setApproveSuccess(`Transmutación #${id} aprobada.`);
    } catch (err: any) {
      setApproveError(err?.message ?? "No se pudo aprobar la transmutación.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel (Supervisor)</h2>

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
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

          <div style={{ marginTop: 24 }}>
            <h3>Transmutaciones pendientes de aprobación</h3>
            {approveSuccess && (
              <div style={{ color: "seagreen", marginBottom: 8 }}>{approveSuccess}</div>
            )}
            {approveError && (
              <div style={{ color: "crimson", marginBottom: 8 }}>{approveError}</div>
            )}
            <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
              <thead style={{ background: "#f2f2ff" }}>
                <tr>
                  <th align="left">ID</th>
                  <th align="left">Alquimista</th>
                  <th align="left">Descripción</th>
                  <th align="right">Costo estimado</th>
                  <th align="left">Duración estimada</th>
                  <th align="left">Creada</th>
                  <th align="left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransmutations.length ? (
                  pendingTransmutations.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.alchemist?.name ?? `#${t.alchemist_id}`}</td>
                      <td>{t.description}</td>
                      <td align="right">{formatCurrency(t.estimated_cost)}</td>
                      <td>{formatDuration(t.estimated_duration_seconds)}</td>
                      <td>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                      <td>
                        <button
                          onClick={() => handleApprove(t.id)}
                          disabled={approvingId !== null}
                          style={{ padding: "4px 12px" }}
                        >
                          {approvingId === t.id ? "Aprobando..." : "Aprobar"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} align="center">
                      Sin transmutaciones pendientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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

function formatCurrency(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatDuration(seconds?: number) {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) {
    return "-";
  }
  if (seconds < 60) {
    return `${seconds} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    if (!remainingSeconds) return `${minutes} min`;
    return `${minutes} min ${remainingSeconds} s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!remainingMinutes) return `${hours} h`;
  return `${hours} h ${remainingMinutes} min`;
}
