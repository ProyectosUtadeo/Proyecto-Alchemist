// src/pages/TransmutationsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type {
  Alchemist,
  Material,
  Transmutation,
  TransmutationMaterialInput,
  TransmutationSimulationResponse,
} from "../services/api";
import {
  getAlchemists,
  getMaterials,
  getTransmutations,
  simulateTransmutation,
  startTransmutation,
} from "../services/api";
import "./TransmutationsPage.css";

type WsEnvelope =
  | {
      type:
        | "transmutation:started"
        | "transmutation:updated"
        | "transmutation:completed"
        | "transmutation:cancelled";
      data: Transmutation;
    }
  | { type: string; data: any };

export default function TransmutationsPage() {
  const [list, setList] = useState<Transmutation[]>([]);
  const [alchs, setAlchs] = useState<Alchemist[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [alchemistId, setAlchemistId] = useState<number | "">("");

  type FormState = {
    description: string;
    complexity: string;
    riskLevel: string;
    catalystQuality: number;
    materials: TransmutationMaterialInput[];
  };

  const [form, setForm] = useState<FormState>({
    description: "",
    complexity: "",
    riskLevel: "",
    catalystQuality: 3,
    materials: [],
  });
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [simulation, setSimulation] = useState<TransmutationSimulationResponse | null>(
    null,
  );
  const [simError, setSimError] = useState<string>("");
  const [startError, setStartError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const wsUrl = useMemo(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname;
    const port = "8000";
    return `${proto}://${host}:${port}/ws`;
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  const load = async () => {
    const [t, a, mats] = await Promise.all([
      getTransmutations(),
      getAlchemists(),
      getMaterials(),
    ]);
    setList(t);
    setAlchs(a);
    setMaterials(mats);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | undefined;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg: WsEnvelope = JSON.parse(evt.data);
          if (
            msg.type === "transmutation:started" ||
            msg.type === "transmutation:updated" ||
            msg.type === "transmutation:completed" ||
            msg.type === "transmutation:cancelled"
          ) {
            setList((prev) => {
              const t = msg.data;
              const idx = prev.findIndex((x) => x.id === t.id);
              if (idx === -1) return [t, ...prev];
              const copy = prev.slice();
              copy[idx] = t;
              return copy;
            });
          }
        } catch {
          // ignora mensajes no JSON
        }
      };

      ws.onclose = () => {
        reconnectTimer = window.setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
      wsRef.current = null;
    };
  }, [wsUrl]);

  const onStart = async () => {
    if (!alchemistId) return;
    setStartError("");
    setSuccessMessage("");
    setIsStarting(true);
    try {
      const description = form.description.trim() || "Generic transmutation";
      const catalyst = Math.max(1, Math.min(5, Math.round(form.catalystQuality)));
      await startTransmutation(Number(alchemistId), {
        description,
        complexity: form.complexity || undefined,
        riskLevel: form.riskLevel || undefined,
        catalystQuality: catalyst,
        materials: form.materials,
      });
      setSuccessMessage("Transmutation sent for supervisor approval.");
      setForm((prev) => ({
        ...prev,
        description: "",
        materials: [],
        catalystQuality: catalyst,
      }));
      setSelectedMaterialId(null);
      setSelectedQuantity(1);
      setSimulation(null);
      await load();
    } catch (err: any) {
      setStartError(err?.message ?? "Failed to start transmutation");
    } finally {
      setIsStarting(false);
    }
  };

  const onAddMaterial = () => {
    if (selectedMaterialId == null || selectedQuantity <= 0) return;
    const quantity = Number(selectedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    setForm((prev) => {
      const existingIndex = prev.materials.findIndex(
        (m) => m.materialId === selectedMaterialId,
      );
      let next: TransmutationMaterialInput[];
      if (existingIndex >= 0) {
        next = prev.materials.map((item, idx) =>
          idx === existingIndex
            ? {
                materialId: item.materialId,
                quantity: Number((item.quantity + quantity).toFixed(2)),
              }
            : item,
        );
      } else {
        next = [
          ...prev.materials,
          {
            materialId: selectedMaterialId,
            quantity: Number(quantity.toFixed(2)),
          },
        ];
      }
      return {
        ...prev,
        materials: next,
      };
    });
    setSelectedMaterialId(null);
    setSelectedQuantity(1);
  };

  const onRemoveMaterial = (id: number) => {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((item) => item.materialId !== id),
    }));
  };

  const plannedMaterials = useMemo(
    () =>
      form.materials.map((entry) => {
        const meta = materials.find((m) => m.id === entry.materialId);
        const unitCost = meta?.cost ?? 0;
        return {
          ...entry,
          name: meta?.name ?? `#${entry.materialId}`,
          unit: meta?.unit ?? "",
          unitCost,
          subtotal: Number((unitCost * entry.quantity).toFixed(2)),
        };
      }),
    [form.materials, materials],
  );

  const plannedMaterialsCost = useMemo(
    () => plannedMaterials.reduce((sum, item) => sum + item.subtotal, 0),
    [plannedMaterials],
  );

  const handleSimulate = async () => {
    if (!alchemistId) {
      setSimError("Selecciona un alquimista para simular");
      return;
    }
    setIsSimulating(true);
    setSimError("");
    try {
      const description = form.description.trim() || "Generic transmutation";
      const catalyst = Math.max(1, Math.min(5, Math.round(form.catalystQuality)));
      const payload = {
        description,
        complexity: form.complexity || undefined,
        riskLevel: form.riskLevel || undefined,
        catalystQuality: catalyst,
        materials: form.materials,
      };
      const res = await simulateTransmutation(payload);
      setSimulation(res);
    } catch (err: any) {
      setSimulation(null);
      setSimError(err?.message ?? "Failed to simulate transmutation");
    } finally {
      setIsSimulating(false);
    }
  };

  const getAlchName = (id: number) => {
    const found = alchs.find((a) => a.id === id);
    return found ? found.name : `#${id}`;
  };

  const complexityOptions = ["TRIVIAL", "LOW", "MEDIUM", "HIGH", "MASTER"];
  const riskOptions = ["LOW", "GUARDED", "MEDIUM", "HIGH", "CRITICAL"];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Transmutations</h1>
          <p className="page-subtitle">
            Diseña, simula y lanza experimentos con una experiencia relajada.
          </p>
        </div>
      </header>

      <div className="card transmutations-planner">
        <div className="card-header">
          <h2 className="section-title">Planificador y simulación</h2>
          <p className="card-subtitle">
            Define parámetros, estima costes y envía la solicitud al supervisor.
          </p>
        </div>

        {(successMessage || startError || simError) && (
          <div className="stack stack--sm">
            {successMessage && (
              <div className="alert alert--success">{successMessage}</div>
            )}
            {startError && <div className="alert alert--danger">{startError}</div>}
            {simError && <div className="alert alert--warn">{simError}</div>}
          </div>
        )}

        <div className="transmutations-columns">
          <div className="transmutations-field">
            <label>Alchemist</label>
            <select
              value={alchemistId}
              onChange={(e) =>
                setAlchemistId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Selecciona un alquimista</option>
              {alchs.map((a) => (
                <option key={`alch-${a.id}`} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="transmutations-field" style={fieldWide}>
            <label>Descripción</label>
            <input
              placeholder="Descripción de la transmutación"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="transmutations-columns">
          <div className="transmutations-field">
            <label>Complejidad</label>
            <select
              value={form.complexity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, complexity: e.target.value }))
              }
            >
              <option value="">Automática</option>
              {complexityOptions.map((opt) => (
                <option key={`complexity-${opt}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="transmutations-field">
            <label>Nivel de riesgo</label>
            <select
              value={form.riskLevel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, riskLevel: e.target.value }))
              }
            >
              <option value="">Automático</option>
              {riskOptions.map((opt) => (
                <option key={`risk-${opt}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="transmutations-field">
            <label>Calidad del catalizador (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.catalystQuality}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  catalystQuality: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="transmutations-materials">
          <h4>Materiales planificados</h4>
          <div className="transmutations-columns">
            <div className="transmutations-field">
              <label>Material</label>
              <select
                value={selectedMaterialId ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setSelectedMaterialId(value);
                }}
              >
                <option value="">Selecciona material</option>
                {materials.map((m) => (
                  <option key={`mat-${m.id}`} value={m.id}>
                    {m.name} ({formatCurrency(m.cost)}/{m.unit || "u"})
                  </option>
                ))}
              </select>
            </div>
            <div className="transmutations-field" style={fieldSmall}>
              <label>Cantidad</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
              />
            </div>
            <div className="transmutations-actions">
              <button type="button" onClick={onAddMaterial}>
                Añadir material
              </button>
            </div>
          </div>

          {plannedMaterials.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th align="left">Material</th>
                  <th align="right">Cantidad</th>
                  <th align="right">Costo unitario</th>
                  <th align="right">Subtotal</th>
                  <th align="left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plannedMaterials.map((item) => (
                  <tr key={`planned-${item.materialId}`}>
                    <td>{item.name}</td>
                    <td align="right">
                      {item.quantity.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                      {item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td align="right">{formatCurrency(item.unitCost)}</td>
                    <td align="right">{formatCurrency(item.subtotal)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary btn--sm"
                        onClick={() => onRemoveMaterial(item.materialId)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} align="right" style={bold}>
                    Total materiales
                  </td>
                  <td align="right" style={bold}>
                    {formatCurrency(plannedMaterialsCost)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="transmutations-empty">
              Aún no agregas materiales a esta simulación.
            </div>
          )}
        </div>

        <div className="transmutations-actions">
          <button type="button" onClick={handleSimulate} disabled={isSimulating}>
            {isSimulating ? "Calculando…" : "Simular costo"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onStart}
            disabled={!alchemistId || isStarting}
            title={!alchemistId ? "Selecciona un alquimista para iniciar" : ""}
          >
            {isStarting ? "Iniciando…" : "Iniciar transmutación"}
          </button>
        </div>

        {simulation && (
          <div className="transmutations-result">
            <h4>Resultado de la simulación</h4>
            <div className="transmutations-summary">
              <div>
                <strong>Costo estimado:</strong>{" "}
                {formatCurrency(simulation.estimated_cost)}
              </div>
              <div>
                <strong>Duración estimada:</strong>{" "}
                {formatDuration(simulation.duration_seconds)}
              </div>
              <div>
                <strong>Complejidad:</strong> {simulation.complexity}
              </div>
              <div>
                <strong>Riesgo:</strong> {simulation.risk_level}
              </div>
              <div>
                <strong>Catalizador:</strong> {simulation.catalyst_quality}
              </div>
            </div>
            <div className="transmutations-summary">
              <div>
                <strong>Costos base</strong>
                <ul>
                  <li>Materiales: {formatCurrency(simulation.base_material_cost)}</li>
                  <li>
                    Energía arcana: {formatCurrency(simulation.arcane_energy_cost)}
                  </li>
                </ul>
              </div>
              <div>
                <strong>Modificadores</strong>
                <ul>
                  <li>
                    Peso por complejidad: {simulation.complexity_weight.toFixed(2)}
                  </li>
                  <li>
                    Multiplicador de riesgo: {simulation.risk_multiplier.toFixed(2)}
                  </li>
                  <li>
                    Modificador de catalizador:{" "}
                    {simulation.catalyst_modifier.toFixed(2)}
                  </li>
                </ul>
              </div>
            </div>

            {simulation.materials_breakdown.length > 0 && (
              <table className="data-table transmutations-breakdown">
                <thead>
                  <tr>
                    <th align="left">Material</th>
                    <th align="right">Cantidad</th>
                    <th align="right">Costo unitario</th>
                    <th align="right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.materials_breakdown.map((item) => (
                    <tr key={`sim-${item.material_id}`}>
                      <td>{item.name}</td>
                      <td align="right">
                        {item.quantity.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td align="right">{formatCurrency(item.unit_cost)}</td>
                      <td align="right">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Historial de transmutaciones</h2>
          <p className="card-subtitle">Monitoriza cada intento y su progreso.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Alchemist</th>
              <th align="left">Description</th>
              <th align="left">Status</th>
              <th align="right">Costo estimado</th>
              <th align="left">Duración estimada</th>
              <th align="left">Created</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((t) => (
                <tr key={`trm-${t.id}`}>
                  <td>{t.id}</td>
                  <td>{t.alchemist?.name ?? getAlchName(t.alchemist_id)}</td>
                  <td>{t.description}</td>
                  <td>
                    <span className="badge">{t.status}</span>
                  </td>
                  <td align="right">
                    {typeof t.estimated_cost === "number"
                      ? formatCurrency(t.estimated_cost)
                      : "-"}
                  </td>
                  <td>{formatDuration(t.estimated_duration_seconds)}</td>
                  <td>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))
            ) : (
              <tr key="empty">
                <td colSpan={7} align="center">
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

const fieldWide: CSSProperties = { flex: "2 1 320px" };
const fieldSmall: CSSProperties = { flex: "0 1 160px" };
const bold: CSSProperties = { fontWeight: 600 };

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (remainingMins) parts.push(`${remainingMins}m`);
  if ((!hours && !remainingMins) || (secs && parts.length < 2)) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ");
}
