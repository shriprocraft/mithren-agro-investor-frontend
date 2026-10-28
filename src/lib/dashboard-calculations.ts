import { categoryLabel } from "@/config/demo-config";
import { gainLossPercent, portfolioSummary } from "@/lib/portfolio-calculations";
import type { CashEntry, ExitRequest, MockInvestment, MockTransaction, Project, TxStatus, ValuationPoint, WithdrawalRequest } from "@/types";

/**
 * Pure dashboard maths. Reuses portfolioSummary / gainLoss from portfolio-calculations (the existing business rules)
 * and only adds aggregation on top. Nothing here is a time-weighted or money-weighted return.
 */
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const sum = (xs: number[]) => round2(xs.reduce((s, x) => s + x, 0));
const day = (s: string) => s.slice(0, 10);

export type RangeId = "ALL" | "3M" | "6M" | "1Y";
export const RANGE_MONTHS: Record<RangeId, number | null> = { ALL: null, "3M": 3, "6M": 6, "1Y": 12 };

/** Inclusive start date (YYYY-MM-DD) of a range, or null for "all time". */
export function rangeStart(range: RangeId, now: Date): string | null {
  const m = RANGE_MONTHS[range];
  if (m === null) return null;
  const d = new Date(now);
  d.setMonth(d.getMonth() - m);
  return d.toISOString().slice(0, 10);
}
const within = (date: string, start: string | null) => start === null || day(date) >= start;

const SETTLED_EXIT: TxStatus[] = ["settled_demo", "paid_demo"];
const PENDING_TX: TxStatus[] = ["draft", "submitted_demo", "under_review_demo", "approved_demo", "processing_demo", "settlement_pending_demo"];

/** Realised result of exits that are actually settled: net proceeds − cost basis released. Pending exits excluded. */
export function realisedReturns(exits: ExitRequest[]) {
  const done = exits.filter((e) => SETTLED_EXIT.includes(e.status));
  const basis = sum(done.map((e) => e.costBasisReleased));
  const amount = round2(sum(done.map((e) => e.netProceeds)) - basis);
  return { amount, basis, pct: basis > 0 ? round2((amount / basis) * 100) : null, count: done.length };
}

/** Absolute monetary result = realised + unrealised, over total cost basis (open original + basis released by settled exits). */
export function totalReturn(investments: MockInvestment[], exits: ExitRequest[]) {
  const s = portfolioSummary(investments);
  const r = realisedReturns(exits);
  const amount = round2(s.gain + r.amount);
  const basis = round2(s.invested + r.basis);
  return { amount, basis, pct: basis > 0 ? round2((amount / basis) * 100) : null, realised: r.amount, unrealised: s.gain };
}

/** Change in estimated portfolio value across a period. It includes new money invested in the period, so it is not a return. */
export function portfolioGrowth(history: ValuationPoint[], start: string | null) {
  const pts = history.filter((p) => within(p.date, start));
  if (pts.length < 2) return null;
  const from = pts[0], to = pts[pts.length - 1];
  const change = round2(to.value - from.value);
  return { from, to, change, pct: from.value > 0 ? round2((change / from.value) * 100) : null };
}

export function completedWithdrawals(withdrawals: WithdrawalRequest[], start: string | null = null) {
  const done = withdrawals.filter((w) => w.status === "paid_demo" && within(w.createdAt, start));
  return { amount: sum(done.map((w) => w.amount)), count: done.length };
}

export function pendingInvestmentRequests(transactions: MockTransaction[]) {
  const p = transactions.filter((t) => t.type === "investment" && PENDING_TX.includes(t.status));
  return { amount: sum(p.map((t) => t.amount)), count: p.length };
}

/** Average original amount across open (not fully exited) positions. */
export function averageInvestment(investments: MockInvestment[]) {
  const open = investments.filter((i) => i.status !== "exited_demo");
  return { average: open.length ? round2(sum(open.map((i) => i.originalAmount)) / open.length) : null, count: open.length };
}

export function bestWorst(investments: MockInvestment[]) {
  const rows = investments
    .filter((i) => i.status !== "exited_demo")
    .map((i) => ({ inv: i, pct: gainLossPercent(i.currentEstimatedValue, i.originalAmount) }))
    .filter((r): r is { inv: MockInvestment; pct: number } => r.pct !== null)
    .sort((a, b) => b.pct - a.pct);
  return { best: rows[0] ?? null, worst: rows.length > 1 ? rows[rows.length - 1] : null };
}

