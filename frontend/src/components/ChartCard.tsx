import { type ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import "./ChartCard.css";

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card chart-card">
      <div className="chart-card__title">{title}</div>
      {children}
    </section>
  );
}

export function SimpleBar({
  data,
  xKey,
  yKey,
}: {
  data: any[];
  xKey: string;
  yKey: string;
}) {
  return (
    <div className="chart-card__canvas">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis allowDecimals={false} stroke="#94a3b8" />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill="var(--brand)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimplePie({
  data,
  nameKey,
  valueKey,
}: {
  data: any[];
  nameKey: string;
  valueKey: string | number;
}) {
  return (
    <div className="chart-card__canvas">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={pieColors[i % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const pieColors = [
  "#4f46e5",
  "#22c55e",
  "#f97316",
  "#0ea5e9",
  "#d946ef",
  "#facc15",
];