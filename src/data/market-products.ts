import type { BaseUnit } from "@/lib/market-calculations";

/**
 * DEMO MARKET DATA. No live market feed is connected: prices, statistics and histories below are
 * illustrative and are generated deterministically from the fields in `SEED`. They are not market prices.
 */
export const MARKET_DATA_LABEL = "Demo market data — not live";
/** Fixed illustrative "as of" moment so the page never pretends to be real-time. */
export const AS_OF = "2026-10-27T14:30:00+05:30";

export type MarketCategory = "Vegetables" | "Fruits" | "Grains" | "Herbs" | "Dairy" | "Fish" | "Poultry";
export const MARKET_CATEGORIES: MarketCategory[] = ["Vegetables", "Fruits", "Grains", "Herbs", "Dairy", "Fish", "Poultry"];

export type PricePoint = { t: number; price: number };
export type MarketProduct = {
  id: string;
  slug: string;
  name: string;
  /** Plural / label used on the action button, e.g. "Tomatoes". */
  buyLabel: string;
  category: MarketCategory;
  price: number;
  unit: BaseUnit;
  dailyChangePercent: number;
  /** Total market volume in ₹ crore (illustrative). */
  volumeCr: number;
  availableSupply: number;
  supplyUnit: string;
  intraday: PricePoint[];
  daily: PricePoint[];
  dayLow: number;
  dayHigh: number;
  yearlyLow: number;
  yearlyHigh: number;
  dataSource: "mock" | "live";
};

type Seed = { name: string; buyLabel?: string; category: MarketCategory; price: number; unit: BaseUnit; day: number; month: number; year: number; volumeCr: number; supply: number; supplyUnit: string };

