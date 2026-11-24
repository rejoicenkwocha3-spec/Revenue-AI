import { cn } from "@/lib/utils";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Decorative waveform drawn from a deterministic seed so server and client render identically. */
export function Waveform({
  bars = 64,
  seed = 7,
  progress = 0,
  className,
  color = "#C9D3EE",
  activeColor = "#2463EB",
  height = 48,
}: {
  bars?: number;
  seed?: number;
  progress?: number;
  className?: string;
  color?: string;
  activeColor?: string;
  height?: number;
}) {
  const rnd = seeded(seed);
  const values = Array.from({ length: bars }, (_, i) => {
    const env = Math.sin((i / bars) * Math.PI) * 0.6 + 0.4;
    return Math.max(0.12, Math.min(1, env * (0.35 + rnd() * 0.75)));
  });
  const w = bars * 4;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("block w-full", className)} style={{ height }} aria-hidden>
      {values.map((v, i) => {
        const h = Math.round(v * (height - 4) * 100) / 100;
        const y = Math.round(((height - h) / 2) * 100) / 100;
        return <rect key={i} x={i * 4 + 0.5} y={y} width={2.4} height={h} rx={1.2} fill={i / bars < progress ? activeColor : color} />;
      })}
    </svg>
  );
}
