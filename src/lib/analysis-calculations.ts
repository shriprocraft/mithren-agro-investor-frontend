import { SCENARIOS, type ScenarioKey } from "@/config/demo-config";
import type { ProjectAnalysis } from "@/types";

/**
 * Deterministic, UI-agnostic project analysis maths (illustrative only).
 *
 *   saleableQty  = plannedQty × (1 + yieldAdj) × (1 − lossRate)
 *   grossSales   = saleableQty × price
 *   netSales     = grossSales × (1 − salesDeduction)
 *   totalCost    = Σ cost items × (1 + costAdj)      (opex + capex, no depreciation split)
 *   surplus      = netSales − totalCost              (project level — NOT an investor return)
 *   margin       = surplus ÷ netSales
 */
export type Adjustments = {
  yieldPct: number;
  pricePct: number;
  costPct: number;
  extraLossPts: number;
};

export const ZERO_ADJ: Adjustments = { yieldPct: 0, pricePct: 0, costPct: 0, extraLossPts: 0 };

export type ScenarioResult = {
  plannedQty: number;
  saleableQty: number;
  lossRatePct: number;
  price: number | null;
  grossSales: number | null;
  deductions: number | null;
  netSales: number | null;
  totalCost: number;
  surplus: number | null;
  marginPct: number | null;
  breakEvenPrice: number | null;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const safe = (v: number) => (Number.isFinite(v) ? v : 0);

export function totalCost(a: Pick<ProjectAnalysis, "costs">, costPct = 0): number {
  const base = a.costs.reduce((s, c) => s + (Number.isFinite(c.amount) ? c.amount : 0), 0);
  return round2(base * (1 + safe(costPct) / 100));
}

export function computeScenario(a: ProjectAnalysis, adj: Adjustments = ZERO_ADJ): ScenarioResult {
  const lossRatePct = clamp(a.lossRatePct + adj.extraLossPts, 0, 100);
  const plannedQty = Math.max(0, safe(a.plannedQty) * (1 + safe(adj.yieldPct) / 100));
  const saleableQty = round2(plannedQty * (1 - lossRatePct / 100));
  const cost = totalCost(a, adj.costPct);

  if (a.pricePerUnit === null || a.salesDeductionPct === null) {
    return {
      plannedQty: round2(plannedQty),
      saleableQty,
      lossRatePct,
      price: null,
      grossSales: null,
      deductions: null,
      netSales: null,
      totalCost: cost,
      surplus: null,
      marginPct: null,
      breakEvenPrice: null,
    };
  }

  const price = round2(a.pricePerUnit * (1 + adj.pricePct / 100));
  const grossSales = round2(saleableQty * price);
  const deductions = round2(grossSales * (a.salesDeductionPct / 100));
  const netSales = round2(grossSales - deductions);
  const surplus = round2(netSales - cost);
  const marginPct = netSales > 0 ? round2((surplus / netSales) * 100) : null;
  const denom = saleableQty * (1 - a.salesDeductionPct / 100);
  const breakEvenPrice = denom > 0 ? round2(cost / denom) : null;

  return { plannedQty: round2(plannedQty), saleableQty, lossRatePct, price, grossSales, deductions, netSales, totalCost: cost, surplus, marginPct, breakEvenPrice };
}

export function computeAllScenarios(a: ProjectAnalysis): Record<ScenarioKey, ScenarioResult> {
  return {
    conservative: computeScenario(a, SCENARIOS.conservative),
    base: computeScenario(a, SCENARIOS.base),
    optimistic: computeScenario(a, SCENARIOS.optimistic),
  };
}

export type SensitivityRow = { label: string; low: ScenarioResult; base: ScenarioResult; high: ScenarioResult };

/** One-variable-at-a-time sensitivity using illustrative ranges. */
export function computeSensitivity(a: ProjectAnalysis): SensitivityRow[] {
  const base = computeScenario(a);
  return [
    {
      label: "Yield / output (−20% · base · +10%)",
      low: computeScenario(a, { ...ZERO_ADJ, yieldPct: -20 }),
      base,
      high: computeScenario(a, { ...ZERO_ADJ, yieldPct: 10 }),
    },
    {
      label: "Selling price (−15% · base · +10%)",
      low: computeScenario(a, { ...ZERO_ADJ, pricePct: -15 }),
      base,
      high: computeScenario(a, { ...ZERO_ADJ, pricePct: 10 }),
    },
    {
      label: "Input costs (+20% · base · −10%)",
      low: computeScenario(a, { ...ZERO_ADJ, costPct: 20 }),
      base,
      high: computeScenario(a, { ...ZERO_ADJ, costPct: -10 }),
    },
    {
      label: "Production loss (+10 pts · base · −3 pts)",
      low: computeScenario(a, { ...ZERO_ADJ, extraLossPts: 10 }),
      base,
      high: computeScenario(a, { ...ZERO_ADJ, extraLossPts: -3 }),
    },
  ];
}

export function fundingProgress(f: { target: number; raised: number } | null): number | null {
  if (!f || !(f.target > 0)) return null;
  return clamp(Math.round((f.raised / f.target) * 1000) / 10, 0, 100);
}

export function costBreakdown(a: ProjectAnalysis) {
  const opex = a.costs.filter((c) => c.kind === "opex").reduce((s, c) => s + c.amount, 0);
  const capex = a.costs.filter((c) => c.kind === "capex").reduce((s, c) => s + c.amount, 0);
  return { opex: round2(opex), capex: round2(capex), total: round2(opex + capex) };
}