const SEED: Seed[] = [
  { name: "Tomato", buyLabel: "Tomatoes", category: "Vegetables", price: 40.2, unit: "kg", day: 6.8, month: 28.4, year: 42.1, volumeCr: 125, supply: 1200, supplyUnit: "Tons" },
  { name: "Capsicum", category: "Vegetables", price: 62.5, unit: "kg", day: 4.2, month: 9.5, year: 18.2, volumeCr: 64, supply: 640, supplyUnit: "Tons" },
  { name: "Cucumber", category: "Vegetables", price: 28.3, unit: "kg", day: -2.1, month: -6.4, year: 4.8, volumeCr: 38, supply: 910, supplyUnit: "Tons" },
  { name: "Strawberry", buyLabel: "Strawberries", category: "Fruits", price: 250, unit: "kg", day: 3.6, month: 12.3, year: 21.7, volumeCr: 52, supply: 180, supplyUnit: "Tons" },
  { name: "Lettuce", buyLabel: "Lettuce", category: "Vegetables", price: 90.4, unit: "kg", day: 5.1, month: 14.9, year: 25.3, volumeCr: 22, supply: 95, supplyUnit: "Tons" },
  { name: "Spinach", buyLabel: "Spinach", category: "Vegetables", price: 22.1, unit: "kg", day: -1.4, month: -3.2, year: 2.6, volumeCr: 18, supply: 410, supplyUnit: "Tons" },
  { name: "Brinjal", category: "Vegetables", price: 18.6, unit: "kg", day: 2.3, month: 5.8, year: 11.4, volumeCr: 29, supply: 760, supplyUnit: "Tons" },
  { name: "Carrot", buyLabel: "Carrots", category: "Vegetables", price: 26.4, unit: "kg", day: 3.9, month: 8.1, year: 15.6, volumeCr: 33, supply: 830, supplyUnit: "Tons" },
  { name: "Rice", category: "Grains", price: 52, unit: "kg", day: 0.8, month: 2.4, year: 7.9, volumeCr: 410, supply: 9800, supplyUnit: "Tons" },
  { name: "Wheat", buyLabel: "Wheat", category: "Grains", price: 31.5, unit: "kg", day: -0.6, month: 1.2, year: 6.1, volumeCr: 360, supply: 11200, supplyUnit: "Tons" },
  { name: "Basil", buyLabel: "Basil", category: "Herbs", price: 140, unit: "kg", day: 1.9, month: 7.7, year: 12.5, volumeCr: 4, supply: 14, supplyUnit: "Tons" },
  { name: "Milk", buyLabel: "Milk", category: "Dairy", price: 56, unit: "litre", day: 0.4, month: 1.5, year: 5.2, volumeCr: 210, supply: 52000, supplyUnit: "Kilolitres" },
  { name: "Rohu Fish", buyLabel: "Rohu Fish", category: "Fish", price: 210, unit: "kg", day: -1.1, month: 3.4, year: 9.8, volumeCr: 46, supply: 320, supplyUnit: "Tons" },
  { name: "Broiler Chicken", buyLabel: "Broiler Chicken", category: "Poultry", price: 165, unit: "kg", day: 2.7, month: -4.5, year: 13.2, volumeCr: 98, supply: 1450, supplyUnit: "Tons" },
  { name: "Eggs", buyLabel: "Eggs", category: "Poultry", price: 6.4, unit: "piece", day: 1.6, month: 4.3, year: 10.1, volumeCr: 140, supply: 2100, supplyUnit: "Lakh pieces" },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

const DAY_MS = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;
const END = new Date(AS_OF).getTime();

function build(s: Seed): MarketProduct {
  const id = slugify(s.name);
  const r = rng(hash(id));
  const prevClose = s.price / (1 + s.day / 100);
  const p30 = s.price / (1 + s.month / 100);
  const p365 = s.price / (1 + s.year / 100);
  const DAYS = 1095;
  // Piecewise-linear anchors (3y ago → 1y ago → 30d ago → yesterday), plus smoothed noise pinned to zero at anchors.
  const p1095 = p365 * (0.8 + r() * 0.3);
  const anchors: [number, number][] = [[DAYS, p1095], [365, p365], [30, p30], [1, prevClose]];
  const base = (d: number) => { for (let i = 0; i < anchors.length - 1; i++) { const [d0, v0] = anchors[i], [d1, v1] = anchors[i + 1]; if (d <= d0 && d >= d1) return v0 + ((v1 - v0) * (d0 - d)) / (d0 - d1); } return prevClose; };
  let noise = 0;
  const daily: PricePoint[] = [];
  for (let d = DAYS; d >= 1; d--) {
    noise = noise * 0.85 + (r() - 0.5) * 0.035;
    const pinned = d === 365 || d === 30 || d === 1;
    daily.push({ t: END - d * DAY_MS, price: round2(Math.max(0.5, base(d) * (pinned ? 1 : 1 + noise))) });
  }
  daily.push({ t: END, price: s.price });
  // Intraday: 09:00 → 14:30 in 30-minute steps, starting at yesterday's close and ending at the current price.
  const start = new Date(AS_OF); start.setUTCHours(3, 30, 0, 0); // 09:00 IST
  const steps = 11;
  let walk = 0;
  const intraday: PricePoint[] = Array.from({ length: steps + 1 }, (_, i) => {
    walk = walk * 0.7 + (r() - 0.5) * 0.012;
    const f = i / steps;
    const v = i === 0 ? prevClose : i === steps ? s.price : (prevClose + (s.price - prevClose) * f) * (1 + walk);
    return { t: start.getTime() + i * 30 * 60_000, price: round2(v) };
  });
  const dayPrices = intraday.map((p) => p.price);
  const yearPrices = daily.filter((p) => p.t >= END - 365 * DAY_MS).map((p) => p.price);
  return {
    id, slug: id, name: s.name, buyLabel: s.buyLabel ?? s.name, category: s.category, price: s.price, unit: s.unit, dailyChangePercent: s.day,
    volumeCr: s.volumeCr, availableSupply: s.supply, supplyUnit: s.supplyUnit, intraday, daily,
    dayLow: Math.min(...dayPrices), dayHigh: Math.max(...dayPrices), yearlyLow: Math.min(...yearPrices), yearlyHigh: Math.max(...yearPrices), dataSource: "mock",
  };
}

export const MARKET_PRODUCTS: MarketProduct[] = SEED.map(build);

export type RangeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
export const RANGES: RangeKey[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];
const RANGE_DAYS: Record<Exclude<RangeKey, "1D" | "ALL">, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };

/** The slice of a product's history shown for a time range. ALL is down-sampled weekly. */
export function seriesFor(p: MarketProduct, range: RangeKey): PricePoint[] {
  if (range === "1D") return p.intraday;
  if (range === "ALL") return p.daily.filter((_, i, a) => (a.length - 1 - i) % 7 === 0);
  const from = END - RANGE_DAYS[range] * DAY_MS;
  return p.daily.filter((pt) => pt.t >= from);
}

/** Price `daysAgo` days before the latest point. */
export function priceDaysAgo(p: MarketProduct, daysAgo: number): number | null {
  const target = END - daysAgo * DAY_MS;
  const hit = p.daily.find((pt) => Math.abs(pt.t - target) < DAY_MS / 2);
  return hit?.price ?? null;
}