/** Deposits come only from the cash ledger's opening-balance entries; there is no other deposit record in the app. */
export function cashFlow(entries: CashEntry[], withdrawals: WithdrawalRequest[], start: string | null) {
  const deposits = sum(entries.filter((e) => e.kind === "demo_opening_balance" && within(e.at, start)).map((e) => e.availableDelta));
  const w = completedWithdrawals(withdrawals, start);
  return { deposits, withdrawn: w.amount, withdrawnCount: w.count, net: round2(deposits - w.amount) };
}

export type AllocationBy = "project" | "category" | "region";
export function allocation(investments: MockInvestment[], projects: Project[], by: AllocationBy) {
  const open = investments.filter((i) => i.status !== "exited_demo" && i.currentEstimatedValue > 0);
  const total = sum(open.map((i) => i.currentEstimatedValue));
  const map = new Map<string, number>();
  for (const i of open) {
    const p = projects.find((x) => x.id === i.projectId);
    if (!p) continue;
    const key = by === "project" ? p.title : by === "category" ? categoryLabel(p.category) : p.region || "Unspecified";
    map.set(key, (map.get(key) ?? 0) + i.currentEstimatedValue);
  }
  return {
    total,
    rows: [...map.entries()].map(([label, value]) => ({ label, value: round2(value), pct: total > 0 ? (value / total) * 100 : 0 })).sort((a, b) => b.value - a.value),
  };
}

export type ActivityMetric = "investments" | "deposits" | "withdrawals" | "value";
const monthKey = (s: string) => s.slice(0, 7);
const monthEnd = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${key}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
};

/** Monthly series from real records, from the first month with any record to `now`, capped to the latest 12 months. */
export function monthlyActivity(
  metric: ActivityMetric,
  src: { transactions: MockTransaction[]; cash: CashEntry[]; withdrawals: WithdrawalRequest[]; history: ValuationPoint[] },
  now: Date,
) {
  const dates = [
    ...src.transactions.map((t) => day(t.createdAt)), ...src.cash.map((c) => day(c.at)),
    ...src.withdrawals.map((w) => day(w.createdAt)), ...src.history.map((h) => h.date),
  ].sort();
  if (dates.length === 0) return [];
  const last = monthKey(now.toISOString());
  const keys: string[] = [];
  let [y, m] = monthKey(dates[0]).split("-").map(Number);
  while (`${y}-${String(m).padStart(2, "0")}` <= last) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) { m = 1; y++; }
  }
  return keys.slice(-12).map((key) => {
    let value: number | null = 0;
    if (metric === "investments") value = sum(src.transactions.filter((t) => t.type === "investment" && t.status === "confirmed_demo" && monthKey(t.createdAt) === key).map((t) => t.amount));
    else if (metric === "deposits") value = sum(src.cash.filter((c) => c.kind === "demo_opening_balance" && monthKey(c.at) === key).map((c) => c.availableDelta));
    else if (metric === "withdrawals") value = sum(src.withdrawals.filter((w) => w.status === "paid_demo" && monthKey(w.createdAt) === key).map((w) => w.amount));
    else {
      const pts = src.history.filter((h) => h.date <= monthEnd(key));
      value = pts.length ? pts[pts.length - 1].value : null;
    }
    return { key, value };
  });
}

export function addMonths(iso: string, months: number): Date {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Open positions whose planned end (purchase + project duration) falls within `withinDays` of now. */
export function nearingMaturity(investments: MockInvestment[], projects: Project[], now: Date, withinDays = 30) {
  const limit = now.getTime() + withinDays * 86400000;
  return investments.filter((i) => {
    if (i.status === "exited_demo") return false;
    const p = projects.find((x) => x.id === i.projectId);
    if (!p) return false;
    const end = addMonths(i.purchasedAt, p.durationMonths).getTime();
    return end >= now.getTime() && end <= limit;
  });
}

export const ownedProjectCount = (investments: MockInvestment[]) => new Set(investments.filter((i) => i.status !== "exited_demo").map((i) => i.projectId)).size;

/** Contribution vs the combined sample funding targets of projects the investor holds. Null when no target exists. */
export function fundingContribution(investments: MockInvestment[], projects: Project[]) {
  const open = investments.filter((i) => i.status !== "exited_demo");
  const ids = [...new Set(open.map((i) => i.projectId))];
  const targets = ids.map((id) => projects.find((p) => p.id === id)?.funding?.target ?? null).filter((t): t is number => t !== null);
  const targetSum = sum(targets);
  const contributed = sum(open.filter((i) => targets.length && projects.find((p) => p.id === i.projectId)?.funding).map((i) => i.originalAmount));
  return { contributed, target: targetSum, pct: targetSum > 0 ? (contributed / targetSum) * 100 : null };
}

