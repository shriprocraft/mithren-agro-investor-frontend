"use client";

import { useEffect, useRef, useState } from "react";

export const SERIES_COLORS = ["#2E7D32", "#B7791F", "#1E6FB8", "#C2410C", "#7B3FA0", "#0F766E"];

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

export type LineSeries = { key: string; label: string; color: string; values: number[] };

/** Multi-line chart with legend, hover/touch/keyboard tooltip and a screen-reader data table. */
export function MultiLineChart({ labels, series, title, description }: { labels: readonly string[]; series: LineSeries[]; title: string; description: string }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const H = 260, padL = 36, padR = 12, padT = 12, padB = 28;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const hi = Math.ceil(max / 5) * 5;
  const x = (i: number) => padL + (i * (width - padL - padR)) / Math.max(1, labels.length - 1);
  const y = (v: number) => padT + (1 - v / hi) * (H - padT - padB);
  const onMove = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left;
    const i = Math.round(((rel - padL) / (width - padL - padR)) * (labels.length - 1));
    setHover(Math.min(labels.length - 1, Math.max(0, i)));
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(labels.length - 1, (h ?? -1) + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max(0, (h ?? labels.length) - 1)); }
    if (e.key === "Escape") setHover(null);
  };

  if (series.length === 0) return <p className="py-10 text-center text-sm text-muted">No activity data for this selection.</p>;
  return (
    <figure>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
        {series.map((s) => <li key={s.key} className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-0.5 w-4 rounded" style={{ background: s.color, height: 3 }} />{s.label}</li>)}
      </ul>
      <div ref={ref} className="relative w-full min-w-0 overflow-hidden">
        <svg width={width} height={H} role="img" aria-label={`${title}. ${description}`} tabIndex={0} onKeyDown={key} onBlur={() => setHover(null)}
          onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())} onPointerLeave={() => setHover(null)}
          className="block max-w-full touch-pan-y rounded focus-visible:outline-2 focus-visible:outline-brand-600">
          {[0, 1, 2, 3, 4].map((t) => { const v = (hi * t) / 4; return (
            <g key={t}><line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke="#E8F1EA" /><text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#667085">{Math.round(v)}</text></g>
          ); })}
          {labels.map((l, i) => <text key={l} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#667085">{l}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="#667085" strokeDasharray="3 3" />}
          {series.map((s) => (
            <g key={s.key}>
              <polyline fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
              {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3} fill="#fff" stroke={s.color} strokeWidth={2} />)}
            </g>
          ))}
        </svg>
        {hover !== null && (
          <div role="status" className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-control border border-line bg-white p-2 text-xs shadow-hover" style={{ left: Math.min(Math.max(x(hover) + 10, 0), Math.max(0, width - 170)) }}>
            <p className="font-semibold text-brand-900">{labels[hover]} (illustrative index)</p>
            {series.map((s) => <p key={s.key} className="flex items-center justify-between gap-3"><span className="flex items-center gap-1"><span aria-hidden className="size-2 rounded-full" style={{ background: s.color }} />{s.label}</span><span className="tabular font-semibold">{s.values[hover]}</span></p>)}
          </div>
        )}
      </div>
      <div className="sr-only"><table><caption>{title}</caption><thead><tr><th>Month</th>{series.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
        <tbody>{labels.map((l, i) => <tr key={l}><th>{l}</th>{series.map((s) => <td key={s.key}>{s.values[i]}</td>)}</tr>)}</tbody></table></div>
    </figure>
  );
}

export type BarRow = { id: string; label: string; value: number; detail?: string; color?: string };

/** Horizontal bar chart on a fixed scale with value labels and a hover/focus tooltip. */
export function HBarChart({ rows, max, unit = "", title, description }: { rows: BarRow[]; max: number; unit?: string; title: string; description: string }) {
  const [active, setActive] = useState<string | null>(null);
  if (rows.length === 0) return <p className="py-10 text-center text-sm text-muted">No projects match this selection.</p>;
  return (
    <figure>
      <figcaption className="sr-only">{title}. {description}</figcaption>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="relative">
            <div tabIndex={0} aria-label={`${r.label}: ${r.value}${unit}${r.detail ? `, ${r.detail}` : ""}`}
              onMouseEnter={() => setActive(r.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(r.id)} onBlur={() => setActive(null)}
              className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-2 rounded text-xs focus-visible:outline-2 focus-visible:outline-brand-600 sm:grid-cols-[minmax(0,13rem)_1fr_3rem]">
              <span className="truncate text-ink" title={r.label}>{r.label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-brand-50"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, (r.value / max) * 100)}%`, background: r.color ?? "#2E7D32" }} /></span>
              <span className="tabular text-right font-semibold">{r.value}{unit}</span>
            </div>
            {active === r.id && (
              <div role="status" className="pointer-events-none absolute left-1/4 top-full z-10 -mt-1 rounded-control border border-line bg-white p-2 text-xs shadow-hover">
                <p className="font-semibold text-brand-900">{r.label}</p><p>{r.value}{unit}{r.detail ? ` · ${r.detail}` : ""} (illustrative)</p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between pl-0 text-[11px] text-muted sm:pl-[13.5rem]" aria-hidden><span>0{unit}</span><span className="pr-12">{max}{unit}</span></div>
    </figure>
  );
}
