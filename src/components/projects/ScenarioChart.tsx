"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, LineChart, Maximize2, Minimize2 } from "lucide-react";
import { SCENARIOS, type ScenarioKey } from "@/config/demo-config";
import { tokens } from "@/config/design-tokens";
import { computeScenario } from "@/lib/analysis-calculations";
import { cn } from "@/lib/cn";
import { formatSignedINR } from "@/lib/format";
import type { Project } from "@/types";

const KEYS: ScenarioKey[] = ["conservative", "base", "optimistic"];
const RANGES = [{ id: "1D", days: 1 }, { id: "1W", days: 7 }, { id: "1M", days: 30 }, { id: "3M", days: 90 }, { id: "6M", days: 180 }, { id: "1Y", days: 365 }] as const;
const P = { l: 44, r: 8, t: 12, b: 30 };

type Point = { day: number; net: number; spend: number };

/** Compact rupee label for the axis, e.g. ₹1.2L, ₹45k, −₹8k. */
function compact(v: number): string {
  const a = Math.abs(v), sign = v < 0 ? "−" : "";
  if (a >= 1e7) return `${sign}${+(a / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${sign}${+(a / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${sign}${+(a / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  return `${sign}${Math.round(a)}`;
}

/** Deterministic PRNG so the sample movement is stable between renders and sessions. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/**
 * Day-by-day SAMPLE series for one scenario. The trend is the projected cumulative project position (net sales realised
 * − cost incurred) from the owner's analysis inputs: capex on day 0, opex spread front-loaded over the term, net sales
 * realised over the final quarter. The day-to-day wobble is seeded pseudo-random movement added only so the chart can
 * be drawn like a live chart; it carries no information and the start and end values are exactly the projection.
 */
function buildSeries(project: Project, scenario: ScenarioKey): Point[] | null {
  const a = project.analysis;
  if (!a) return null;
  const r = computeScenario(a, SCENARIOS[scenario]);
  if (r.netSales === null) return null;
  const n = project.durationMonths * 30;
  const baseCapex = a.costs.filter((c) => c.kind === "capex").reduce((s, c) => s + c.amount, 0);
  const baseTotal = a.costs.reduce((s, c) => s + c.amount, 0);
  const capex = baseTotal > 0 ? (r.totalCost * baseCapex) / baseTotal : 0;
  const opex = r.totalCost - capex;
  const w = Array.from({ length: n }, (_, d) => 1.5 - d / n);
  const wSum = w.reduce((s, x) => s + x, 0);
  const saleStart = Math.floor(n * 0.75);
  const trend: Point[] = [{ day: 0, net: -capex, spend: capex }];
  let cost = capex, sales = 0;
  for (let d = 1; d <= n; d++) {
    const spend = (opex * w[d - 1]) / wSum;
    cost += spend;
    if (d > saleStart) sales += r.netSales / (n - saleStart);
    trend.push({ day: d, net: sales - cost, spend });
  }
  const span = Math.max(...trend.map((p) => p.net)) - Math.min(...trend.map((p) => p.net)) || Math.abs(r.totalCost) || 1;
  const rand = rng(hash(`${project.id}:${scenario}`));
  let walk = 0;
  const raw = trend.map(() => (walk += (rand() - 0.5) * span * 0.05));
  const last = raw[raw.length - 1];
  return trend.map((p, i) => {
    const edge = i === 0 || i === n ? 0 : raw[i] - (last * i) / n; // bridge: noise is zero at both ends
    return { day: p.day, net: p.net + edge, spend: i === 0 ? 0 : p.spend * (0.55 + rand() * 0.9) };
  });
}

export function ScenarioChart({ project }: { project: Project }) {
  const uid = useId().replace(/:/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [range, setRange] = useState<string>("ALL");
  const [scenario, setScenario] = useState<ScenarioKey>("base");
  const [big, setBig] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const full = useMemo(() => buildSeries(project, scenario), [project, scenario]);
  const termDays = project.durationMonths * 30;

  if (!full) {
    return (
      <div className="grid min-h-48 place-items-center rounded-control bg-brand-50 px-4 text-center">
        <div>
          <LineChart className="mx-auto size-7 text-muted" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-ink">No performance data available</p>
          <p className="mt-1 max-w-sm text-xs text-muted">This project has no historical results and its analysis is incomplete, so no chart is shown. Nothing is estimated on its behalf.</p>
        </div>
      </div>
    );
  }

  const days = range === "ALL" ? termDays : RANGES.find((r) => r.id === range)?.days ?? termDays;
  // Never fabricate history beyond the project term: a longer range shows the whole term and says so.
  const shown = Math.min(days, termDays);
  const data = full.filter((p) => p.day >= termDays - shown);
  const clipped = range !== "ALL" && days > termDays;
  const W = width, H = big ? 440 : 320;
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const vals = data.map((d) => d.net);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo || 1) * 0.06;
  lo -= pad * 3; hi += pad; // extra room below the line for the volume bars
  const x = (d: number) => P.l + ((d - data[0].day) / Math.max(1, data[data.length - 1].day - data[0].day)) * iw;
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * ih;
  const maxSpend = Math.max(...data.map((d) => d.spend)) || 1;
  const barH = ih * 0.12;
  const bw = Math.max(1.5, Math.min(7, (iw / data.length) * 0.62));
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(d.day).toFixed(1)},${y(d.net).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data[data.length - 1].day).toFixed(1)},${P.t + ih} L${x(data[0].day).toFixed(1)},${P.t + ih} Z`;
  const yTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const nx = Math.max(2, Math.min(5, Math.floor(iw / 130)));
  const xTicks = [...new Set(Array.from({ length: nx + 1 }, (_, i) => Math.round(data[0].day + ((data[data.length - 1].day - data[0].day) * i) / nx)))];
  const idx = Math.min(hover ?? Math.round((data.length - 1) * 0.55), data.length - 1);
  const sel = data[idx];
  const sx = x(sel.day), sy = y(sel.net);
  const tipLeft = Math.max(62, Math.min(W - 62, sx));
  const tipBelow = sy < 80;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - P.l;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round((px / iw) * (data.length - 1)))));
  };

  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-0.5 rounded-xl border border-line bg-white p-1" role="group" aria-label="Time range">
          {[...RANGES.map((r) => r.id), "ALL"].map((id) => {
            return (
              <button key={id} type="button" aria-pressed={range === id} onClick={() => { setRange(id); setHover(null); }} className={cn("min-h-9 min-w-10 rounded-lg px-3 text-xs font-bold sm:min-w-12 sm:px-4", range === id ? "bg-brand-600 text-white shadow-sm" : "text-ink hover:bg-brand-50")}>{id}</button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select aria-label="Scenario" value={scenario} onChange={(e) => { setScenario(e.target.value as ScenarioKey); setHover(null); }} className="min-h-11 appearance-none rounded-xl border border-line bg-white py-2 pl-4 pr-9 text-xs font-semibold text-ink">
              {KEYS.map((k) => <option key={k} value={k}>{SCENARIOS[k].label} scenario</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          </div>
          <button type="button" aria-label={big ? "Collapse chart" : "Expand chart"} aria-pressed={big} onClick={() => setBig(!big)} className="grid size-11 place-items-center rounded-xl border border-line bg-white text-brand-700 hover:bg-brand-50">
            {big ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {(clipped || range === "1D") && (
        <p role="status" className="mb-2 rounded-control bg-brand-50 px-3 py-1.5 text-xs text-muted">
          {range === "1D" ? "Only daily data exists, so 1D shows the final day of the project term." : `${range} requested, but the project term is ${termDays} days. Showing all available data (day 0 to day ${termDays}).`}
        </p>
      )}

      <div ref={wrap} className="relative w-full">
        <svg width={W} height={H} role="img" aria-label={`Illustrative sample chart of the projected cumulative project position, ${SCENARIOS[scenario].label} scenario, day ${data[0].day} to day ${data[data.length - 1].day}, ending at ${formatSignedINR(Math.round(data[data.length - 1].net))}. Not past performance.`} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y" }} className="block max-w-full select-none">
          <defs>
            <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.color.brand} stopOpacity="0.34" />
              <stop offset="100%" stopColor={tokens.color.brand} stopOpacity="0.04" />
            </linearGradient>
            <clipPath id={`${uid}-clip`}><rect x={P.l} y={P.t} width={iw} height={ih} /></clipPath>
          </defs>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={P.l} x2={P.l + iw} y1={y(t)} y2={y(t)} stroke={tokens.color.grid} />
              <text x={P.l - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill={tokens.color.ink}>{compact(t)}</text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={P.t} y2={P.t + ih} stroke={tokens.color.grid} />
              <text x={x(t)} y={H - 8} textAnchor={t === xTicks[0] ? "start" : t === xTicks[xTicks.length - 1] ? "end" : "middle"} fontSize="12" fill={tokens.color.muted}>Day {t}</text>
            </g>
          ))}
          <g clipPath={`url(#${uid}-clip)`}>
            {data.slice(1).map((d) => (
              <rect key={d.day} x={x(d.day) - bw / 2} y={P.t + ih - (d.spend / maxSpend) * barH} width={bw} height={(d.spend / maxSpend) * barH} fill={tokens.color.brand} opacity="0.28" />
            ))}
            <path d={area} fill={`url(#${uid}-fill)`} />
            <path d={line} fill="none" stroke={tokens.color.brand} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          </g>
          <line x1={sx} x2={sx} y1={sy} y2={P.t + ih} stroke={tokens.color.brand} strokeWidth="1" strokeDasharray="2 2" />
          <circle cx={sx} cy={sy} r="5.5" fill={tokens.color.brand} stroke="#fff" strokeWidth="2" />
        </svg>
        <div role="status" className="pointer-events-none absolute -translate-x-1/2 rounded-xl border border-line bg-white px-4 py-2 text-left shadow-hover" style={{ left: tipLeft, top: tipBelow ? sy + 14 : sy - 66 }}>
          <p className="tabular whitespace-nowrap text-sm font-bold text-ink">{formatSignedINR(Math.round(sel.net))}</p>
          <p className="whitespace-nowrap text-xs text-muted">Day {sel.day} · sample</p>
          <span aria-hidden className={cn("absolute size-2.5 rotate-45 bg-white", tipBelow ? "-top-[6px] border-l border-t border-line" : "-bottom-[6px] border-b border-r border-line")} style={{ left: `calc(50% + ${sx - tipLeft}px)`, marginLeft: -5 }} />
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        <strong className="font-semibold text-ink">Illustrative sample data — not real project performance.</strong> The trend is the projected cumulative position (net sales − cost) for the {SCENARIOS[scenario].label} scenario from owner-submitted inputs; day-to-day movement and the volume bars (projected daily operating cost) are sample variation added for display. Not an investor return. Ranges longer than the {termDays}-day project term show the full term.
      </figcaption>
    </figure>
  );
}
