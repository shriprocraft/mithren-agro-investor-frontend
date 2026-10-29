/** Pure market maths for the demo market dashboard. Kept free of React so it is unit-tested. */

export type BaseUnit = "kg" | "litre" | "piece";
export type PriceUnit = "kg" | "quintal" | "tonne" | "litre" | "piece";

/** Kilograms per unit. Only weight-based products convert; litre and piece stay in their own unit. */
const KG_PER: Record<string, number> = { kg: 1, quintal: 100, tonne: 1000 };

export const unitsFor = (base: BaseUnit): PriceUnit[] => (base === "kg" ? ["kg", "quintal", "tonne"] : [base]);
export const UNIT_LABEL: Record<PriceUnit, string> = { kg: "Price per kg", quintal: "Price per quintal", tonne: "Price per tonne", litre: "Price per litre", piece: "Price per piece" };
export const UNIT_SHORT: Record<PriceUnit, string> = { kg: "kg", quintal: "quintal", tonne: "tonne", litre: "litre", piece: "piece" };

/** Price expressed per `unit`, given a price per base unit. */
export function convertPrice(pricePerBase: number, base: BaseUnit, unit: PriceUnit): number {
  if (!Number.isFinite(pricePerBase)) return NaN;
  if (base !== "kg") return unit === base ? pricePerBase : NaN;
  return pricePerBase * (KG_PER[unit] ?? NaN);
}

/** Quantity bought with `amount` rupees, expressed in `unit`. */
export function estimateQuantity(amount: number, pricePerBase: number, base: BaseUnit, unit: PriceUnit): number | null {
  const unitPrice = convertPrice(pricePerBase, base, unit);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) return null;
  return amount / unitPrice;
}

/** ((current − previous) / previous) × 100, or null when it cannot be computed. */
export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export const MIN_AMOUNT = 500;
export const MAX_AMOUNT = 100000;
export const AMOUNT_STEP = 500;

export type AmountResult = { ok: true; value: number } | { ok: false; error: string };

/** Parses a typed rupee amount (commas allowed) and enforces the range. Never clamps silently. */
export function parseTradeAmount(raw: string): AmountResult {
  const s = raw.trim().replace(/,/g, "");
  if (s === "") return { ok: false, error: "Enter an amount." };
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return { ok: false, error: "Enter a positive number (max 2 decimals)." };
  const n = Number(s);
  if (n < MIN_AMOUNT) return { ok: false, error: `Minimum amount is ₹${MIN_AMOUNT.toLocaleString("en-IN")}.` };
  if (n > MAX_AMOUNT) return { ok: false, error: `Maximum amount is ₹${MAX_AMOUNT.toLocaleString("en-IN")}.` };
  return { ok: true, value: n };
}

export const stepAmount = (v: number, dir: 1 | -1) => Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, Math.round(v / AMOUNT_STEP) * AMOUNT_STEP + dir * AMOUNT_STEP));

/**
 * DEMO scenario assumption: the price moves between these two percentages over the period.
 * It is deliberately symmetric and includes a fall. It is not a forecast or an approved assumption.
 */
export const DEMO_SCENARIO = { lowPct: -10, highPct: 10 } as const;

export function scenarioRange(amount: number) {
  return { low: amount * (1 + DEMO_SCENARIO.lowPct / 100), high: amount * (1 + DEMO_SCENARIO.highPct / 100) };
}
