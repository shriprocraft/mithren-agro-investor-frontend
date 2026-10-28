import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import {
  allocation, averageInvestment, bestWorst, cashFlow, completedWithdrawals, fundingContribution, monthlyActivity,
  nearingMaturity, pendingInvestmentRequests, portfolioGrowth, rangeStart, realisedReturns, totalReturn,
} from "@/lib/dashboard-calculations";
import { aggregateHistory, cashSummary, portfolioSummary } from "@/lib/portfolio-calculations";

const s = createSeedState();
const mine = s.investments.filter((i) => i.userId === "inv-1");
const exits = s.exits.filter((e) => e.userId === "inv-1");
const wds = s.withdrawals.filter((w) => w.userId === "inv-1");
const txs = s.transactions.filter((t) => t.userId === "inv-1");
const cash = s.cash.filter((c) => c.userId === "inv-1");
const open = mine.filter((i) => i.status !== "exited_demo");
const history = aggregateHistory(open.map((i) => i.id), s.valuations);
const NOW = new Date("2026-10-28T10:00:00+05:30");

describe("dashboard calculations (seed data)", () => {
  it("counts only settled exits as realised, net of fee", () => {
    const r = realisedReturns(exits);
    expect(r.count).toBe(1); // DEMO-EX-0001 is still under review
    expect(r.amount).toBe(69); // 1194 − 1125
  });

  it("total return = realised + unrealised and does not double count", () => {
    const t = totalReturn(mine, exits);
    expect(t.unrealised).toBe(portfolioSummary(mine).gain);
    expect(t.amount).toBe(Math.round((t.unrealised + t.realised) * 100) / 100);
  });

  it("counts only paid withdrawals as completed", () => {
    expect(completedWithdrawals(wds)).toEqual({ amount: 2000, count: 1 });
  });

  it("keeps pending withdrawals separate from completed ones and from cash", () => {
    const c = cashSummary("inv-1", s.cash, s.exits, s.withdrawals);
    expect(c.pendingWithdrawals).toBe(1500);
    expect(c.available).toBe(10000 + 1194 - 2000 - 1500);
  });

  it("net external cash flow = deposits − completed withdrawals", () => {
    const f = cashFlow(cash, wds, null);
    expect(f.deposits).toBe(10000);
    expect(f.net).toBe(8000);
  });

  it("filters cash flow by range", () => {
    expect(cashFlow(cash, wds, rangeStart("3M", new Date("2026-10-28"))).deposits).toBe(10000); // 1 Aug is inside 3M
    expect(cashFlow(cash, wds, "2026-09-01").deposits).toBe(0);
  });

  it("reports no pending investment requests when all are confirmed", () => {
    expect(pendingInvestmentRequests(txs)).toEqual({ amount: 0, count: 0 });
  });

  it("averages open positions only", () => {
    const a = averageInvestment(mine);
    expect(a.count).toBe(open.length);
    expect(a.average).toBe(Math.round((open.reduce((x, i) => x + i.originalAmount, 0) / open.length) * 100) / 100);
  });

  it("picks best and lowest performers", () => {
    const { best, worst } = bestWorst(mine);
    expect(best!.pct).toBeGreaterThan(worst!.pct);
    expect(best!.inv.projectId).toBe("p-2"); // 1125 → 1200 (+6.67%) beats p-1 (+6.4%)
  });

  it("returns null growth with fewer than two points in range", () => {
    expect(portfolioGrowth(history, "2026-10-25")).toBeNull();
    expect(portfolioGrowth(history, null)!.to.date).toBe("2026-10-24");
  });

  it("allocation percentages share one denominator and sum to 100", () => {
    for (const by of ["project", "category", "region"] as const) {
      const a = allocation(mine, s.projects, by);
      expect(a.rows.reduce((x, r) => x + r.pct, 0)).toBeCloseTo(100, 5);
      expect(Math.round(a.rows.reduce((x, r) => x + r.value, 0) * 100) / 100).toBe(a.total);
    }
  });

  it("builds monthly series from records only", () => {
    const m = monthlyActivity("investments", { transactions: txs, cash, withdrawals: wds, history }, NOW);
    expect(m[0].key).toBe("2026-05");
    expect(m.find((x) => x.key === "2026-07")!.value).toBe(5000);
    expect(m.find((x) => x.key === "2026-10")!.value).toBe(0);
    const v = monthlyActivity("value", { transactions: txs, cash, withdrawals: wds, history }, NOW);
    expect(v.find((x) => x.key === "2026-10")!.value).toBe(history[history.length - 1].value);
  });

  it("returns no activity when there are no records", () => {
    expect(monthlyActivity("deposits", { transactions: [], cash: [], withdrawals: [], history: [] }, NOW)).toEqual([]);
  });

  it("finds positions nearing planned maturity", () => {
    const a = nearingMaturity(mine, s.projects, new Date("2026-08-20"), 30);
    expect(Array.isArray(a)).toBe(true);
    expect(nearingMaturity([], s.projects, NOW)).toEqual([]);
  });

  it("funding contribution is null-safe", () => {
    expect(fundingContribution([], s.projects).pct).toBeNull();
  });
});
