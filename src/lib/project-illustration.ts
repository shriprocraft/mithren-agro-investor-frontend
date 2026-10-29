import { AS_OF, type PricePoint, type RangeKey } from "@/data/market-products";

/**
 * ILLUSTRATIVE demo series for the "Projected project economics" chart of projects that have no verified analysis.
 * It is a unitless activity index generated deterministically from the project's id and its illustrative monthly
 * trend. It is not revenue, yield, profit or a forecast, and every use of it must say so.
 */
export const ILLUSTRATION_LABEL = "Illustrative demo data: an activity index, not money, yield or a forecast.";

export type Illustration = { intraday: PricePoint[]; daily: PricePoint[] };

const DAY = 86_400_000;
const END = new Date(AS_OF).getTime();
const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const r1 = (n: number) => Math.round(n * 10) / 10;

/** `trend` is the project's six monthly index values (oldest → newest); the series ends at the newest. */
export function illustrativeSeries(projectId: string, trend: number[]): Illustration | null {
  if (trend.length < 2 || trend.some((v) => !Number.isFinite(v))) return null;
  const rand = rng(hash(projectId));
  const last = trend[trend.length - 1];
  const first = trend[0];
  const span = (trend.length - 1) * 30; // days covered by the monthly points
  const base = (d: number) => {
    if (d <= span) { const pos = (span - d) / 30; const i = Math.min(trend.length - 2, Math.floor(pos)); return trend[i] + (trend[i + 1] - trend[i]) * (pos - i); }
    return first * (1 - 0.3 * Math.min(1, (d - span) / 900)); // older history trends lower, never invented as growth claims
  };
  let noise = 0;
  const daily: PricePoint[] = [];
  for (let d = 1095; d >= 1; d--) {
    noise = noise * 0.85 + (rand() - 0.5) * 0.03;
    daily.push({ t: END - d * DAY, price: r1(Math.max(0.5, base(d) * (1 + (d % 30 === 0 ? 0 : noise)))) });
  }
  daily.push({ t: END, price: last });
  const start = new Date(AS_OF); start.setUTCHours(3, 30, 0, 0);
  let walk = 0;
  const intraday = Array.from({ length: 12 }, (_, i) => {
    walk = walk * 0.7 + (rand() - 0.5) * 0.01;
    return { t: start.getTime() + i * 30 * 60_000, price: r1(i === 11 ? last : last * (0.985 + (0.015 * i) / 11) * (1 + walk)) };
  });
  return { intraday, daily };
}

const RANGE_DAYS: Record<Exclude<RangeKey, "1D" | "ALL">, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };

export function illustrationRange(il: Illustration, range: RangeKey): PricePoint[] {
  if (range === "1D") return il.intraday;
  if (range === "ALL") return il.daily.filter((_, i, a) => (a.length - 1 - i) % 7 === 0);
  const from = END - RANGE_DAYS[range] * DAY;
  return il.daily.filter((p) => p.t >= from);
}

/** Demo scenario multipliers applied to the index. Explicit, symmetric-ish and includes a downside; not forecasts. */
export const ILLUSTRATIVE_SCENARIOS = [
  { id: "base", label: "Base (illustrative)", factor: 1 },
  { id: "downside", label: "Downside −15% (illustrative)", factor: 0.85 },
  { id: "upside", label: "Upside +10% (illustrative)", factor: 1.1 },
] as const;
