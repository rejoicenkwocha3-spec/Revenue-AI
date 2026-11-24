"use client";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";

/** Categorical order validated for colour vision deficiency (fixed order, never cycled). */
export const SERIES = ["#315BDB", "#19A875", "#7865E9", "#E08A1E", "#4FB3D9"];
const AXIS = { fontSize: 11, fill: "#66708F" };
const GRID = "#E9EDF6";

const compact = (v: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "USD" }).format(v);
const full = (v: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

function TipBox({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number | null; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-[var(--shadow-lift)]">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.filter((p) => p.value != null).map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-body">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold tabular-nums text-ink">{full(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

/** Actual bookings as bars, weighted pipeline projection as a dashed line, target as a reference line. */
export function RevenueTrendChart({ data, height = 280 }: { data: { label: string; actual: number | null; projected: number | null; target: number | null }[]; height?: number }) {
  const hasTarget = data.some((d) => d.target != null);
  return (
    <div style={{ height }} role="img" aria-label="Revenue by month: actual bookings and projected revenue">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={compact} tick={AXIS} tickLine={false} axisLine={false} width={64} />
          <Tooltip content={<TipBox />} cursor={{ fill: "rgba(49,91,219,.06)" }} />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 12, color: "#3E4A68" }} />
          <Bar dataKey="actual" name="Actual revenue" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line dataKey="projected" name="Projected (weighted pipeline)" stroke={SERIES[2]} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} connectNulls={false} />
          {hasTarget && <Line dataKey="target" name="Target" stroke="#8A93AD" strokeWidth={2} dot={false} type="stepAfter" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForecastActualChart({ data, height = 260 }: { data: { label: string; forecast: number; actual: number }[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Forecast compared with actual revenue">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={compact} tick={AXIS} tickLine={false} axisLine={false} width={64} />
          <Tooltip content={<TipBox />} cursor={{ fill: "rgba(49,91,219,.06)" }} />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="forecast" name="Forecast" fill={SERIES[2]} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="actual" name="Actual" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal single series bars (one hue): ranked values such as revenue by representative. */
export function HBarChart({ data, height, color = SERIES[0], valueName = "Revenue" }: { data: { name: string; value: number }[]; height?: number; color?: string; valueName?: string }) {
  const h = height ?? Math.max(120, data.length * 38 + 20);
  return (
    <div style={{ height: h }} role="img" aria-label={`${valueName} by category`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tickFormatter={compact} tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: "#202B45" }} tickLine={false} axisLine={false} width={120} />
          <Tooltip content={<TipBox />} cursor={{ fill: "rgba(49,91,219,.06)" }} />
          <Bar dataKey="value" name={valueName} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Pipeline funnel: open value by stage, one hue stepping darker toward later stages. */
export function FunnelChart({ data }: { data: { stage: string; value: number; count: number }[] }) {
  const ramp = ["#AFC2F5", "#8AA6F0", "#6489E8", "#4778F5", "#315BDB", "#2649BE", "#1D3A9C"];
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2" aria-label="Pipeline by stage">
      {data.map((d, i) => (
        <li key={d.stage} className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm sm:grid-cols-[130px_1fr]">
          <span className="truncate font-medium text-ink">{d.stage}</span>
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-7 rounded-md" style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: ramp[Math.min(i, ramp.length - 1)] }} title={`${d.stage}: ${full(d.value)} in ${d.count} deals`} />
            <span className="whitespace-nowrap text-xs tabular-nums text-muted">{compact(d.value)} · {d.count}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Stacked composition, e.g. new, expansion, churn by month. */
export function StackedBarChart({ data, keys, height = 260 }: { data: Record<string, number | string>[]; keys: { key: string; name: string; color?: string }[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Revenue composition by month">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={compact} tick={AXIS} tickLine={false} axisLine={false} width={64} />
          <Tooltip content={<TipBox />} cursor={{ fill: "rgba(49,91,219,.06)" }} />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#C9D0E2" />
          {keys.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} name={k.name} stackId="a" fill={k.color ?? SERIES[i]} stroke="#fff" strokeWidth={1} maxBarSize={30} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScenarioBars({ worst, expected, best, target }: { worst: number; expected: number; best: number; target: number | null }) {
  const data = [{ name: "Worst case", value: worst }, { name: "Expected case", value: expected }, { name: "Best case", value: best }];
  return (
    <div style={{ height: 200 }} role="img" aria-label="Forecast scenarios">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={compact} tick={AXIS} tickLine={false} axisLine={false} width={64} />
          <Tooltip content={<TipBox />} cursor={{ fill: "rgba(49,91,219,.06)" }} />
          {target != null && <ReferenceLine y={target} stroke="#202B45" strokeDasharray="4 4" label={{ value: "Target", position: "insideTopRight", fontSize: 11, fill: "#202B45" }} />}
          <Bar dataKey="value" name="Projection" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((_, i) => <Cell key={i} fill={["#B8AEF4", SERIES[2], "#5A46C9"][i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
