import { useEffect, useState } from "react";
import type { Audit } from "../services/api";
import { getAudits } from "../services/api";

export default function AuditsPage() {
  const [list, setList] = useState<Audit[]>([]);

  const load = async () => setList(await getAudits());

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Audits</h1>
          <p className="page-subtitle">
            Observa cada acción registrada en tu laboratorio arcano.
          </p>
        </div>
      </header>

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Historial reciente</h2>
          <p className="card-subtitle">
            Los registros se actualizan automáticamente cada 5 segundos.
          </p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Action</th>
              <th align="left">Entity</th>
              <th align="left">Entity ID</th>
              <th align="left">Created</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.action}</td>
                  <td>{a.entity}</td>
                  <td>{a.entity_id}</td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : "—"}</td>
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
    </section>
  );
}