import type { TxStatus } from "@/types";

/** The ONLY place allowed status transitions are defined. */
export const EXIT_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  draft: ["submitted_demo", "cancelled_demo"],
  submitted_demo: ["under_review_demo", "rejected_demo", "cancelled_demo"],
  under_review_demo: ["approved_demo", "rejected_demo", "cancelled_demo"],
  approved_demo: ["settlement_pending_demo", "cancelled_demo"],
  settlement_pending_demo: ["settled_demo", "failed_demo"],
  processing_demo: [],
  settled_demo: [],
  paid_demo: [],
  confirmed_demo: [],
  rejected_demo: [],
  failed_demo: [],
  cancelled_demo: [],
};

export const WITHDRAWAL_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  draft: ["submitted_demo", "cancelled_demo"],
  submitted_demo: ["under_review_demo", "cancelled_demo"],
  under_review_demo: ["approved_demo", "rejected_demo", "cancelled_demo"],
  approved_demo: ["processing_demo", "cancelled_demo"],
  processing_demo: ["paid_demo", "failed_demo"],
  settlement_pending_demo: [],
  settled_demo: [],
  paid_demo: [],
  confirmed_demo: [],
  rejected_demo: [],
  failed_demo: [],
  cancelled_demo: [],
};

export type FlowKind = "exit" | "withdrawal";

export const transitionsFor = (kind: FlowKind) => (kind === "exit" ? EXIT_TRANSITIONS : WITHDRAWAL_TRANSITIONS);

export function canTransition(kind: FlowKind, from: TxStatus, to: TxStatus): boolean {
  return transitionsFor(kind)[from]?.includes(to) ?? false;
}

/** Statuses an investor may cancel from (before admin approval). */
export const INVESTOR_CANCELLABLE: TxStatus[] = ["submitted_demo", "under_review_demo"];

export const TERMINAL: TxStatus[] = [
  "settled_demo",
  "paid_demo",
  "confirmed_demo",
  "rejected_demo",
  "failed_demo",
  "cancelled_demo",
];

/** The "happy path" next step an admin would normally take. */
export function primaryNext(kind: FlowKind, from: TxStatus): TxStatus | null {
  return transitionsFor(kind)[from]?.find((s) => !["rejected_demo", "cancelled_demo", "failed_demo"].includes(s)) ?? null;
}
