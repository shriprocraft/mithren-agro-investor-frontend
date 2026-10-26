import { describe, expect, it } from "vitest";
import { computeScenario, computeAllScenarios, fundingProgress, totalCost, ZERO_ADJ } from "@/lib/analysis-calculations";
import { aggregateHistory, cashSummary, exitPreview, gainLoss, gainLossPercent, portfolioSummary } from "@/lib/portfolio-calculations";
import { formatINR, formatPercent, formatSignedINR, MISSING } from "@/lib/format";
import { SEED_PROJECTS } from "@/data/projects";
import { createSeedState } from "@/data/seed";
import type { ProjectAnalysis } from "@/types";

const analysis: ProjectAnalysis = {
  asOf: "2026-01-01", reviewedBy: null, plannedQty: 1000, qtyUnit: "kg", lossRatePct: 10, pricePerUnit: 50, salesDeductionPct: 10,
  costs: [
    { id: "a", label: "A", amount: 20000, kind: "opex", basis: "estimate" },
    { id: "b", label: "B", amount: 10000, kind: "capex", basis: "quoted" },
  ],
  assumptions: [],
};

describe("computeScenario", () => {
  it("matches the documented formulas for the base case", () => {
    const r = computeScenario(analysis);
    expect(r.saleableQty).toBe(900); // 1000 × (1 − 10%)
    expect(r.grossSales).toBe(45000); // 900 × 50
    expect(r.deductions).toBe(4500);
    expect(r.netSales).toBe(40500);
    expect(r.totalCost).toBe(30000);
    expect(r.surplus).toBe(10500);
    expect(r.marginPct).toBe(25.93);
    expect(r.breakEvenPrice).toBe(37.04); // 30000 / (900 × 0.9)
  });

  it("applies adjustments consistently", () => {
    const r = computeScenario(analysis, { yieldPct: -20, pricePct: -10, costPct: 10, extraLossPts: 5 });
    expect(r.lossRatePct).toBe(15);
    expect(r.saleableQty).toBe(680); // 800 × 0.85
    expect(r.price).toBe(45);
    expect(r.totalCost).toBe(33000);
    expect(r.surplus).toBe(680 * 45 * 0.9 - 33000);
  });

  it("returns nulls (never invented numbers) when price evidence is missing", () => {
    const r = computeScenario({ ...analysis, pricePerUnit: null, salesDeductionPct: null });
    expect(r.netSales).toBeNull();
    expect(r.surplus).toBeNull();
    expect(r.marginPct).toBeNull();
    expect(r.totalCost).toBe(30000);
  });

  it("is safe at boundaries", () => {
    const zero = computeScenario({ ...analysis, plannedQty: 0 });
    expect(zero.saleableQty).toBe(0);
    expect(zero.marginPct).toBeNull();
    expect(zero.breakEvenPrice).toBeNull();
    const all = computeScenario({ ...analysis, lossRatePct: 100 });
    expect(all.saleableQty).toBe(0);
    expect(Number.isFinite(all.totalCost)).toBe(true);
    expect(computeScenario(analysis, { ...ZERO_ADJ, extraLossPts: 500 }).lossRatePct).toBe(100);
    expect(totalCost({ costs: [] })).toBe(0);
  });

  it("orders downside < base < upside for every full seed analysis", () => {
    for (const p of SEED_PROJECTS) {
      if (!p.analysis || p.analysis.pricePerUnit === null) continue;
      const s = computeAllScenarios(p.analysis);
      expect(s.conservative.surplus!).toBeLessThan(s.base.surplus!);
      expect(s.base.surplus!).toBeLessThan(s.optimistic.surplus!);
    }
  });
});

describe("fundingProgress", () => {
  it("handles missing / zero / over-funded targets", () => {
    expect(fundingProgress(null)).toBeNull();
    expect(fundingProgress({ target: 0, raised: 10 })).toBeNull();
    expect(fundingProgress({ target: 200, raised: 50 })).toBe(25);
    expect(fundingProgress({ target: 100, raised: 150 })).toBe(100);
  });
});

describe("gain / loss", () => {
  it("computes amount and percent", () => {
    expect(gainLoss(5320, 5000)).toBe(320);
    expect(gainLossPercent(5320, 5000)).toBe(6.4);
    expect(gainLoss(9400, 10000)).toBe(-600);
    expect(gainLossPercent(9400, 10000)).toBe(-6);
  });
  it("never yields NaN / Infinity", () => {
    expect(gainLossPercent(100, 0)).toBeNull();
    expect(gainLossPercent(Number.NaN, 100)).toBeNull();
    expect(gainLoss(Number.NaN, 100)).toBe(0);
  });
});

describe("seed portfolio & cash reconcile", () => {
  const s = createSeedState();
  it("summarises open positions only", () => {
    const inv = s.investments.filter((i) => i.userId === "inv-1");
    const sum = portfolioSummary(inv);
    expect(sum.activeCount).toBe(5);
    expect(sum.invested).toBe(20625);
    expect(sum.value).toBe(20480);
    expect(sum.gain).toBe(-145);
  });
  it("derives cash only from the ledger; pending is separate", () => {
    const c = cashSummary("inv-1", s.cash, s.exits, s.withdrawals);
    expect(c.available).toBe(7694); // 10000 + 1194 − 2000 − 1500
    expect(c.pendingProceeds).toBe(995);
    expect(c.pendingWithdrawals).toBe(1500);
    expect(cashSummary("inv-2", s.cash, s.exits, s.withdrawals)).toEqual({ available: 0, pendingProceeds: 0, pendingWithdrawals: 0 });
  });
  it("aggregates history with carry-forward", () => {
    const h = aggregateHistory(["a", "b"], { a: [{ date: "2026-01-01", value: 100 }, { date: "2026-03-01", value: 120 }], b: [{ date: "2026-02-01", value: 50 }] });
    expect(h.map((p) => p.value)).toEqual([100, 150, 170]);
  });
  it("previews partial exits proportionally", () => {
    const inv = s.investments.find((i) => i.id === "DEMO-INV-0001")!;
    const p = exitPreview(inv, 2660, 0.5);
    expect(p.fee).toBe(13.3);
    expect(p.netProceeds).toBe(2646.7);
    expect(p.costBasisReleased).toBe(2500);
    expect(p.remainingValue).toBe(2660);
  });
});

describe("formatting", () => {
  it("uses Indian grouping and explicit signs", () => {
    expect(formatINR(100000).replace(/\s/g, "")).toBe("₹1,00,000");
    expect(formatINR(1234.5).replace(/\s/g, "")).toBe("₹1,234.50");
    expect(formatSignedINR(-600).replace(/\s/g, "")).toBe("−₹600");
    expect(formatSignedINR(320)).toContain("+");
    expect(formatPercent(-6, 1, true)).toBe("−6.0%");
  });
  it("renders missing values explicitly", () => {
    expect(formatINR(null)).toBe(MISSING);
    expect(formatINR(undefined)).toBe(MISSING);
    expect(formatINR(Number.NaN)).toBe(MISSING);
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe(MISSING);
  });
});
