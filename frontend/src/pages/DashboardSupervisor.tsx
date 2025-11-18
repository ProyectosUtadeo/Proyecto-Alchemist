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
    trans.forEach((t) => m.set(t.status, (m.get(t.status) ?? 0) + 1));
    return Array.from(m, ([status, count]) => ({ status, count }));
  }, [trans]);

  const byAlchemist = useMemo(() => {
    const m = new Map<string, number>();
    trans.forEach((t) => {
      const k = t.alchemist?.name ?? `#${t.alchemist_id}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    const arr = Array.from(m, ([name, count]) => ({ name, count }));
    return arr.sort((a, b) => b.count - a.count).slice(0, 10);
  }, [trans]);

  const pendingTransmutations = useMemo(
    () => trans.filter((t) => t.status === "PENDING_APPROVAL"),
    [trans],
  );

  const recentAudits = useMemo(
    () => [...audits].sort((a, b) => b.id - a.id).slice(0, 10),
    [audits],
  );

  const handleApprove = async (id: number) => {
    setApproveError("");
    setApproveSuccess("");
    setApprovingId(id);
    try {
      const updated = await updateTransmutationStatus(id, "IN_PROGRESS");
      setTrans((prev) => {
        const idx = prev.findIndex((item) => item.id === id);
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
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Panel de supervisor</h1>
          <p className="page-subtitle">
            Evalúa las solicitudes de transmutación y vigila cada auditoría.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="card">Cargando…</div>
      ) : (
        <>
          <div className="grid grid--responsive-3">
            <ChartCard title="Transmutaciones por estado">
              <SimplePie
                data={byStatus.map((x) => ({ name: x.status, value: x.count }))}
                nameKey="name"
                valueKey="value"
              />
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

          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Transmutaciones pendientes de aprobación</h2>
              <p className="card-subtitle">
                Revisa estimaciones y aprueba cuando estés conforme.
              </p>
            </div>
            {approveSuccess && (
              <div className="alert alert--success">{approveSuccess}</div>
            )}
            {approveError && (
              <div className="alert alert--danger">{approveError}</div>
            )}
            <table className="data-table">
              <thead>
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
                  pendingTransmutations.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.alchemist?.name ?? `#${t.alchemist_id}`}</td>
                      <td>{t.description}</td>
                      <td align="right">{formatCurrency(t.estimated_cost)}</td>
                      <td>{formatDuration(t.estimated_duration_seconds)}</td>
                      <td>
                        {t.created_at ? new Date(t.created_at).toLocaleString() : "-"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleApprove(t.id)}
                          disabled={approvingId !== null}
                          className="btn-secondary btn--sm"
                        >
                          {approvingId === t.id ? "Aprobando…" : "Aprobar"}
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

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Auditorías recientes</h2>
          <p className="card-subtitle">Un vistazo compacto a los últimos eventos.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Acción</th>
              <th align="left">Entidad</th>
              <th align="left">Entidad ID</th>
              <th align="left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recentAudits.length ? (
              recentAudits.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.action}</td>
                  <td>{a.entity}</td>
                  <td>{a.entity_id}</td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} align="center">
                  Sin auditorías
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function groupAuditsByHour(audits: Audit[]) {
  const map = new Map<string, number>();
  audits.forEach((a) => {
    const d = a.created_at ? new Date(a.created_at) : new Date();
    const label = d.getHours().toString().padStart(2, "0") + ":00";
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map, ([hour, events]) => ({ hour, events })).sort((x, y) =>
    x.hour.localeCompare(y.hour),
  );
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    value,
  );
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  const parts = [] as string[];
  if (hours) parts.push(`${hours}h`);
  if (remainingMins) parts.push(`${remainingMins}m`);
  if ((!hours && !remainingMins) || (secs && parts.length < 2)) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ");
}