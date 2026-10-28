"use client";

import { useEffect, useId, useRef, useState } from "react";
import { tokens } from "@/config/design-tokens";
import { formatDate, formatINR } from "@/lib/format";

/** Width of the wrapped element, so SVG text stays at its real pixel size on every screen. */
function useWidth(initial = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(240, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const monthLabel = (key: string) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));
const niceTicks = (hi: number, n = 4) => Array.from({ length: n + 1 }, (_, i) => (hi * i) / n);

/** Line + area chart of dated values with point markers and a hover/touch tooltip. */
export function ValueLineChart({ points, label }: { points: { date: string; value: number }[]; label: string }) {
  const uid = useId().replace(/:/g, "");
  const [ref, W] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const H = 240, P = { l: 64, r: 14, t: 14, b: 30 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const t0 = new Date(points[0].date).getTime(), t1 = new Date(points[points.length - 1].date).getTime();
  const hi = Math.max(...points.map((p) => p.value)) * 1.08 || 1;
  const x = (d: string) => P.l + (t1 === t0 ? iw / 2 : ((new Date(d).getTime() - t0) / (t1 - t0)) * iw);
  const y = (v: number) => P.t + (1 - v / hi) * ih;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points[points.length - 1].date)},${P.t + ih} L${x(points[0].date)},${P.t + ih} Z`;
  const nx = Math.max(2, Math.min(5, Math.floor(iw / 110)));
  const xTicks = Array.from({ length: nx + 1 }, (_, i) => new Date(t0 + ((t1 - t0) * i) / nx).toISOString().slice(0, 10));
  const sel = hover === null ? null : points[hover];
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    let best = 0, bd = Infinity;
    points.forEach((p, i) => { const d = Math.abs(x(p.date) - px); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };
  return (
    <div ref={ref} className="relative w-full">
      <svg width={W} height={H} role="img" aria-label={label} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y" }} className="block max-w-full select-none">
        <defs>
          <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={tokens.color.brand} stopOpacity="0.22" /><stop offset="100%" stopColor={tokens.color.brand} stopOpacity="0.02" /></linearGradient>
        </defs>
        {niceTicks(hi).map((t) => (
          <g key={t}><line x1={P.l} x2={P.l + iw} y1={y(t)} y2={y(t)} stroke={tokens.color.grid} /><text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={tokens.color.muted}>{formatINR(Math.round(t))}</text></g>
        ))}
        {xTicks.map((t, i) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"} fontSize="11" fill={tokens.color.muted}>{new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(t))}</text>
        ))}
        <path d={area} fill={`url(#${uid}f)`} />
        <path d={line} fill="none" stroke={tokens.color.brand} strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={hover === i ? 5 : 3} fill={hover === i ? tokens.color.brand : "#fff"} stroke={tokens.color.brand} strokeWidth="1.5" />)}
        {sel && <line x1={x(sel.date)} x2={x(sel.date)} y1={P.t} y2={P.t + ih} stroke={tokens.color.brand} strokeDasharray="2 2" />}
      </svg>
      {sel && (
        <div role="status" className="pointer-events-none absolute -translate-x-1/2 rounded-control border border-line bg-white px-3 py-1.5 text-xs shadow-card" style={{ left: Math.max(60, Math.min(W - 60, x(sel.date))), top: Math.max(0, y(sel.value) - 52) }}>
          <p className="tabular whitespace-nowrap font-bold text-ink">{formatINR(sel.value)}</p>
          <p className="whitespace-nowrap text-muted">{formatDate(sel.date)}</p>
        </div>
      )}
    </div>
  );
}

/** Monthly bar chart. Null values (no data yet for that month) render as an empty slot. */
export function MonthlyBars({ rows, label }: { rows: { key: string; value: number | null }[]; label: string }) {
  const [ref, W] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const H = 220, P = { l: 64, r: 8, t: 12, b: 28 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const hi = Math.max(...rows.map((r) => r.value ?? 0)) * 1.1 || 1;
  const slot = iw / rows.length, bw = Math.min(36, slot * 0.6);
  const y = (v: number) => P.t + (1 - v / hi) * ih;
  const every = Math.ceil(rows.length / Math.max(1, Math.floor(iw / 52)));
  return (
    <div ref={ref} className="relative w-full">
      <svg width={W} height={H} role="img" aria-label={label} onPointerLeave={() => setHover(null)} className="block max-w-full">
        {niceTicks(hi).map((t) => (
          <g key={t}><line x1={P.l} x2={P.l + iw} y1={y(t)} y2={y(t)} stroke={tokens.color.grid} /><text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={tokens.color.muted}>{formatINR(Math.round(t))}</text></g>
        ))}
        {rows.map((r, i) => {
          const cx = P.l + slot * i + slot / 2;
          return (
            <g key={r.key} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}>
              <rect x={cx - slot / 2} y={P.t} width={slot} height={ih} fill={hover === i ? tokens.color.brandSoft : "transparent"} opacity="0.6" />
              {r.value !== null && r.value > 0 && <rect x={cx - bw / 2} y={y(r.value)} width={bw} height={P.t + ih - y(r.value)} rx="3" fill={tokens.color.brand} />}
              {i % every === 0 && <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={tokens.color.muted}>{monthLabel(r.key)}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div role="status" className="pointer-events-none absolute -translate-x-1/2 rounded-control border border-line bg-white px-3 py-1.5 text-xs shadow-card" style={{ left: Math.max(60, Math.min(W - 60, P.l + slot * hover + slot / 2)), top: 0 }}>
          <p className="whitespace-nowrap text-muted">{monthLabel(rows[hover].key)}</p>
          <p className="tabular whitespace-nowrap font-bold text-ink">{rows[hover].value === null ? "No data yet" : formatINR(rows[hover].value)}</p>
        </div>
      )}
    </div>
  );
}

const PALETTE = ["#1B5E20", "#2E7D32", "#43A047", "#81C784", "#A7D96C", "#C8E6C9"];

/** Donut with a legend listing value and share. Shares use one denominator (the sum of the rows). */
export function Donut({ rows, total, label }: { rows: { label: string; value: number; pct: number }[]; total: number; label: string }) {
  const R = 54, C = 2 * Math.PI * R;
  const offsets = rows.map((_, i) => rows.slice(0, i).reduce((s, r) => s + (r.pct / 100) * C, 0));
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 140 140" role="img" aria-label={label} className="size-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke={tokens.color.grid} strokeWidth="18" />
        {rows.map((r, i) => {
          const len = (r.pct / 100) * C;
          return <circle key={r.label} cx="70" cy="70" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offsets[i]} />;
        })}
      </svg>
      <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink">{r.label}</span>
            <span className="tabular text-muted">{formatINR(r.value)}</span>
            <span className="tabular w-12 text-right font-semibold text-ink">{r.pct.toFixed(1)}%</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-line pt-2 text-xs text-muted"><span>Total estimated value of open positions</span><span className="tabular font-semibold text-ink">{formatINR(total)}</span></li>
      </ul>
    </div>
  );
}
