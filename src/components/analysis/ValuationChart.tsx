"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/common/ui";
import { tokens } from "@/config/design-tokens";
import { formatDate, formatINR, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ValuationPoint } from "@/types";

type Range = "all" | "3m";

/**
 * Sample-data line chart (SVG, no chart dependency) with a range control and a table alternative.
 * `kind` labels the series so forecasts and actuals are never presented as the same thing.
 */
export function ValuationChart({ points, title, seriesLabel = "Sample estimated value" }: { points: ValuationPoint[]; title: string; seriesLabel?: string }) {
  const [range, setRange] = useState<Range>("all");
  const [asTable, setAsTable] = useState(false);

  const data = useMemo(() => {
    if (range === "all" || points.length === 0) return points;
    const last = new Date(points[points.length - 1].date).getTime();
    const cutoff = last - 92 * 86400000;
    const f = points.filter((p) => new Date(p.date).getTime() >= cutoff);
    return f.length ? f : points.slice(-1);
  }, [points, range]);

  if (points.length === 0) {
    return <p className="rounded-control border border-dashed border-line p-6 text-center text-sm text-muted">No valuation history is available in the demo data yet.</p>;
  }

  const W = 640, H = 240, P = { l: 64, r: 16, t: 16, b: 32 };
  const vals = data.map((d) => d.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo || hi || 1) * 0.15;
  const y0 = Math.max(0, lo - pad), y1 = hi + pad;
  const t0 = new Date(data[0].date).getTime(), t1 = new Date(data[data.length - 1].date).getTime();
  const x = (d: string) => P.l + (t1 === t0 ? (W - P.l - P.r) / 2 : ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - P.t - P.b);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(d.date).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const ticks = [y0, (y0 + y1) / 2, y1];

  return (
    <figure>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-sm font-semibold text-ink">{title}</figcaption>
        <div className="flex gap-1" role="group" aria-label="Chart controls">
          {(["all", "3m"] as Range[]).map((r) => (
            <Button key={r} variant={range === r ? "primary" : "secondary"} className="min-h-9 px-3" aria-pressed={range === r} onClick={() => setRange(r)}>
              {r === "all" ? "All" : "Last 3 months"}
            </Button>
          ))}
          <Button variant="ghost" className="min-h-9 px-3" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>{asTable ? "Show chart" : "Show table"}</Button>
        </div>
      </div>
      {asTable ? (
        <div className="overflow-x-auto rounded-control border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">{title} — data table</caption>
            <thead className="border-b border-line bg-white text-left text-xs uppercase text-muted"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">{seriesLabel}</th><th className="px-3 py-2">Note</th></tr></thead>
            <tbody>{data.map((d) => (<tr key={d.date} className="border-t border-line"><td className="px-3 py-2">{formatDate(d.date)}</td><td className="tabular px-3 py-2">{formatINR(d.value)}</td><td className="px-3 py-2 text-muted">{d.note ?? "—"}</td></tr>))}</tbody>
          </table>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${data.length} sample points from ${formatDate(data[0].date)} to ${formatDate(data[data.length - 1].date)}, ranging ${formatINR(lo)} to ${formatINR(hi)}. Use the Show table button for exact values.`} className="w-full">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke={tokens.color.grid} />
              <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={tokens.color.muted}>{formatINR(Math.round(t))}</text>
            </g>
          ))}
          <path d={path} fill="none" stroke={tokens.color.brand} strokeWidth="2.5" strokeLinejoin="round" />
          {data.map((d) => (<circle key={d.date} cx={x(d.date)} cy={y(d.value)} r="3.5" fill="#fff" stroke={tokens.color.brand} strokeWidth="2"><title>{`${formatDate(d.date)}: ${formatINR(d.value)}`}</title></circle>))}
          <text x={P.l} y={H - 8} fontSize="11" fill={tokens.color.muted}>{formatShortDate(data[0].date)}</text>
          <text x={W - P.r} y={H - 8} textAnchor="end" fontSize="11" fill={tokens.color.muted}>{formatShortDate(data[data.length - 1].date)}</text>
        </svg>
      )}
      <p className={cn("mt-1 text-xs text-muted")}>Series: {seriesLabel} · INR · demo data, not an executable price.</p>
    </figure>
  );
}
