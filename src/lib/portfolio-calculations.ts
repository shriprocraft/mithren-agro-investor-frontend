import type {
  CashEntry,
  ExitRequest,
  MockInvestment,
  ValuationPoint,
  WithdrawalRequest,
} from "@/types";

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** gainLoss = currentEstimatedValue − originalAmount (configurable demo illustration). */
export function gainLoss(currentEstimatedValue: number, originalAmount: number): number {
  const v = currentEstimatedValue - originalAmount;
  return Number.isFinite(v) ? round2(v) : 0;
}

export function gainLossPercent(currentEstimatedValue: number, originalAmount: number): number | null {
  if (!(originalAmount > 0) || !Number.isFinite(currentEstimatedValue)) return null;
  return round2((gainLoss(currentEstimatedValue, originalAmount) / originalAmount) * 100);
}

const ACTIVE = (i: MockInvestment) => i.status !== "exited_demo";

export function portfolioSummary(investments: MockInvestment[]) {
  const open = investments.filter(ACTIVE);
  const invested = round2(open.reduce((s, i) => s + i.originalAmount, 0));
  const value = round2(open.reduce((s, i) => s + i.currentEstimatedValue, 0));
  return {
    activeCount: open.length,
    invested,
    value,
    gain: gainLoss(value, invested),
    gainPct: gainLossPercent(value, invested),
  };
}

const OPEN_EXIT = new Set(["submitted_demo", "under_review_demo", "approved_demo", "settlement_pending_demo", "draft"]);
const OPEN_WD = new Set(["submitted_demo", "under_review_demo", "approved_demo", "processing_demo", "draft"]);

export const isOpenExit = (e: ExitRequest) => OPEN_EXIT.has(e.status);
export const isOpenWithdrawal = (w: WithdrawalRequest) => OPEN_WD.has(w.status);

/** Settled available cash comes ONLY from the cash ledger. */
export function cashSummary(
  userId: string,
  cash: CashEntry[],
  exits: ExitRequest[],
  withdrawals: WithdrawalRequest[],
) {
  const available = round2(cash.filter((c) => c.userId === userId).reduce((s, c) => s + c.availableDelta, 0));
  const pendingProceeds = round2(
    exits.filter((e) => e.userId === userId && isOpenExit(e)).reduce((s, e) => s + e.netProceeds, 0),
  );
  const pendingWithdrawals = round2(
    withdrawals.filter((w) => w.userId === userId && isOpenWithdrawal(w)).reduce((s, w) => s + w.amount, 0),
  );
  return { available, pendingProceeds, pendingWithdrawals };
}

/** Sum of each investment's latest valuation at each date (carry-forward). */
export function aggregateHistory(
  investmentIds: string[],
  valuations: Record<string, ValuationPoint[]>,
): ValuationPoint[] {
  const dates = new Set<string>();
  investmentIds.forEach((id) => (valuations[id] ?? []).forEach((p) => dates.add(p.date)));
  return [...dates]
    .sort()
    .map((date) => {
      let total = 0;
      for (const id of investmentIds) {
        const pts = (valuations[id] ?? []).filter((p) => p.date <= date);
        if (pts.length) total += pts[pts.length - 1].value;
      }
      return { date, value: round2(total) };
    });
}

export function exitPreview(inv: MockInvestment, requestedValue: number, feePct: number) {
  const fee = round2(requestedValue * (feePct / 100));
  const fraction = inv.currentEstimatedValue > 0 ? requestedValue / inv.currentEstimatedValue : 0;
  return {
    fee,
    netProceeds: round2(requestedValue - fee),
    costBasisReleased: round2(inv.originalAmount * fraction),
    remainingValue: round2(inv.currentEstimatedValue - requestedValue),
    remainingOriginal: round2(inv.originalAmount - inv.originalAmount * fraction),
  };
}
