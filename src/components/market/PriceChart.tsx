"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PricePoint, RangeKey } from "@/data/market-products";

function useWidth(initial = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const TZ = "Asia/Kolkata";
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...o });
const axisFmt: Record<RangeKey, Intl.DateTimeFormat> = {
  "1D": fmt({ hour: "2-digit", minute: "2-digit", hour12: true }),
  "1W": fmt({ day: "numeric", month: "short" }),
  "1M": fmt({ day: "numeric", month: "short" }),
  "3M": fmt({ day: "numeric", month: "short" }),
  "6M": fmt({ month: "short", year: "2-digit" }),
  "1Y": fmt({ month: "short", year: "2-digit" }),
  ALL: fmt({ month: "short", year: "2-digit" }),
};
const tipFmt = (range: RangeKey) => (range === "1D" ? fmt({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }) : fmt({ day: "numeric", month: "short", year: "numeric" }));
/** Node and browsers disagree on am/pm casing; normalise so server and client text match. */
const up = (s: string) => s.replace(/[ap]m/g, (m) => m.toUpperCase());
const inr = (v: number) => "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: v < 1000 ? 2 : 0, maximumFractionDigits: v < 1000 ? 2 : 0 });

export function PriceChart({ points, range, factor, unitShort, height = 300, label, valueFormat }: { points: PricePoint[]; range: RangeKey; factor: number; unitShort: string; height?: number; label: string; /** Custom value text (e.g. for a unitless index). Default is rupees per unit. */ valueFormat?: (v: number) => string }) {
  const fmtV = valueFormat ?? ((v: number) => `${inr(v)}/${unitShort}`);
  const [ref, width] = useWidth();
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 56, padR = 12, padT = 12, padB = 26;

  if (points.length < 2) return <p className="grid place-items-center text-sm text-[#7B8497]" style={{ height }}>No price history available for this range.</p>;

  const vals = points.map((p) => p.price * factor);
  const lo0 = Math.min(...vals), hi0 = Math.max(...vals);
  const pad = (hi0 - lo0) * 0.1 || hi0 * 0.05;
  const lo = Math.max(0, lo0 - pad), hi = hi0 + pad;
  const x = (i: number) => padL + (i * (width - padL - padR)) / (points.length - 1);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (height - padT - padB);
  const line = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${padL},${height - padB} ${line} ${x(points.length - 1)},${height - padB}`;
  const yTicks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * i) / 4);
  const xTicks = [0, 1, 2, 3, 4].map((i) => Math.round((i * (points.length - 1)) / 4));
  const setFromX = (clientX: number, rect: DOMRect) => {
    const i = Math.round(((clientX - rect.left - padL) / (width - padL - padR)) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max(0, (h ?? points.length) - 1)); }
    if (e.key === "Escape") setHover(null);
  };
  const first = vals[0], last = vals[vals.length - 1];

  return (
    <div ref={ref} className="relative w-full min-w-0 overflow-hidden">
      <svg width={width} height={height} role="img" tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)}
        aria-label={`${label}. ${range} range, ${points.length} points, from ${fmtV(first)} to ${fmtV(last)}, low ${fmtV(lo0)}, high ${fmtV(hi0)}. Use left and right arrow keys to inspect values.`}
        onPointerMove={(e) => setFromX(e.clientX, e.currentTarget.getBoundingClientRect())} onPointerLeave={() => setHover(null)}
        className="block max-w-full touch-pan-y rounded focus-visible:outline-2 focus-visible:outline-[#2E7D32]">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2E7D32" stopOpacity="0.28" /><stop offset="100%" stopColor="#2E7D32" stopOpacity="0.02" /></linearGradient></defs>
        {yTicks.map((v) => <g key={v}><line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke="#E7EBEF" /><text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#7B8497">{v >= 1000 ? Math.round(v).toLocaleString("en-IN") : v.toFixed(v < 100 ? 1 : 0)}</text></g>)}
        {xTicks.map((i, k) => <text key={k} x={x(i)} y={height - 8} textAnchor={k === 0 ? "start" : k === 4 ? "end" : "middle"} fontSize="11" fill="#7B8497">{up(axisFmt[range].format(points[i].t))}</text>)}
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={line} fill="none" stroke="#2E7D32" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={padT} y2={height - padB} stroke="#2E7D32" strokeOpacity="0.5" /><circle cx={x(hover)} cy={y(vals[hover])} r={5} fill="#2E7D32" stroke="#fff" strokeWidth={2} /></>}
      </svg>
      {hover !== null && (
        <div role="status" className="pointer-events-none absolute top-2 z-10 rounded-lg border border-[#E7EBEF] bg-white px-3 py-2 text-xs shadow-lg" style={{ left: Math.min(Math.max(x(hover) - 50, 0), Math.max(0, width - 130)) }}>
          <p className="font-bold text-[#18233B]">{fmtV(vals[hover])}</p>
          <p className="text-[#7B8497]">{up(tipFmt(range).format(points[hover].t))}</p>
        </div>
      )}
    </div>
  );
}
