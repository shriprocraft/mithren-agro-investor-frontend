import type {
  CashEntry,
  DemoDocument,
  DemoState,
  ExitEligibility,
  ExitRequest,
  MockInvestment,
  MockTransaction,
  Notification,
  ReconEntry,
  TxEvent,
  ValuationPoint,
  WithdrawalRequest,
  AuditEvent,
} from "@/types";
import { SEED_PROJECTS } from "./projects";
import { SEED_USERS } from "./users";

/** Bump when seed/state shape changes so stale localStorage is discarded. */
export const STATE_VERSION = 3;

const both: ExitEligibility = { canRequestExit: true, canRequestPartialExit: true, canRequestFullExit: true };
const fullOnly: ExitEligibility = { canRequestExit: true, canRequestPartialExit: false, canRequestFullExit: true };
const locked: ExitEligibility = {
  canRequestExit: false, canRequestPartialExit: false, canRequestFullExit: false,
  reason: "Demo fixture: this position is in a lock-in until the harvest window. Real exit rules are a pending business decision.",
};

const inv = (
  n: number, projectId: string, orig: number, cur: number, purchasedAt: string,
  elig: ExitEligibility, status: MockInvestment["status"] = "active_demo",
): MockInvestment => ({
  id: `DEMO-INV-${String(n).padStart(4, "0")}`, userId: "inv-1", projectId, originalAmount: orig,
  currentEstimatedValue: cur, currency: "INR", purchasedAt, status, valuationAsOf: "2026-10-24", exitEligibility: elig,
});

const investments: MockInvestment[] = [
  inv(1, "p-1", 5000, 5320, "2026-07-20T11:00:00+05:30", both),
  inv(2, "p-2", 1125, 1200, "2026-08-05T11:00:00+05:30", both, "partially_exited_demo"),
  inv(3, "p-4", 10000, 9400, "2026-06-25T11:00:00+05:30", locked),
  inv(4, "p-3", 3000, 3180, "2026-09-02T11:00:00+05:30", both),
  inv(5, "p-6", 1500, 1380, "2026-05-12T11:00:00+05:30", fullOnly),
];

const vp = (date: string, value: number, note?: string): ValuationPoint => ({ date, value, note });
const valuations: Record<string, ValuationPoint[]> = {
  "DEMO-INV-0001": [vp("2026-07-20", 5000, "Purchase (demo)"), vp("2026-08-31", 5080), vp("2026-09-30", 5210, "Transplant milestone reached"), vp("2026-10-24", 5320)],
  "DEMO-INV-0002": [vp("2026-08-05", 2250, "Purchase (demo)"), vp("2026-08-31", 2290), vp("2026-09-12", 1200, "Position halved after partial exit settlement"), vp("2026-09-30", 1215), vp("2026-10-24", 1200)],
  "DEMO-INV-0003": [vp("2026-06-25", 10000, "Purchase (demo)"), vp("2026-07-31", 9900), vp("2026-08-31", 9700), vp("2026-09-30", 9550, "Sample revaluation after wind-damage report"), vp("2026-10-24", 9400)],
  "DEMO-INV-0004": [vp("2026-09-02", 3000, "Purchase (demo)"), vp("2026-09-30", 3090), vp("2026-10-24", 3180)],
  "DEMO-INV-0005": [vp("2026-05-12", 1500, "Purchase (demo)"), vp("2026-06-30", 1470), vp("2026-08-31", 1410), vp("2026-10-24", 1380, "Project completed; self-reported actuals below plan")],
};

const ev = (status: TxEvent["status"], at: string, note: string): TxEvent => ({ status, at, note });

const tx = (
  n: number, type: MockTransaction["type"], status: MockTransaction["status"], amount: number,
  createdAt: string, extra: Partial<MockTransaction>,
): MockTransaction => ({
  id: `DEMO-TX-${String(n).padStart(4, "0")}`, userId: "inv-1", type, status, amount, fee: 0, createdAt,
  events: [ev("confirmed_demo", createdAt, "Created")], ...extra,
});

const transactions: MockTransaction[] = [
  tx(1, "investment", "confirmed_demo", 5000, "2026-07-20T11:00:00+05:30", { projectId: "p-1", investmentId: "DEMO-INV-0001", events: [ev("confirmed_demo", "2026-07-20T11:00:00+05:30", "Simulated commitment confirmed. No real payment.")] }),
  tx(2, "investment", "confirmed_demo", 2250, "2026-08-05T11:00:00+05:30", { projectId: "p-2", investmentId: "DEMO-INV-0002", events: [ev("confirmed_demo", "2026-08-05T11:00:00+05:30", "Simulated commitment confirmed. No real payment.")] }),
  tx(3, "investment", "confirmed_demo", 10000, "2026-06-25T11:00:00+05:30", { projectId: "p-4", investmentId: "DEMO-INV-0003", events: [ev("confirmed_demo", "2026-06-25T11:00:00+05:30", "Simulated commitment confirmed. No real payment.")] }),
  tx(4, "investment", "confirmed_demo", 3000, "2026-09-02T11:00:00+05:30", { projectId: "p-3", investmentId: "DEMO-INV-0004", events: [ev("confirmed_demo", "2026-09-02T11:00:00+05:30", "Simulated commitment confirmed. No real payment.")] }),
  tx(5, "investment", "confirmed_demo", 1500, "2026-05-12T11:00:00+05:30", { projectId: "p-6", investmentId: "DEMO-INV-0005", events: [ev("confirmed_demo", "2026-05-12T11:00:00+05:30", "Simulated commitment confirmed. No real payment.")] }),
  tx(6, "exit", "settled_demo", 1200, "2026-09-05T10:00:00+05:30", {
    fee: 6, projectId: "p-2", investmentId: "DEMO-INV-0002", refId: "DEMO-EX-0002",
    events: [
      ev("submitted_demo", "2026-09-05T10:00:00+05:30", "Partial exit request submitted (demo)"),
      ev("under_review_demo", "2026-09-06T10:00:00+05:30", "Picked up for review"),
      ev("approved_demo", "2026-09-08T10:00:00+05:30", "Approved (demo)"),
      ev("settlement_pending_demo", "2026-09-09T10:00:00+05:30", "Settlement pending (demo)"),
      ev("settled_demo", "2026-09-12T10:00:00+05:30", "Settled (demo). Net proceeds added to demo cash once."),
    ],
  }),
  tx(7, "exit", "under_review_demo", 1000, "2026-10-21T10:00:00+05:30", {
    fee: 5, projectId: "p-3", investmentId: "DEMO-INV-0004", refId: "DEMO-EX-0001",
    events: [
      ev("submitted_demo", "2026-10-21T10:00:00+05:30", "Partial exit request submitted (demo)"),
      ev("under_review_demo", "2026-10-22T09:30:00+05:30", "Picked up for review"),
    ],
  }),
  tx(8, "withdrawal", "paid_demo", 2000, "2026-09-20T10:00:00+05:30", {
    refId: "DEMO-WD-0001",
    events: [
      ev("submitted_demo", "2026-09-20T10:00:00+05:30", "Withdrawal requested (demo)"),
      ev("under_review_demo", "2026-09-21T10:00:00+05:30", "Under review"),
      ev("approved_demo", "2026-09-22T10:00:00+05:30", "Approved (demo)"),
      ev("processing_demo", "2026-09-22T15:00:00+05:30", "Processing (demo)"),
      ev("paid_demo", "2026-09-23T10:00:00+05:30", "Paid (demo). No real transfer occurred."),
    ],
  }),
  tx(9, "withdrawal", "under_review_demo", 1500, "2026-10-22T10:00:00+05:30", {
    refId: "DEMO-WD-0002",
    events: [
      ev("submitted_demo", "2026-10-22T10:00:00+05:30", "Withdrawal requested (demo)"),
      ev("under_review_demo", "2026-10-23T10:00:00+05:30", "Under review"),
    ],
  }),
];

const exits: ExitRequest[] = [
  { id: "DEMO-EX-0001", userId: "inv-1", investmentId: "DEMO-INV-0004", projectId: "p-3", kind: "partial", requestedValue: 1000, costBasisReleased: 943.4, fee: 5, netProceeds: 995, status: "under_review_demo", createdAt: "2026-10-21T10:00:00+05:30", txId: "DEMO-TX-0007" },
  { id: "DEMO-EX-0002", userId: "inv-1", investmentId: "DEMO-INV-0002", projectId: "p-2", kind: "partial", requestedValue: 1200, costBasisReleased: 1125, fee: 6, netProceeds: 1194, status: "settled_demo", createdAt: "2026-09-05T10:00:00+05:30", txId: "DEMO-TX-0006" },
];

const withdrawals: WithdrawalRequest[] = [
  { id: "DEMO-WD-0001", userId: "inv-1", amount: 2000, maskedDestination: "XXXX 4821 · Demo Bank", status: "paid_demo", createdAt: "2026-09-20T10:00:00+05:30", txId: "DEMO-TX-0008" },
  { id: "DEMO-WD-0002", userId: "inv-1", amount: 1500, maskedDestination: "XXXX 4821 · Demo Bank", status: "under_review_demo", createdAt: "2026-10-22T10:00:00+05:30", txId: "DEMO-TX-0009" },
];

const cash: CashEntry[] = [
  { id: "DEMO-CS-0001", userId: "inv-1", kind: "demo_opening_balance", availableDelta: 10000, at: "2026-08-01T09:00:00+05:30", note: "Demo seed balance (fictional)" },
  { id: "DEMO-CS-0002", userId: "inv-1", kind: "exit_settlement", availableDelta: 1194, refId: "DEMO-EX-0002", at: "2026-09-12T10:00:00+05:30", note: "Settled exit proceeds (demo)" },
  { id: "DEMO-CS-0003", userId: "inv-1", kind: "withdrawal_hold", availableDelta: -2000, refId: "DEMO-WD-0001", at: "2026-09-20T10:00:00+05:30", note: "Withdrawal requested — amount reserved" },
  { id: "DEMO-CS-0004", userId: "inv-1", kind: "withdrawal_paid", availableDelta: 0, refId: "DEMO-WD-0001", at: "2026-09-23T10:00:00+05:30", note: "Withdrawal marked paid (demo) — reserve consumed" },
  { id: "DEMO-CS-0005", userId: "inv-1", kind: "withdrawal_hold", availableDelta: -1500, refId: "DEMO-WD-0002", at: "2026-10-22T10:00:00+05:30", note: "Withdrawal requested — amount reserved" },
];

const doc = (
  id: string, userId: string | null, title: string, category: DemoDocument["category"], date: string,
  projectId?: string, available = true,
): DemoDocument => ({ id, userId, title, category, date, projectId, available });

const documents: DemoDocument[] = [
  doc("DOC-1", null, "Risk disclosure (demo placeholder)", "disclosure", "2026-01-01T00:00:00+05:30"),
  doc("DOC-2", null, "Fees and charges (illustrative)", "disclosure", "2026-01-01T00:00:00+05:30"),
  doc("DOC-3", "inv-1", "Sample participation summary — Tomato Polyhouse", "agreement", "2026-07-20T11:00:00+05:30", "p-1"),
  doc("DOC-4", "inv-1", "Sample participation summary — Millet & Pulse", "agreement", "2026-08-05T11:00:00+05:30", "p-2"),
  doc("DOC-5", "inv-1", "Demo receipt DEMO-TX-0001", "receipt", "2026-07-20T11:00:00+05:30", "p-1"),
  doc("DOC-6", "inv-1", "Demo receipt DEMO-TX-0004", "receipt", "2026-09-02T11:00:00+05:30", "p-3"),
  doc("DOC-7", "inv-1", "Demo statement — Q3 2026", "statement", "2026-10-01T00:00:00+05:30", undefined, false),
  doc("DOC-8", "inv-1", "Sample participation summary — Banana Orchard", "agreement", "2026-06-25T11:00:00+05:30", "p-4", false),
];

const note = (id: number, kind: string, title: string, body: string, at: string, read: boolean, href?: string): Notification => ({
  id: `NT-${id}`, userId: "inv-1", kind, title, body, at, read, href,
});

const notifications: Notification[] = [
  note(1, "milestone", "Milestone update: Transplant complete", "Terrace Tomato Polyhouse reported its transplant milestone (demo content).", "2026-10-20T11:30:00+05:30", false, "/projects/p-1"),
  note(2, "exit", "Exit request under review (demo)", "DEMO-EX-0001 is now under review.", "2026-10-22T09:30:00+05:30", false, "/investor/transactions/DEMO-TX-0007"),
  note(3, "withdrawal", "Withdrawal under review (demo)", "DEMO-WD-0002 is under review. No real transfer will occur.", "2026-10-23T10:00:00+05:30", false, "/investor/transactions/DEMO-TX-0009"),
  note(4, "valuation", "Valuation history updated", "Sample estimated values were refreshed on 24 Oct 2026.", "2026-10-24T09:00:00+05:30", true, "/investor/portfolio"),
  note(5, "investment", "Demo investment confirmed", "DEMO-INV-0004 was recorded in the simulation.", "2026-09-02T11:00:00+05:30", true, "/investor/portfolio/DEMO-INV-0004"),
  note(6, "onboarding", "Onboarding complete (demo)", "Your demo verification was approved.", "2026-05-03T10:00:00+05:30", true, "/investor/verification"),
];

const au = (n: number, at: string, actor: string, action: string, entity: string, ref: string): AuditEvent => ({
  id: `AUD-${String(n).padStart(4, "0")}`, at, actor, action, entity, ref,
});

const audit: AuditEvent[] = [
  au(1, "2026-10-24T10:00:00+05:30", "Kavita Iyer (admin)", "Project submission received", "Project", "p-8"),
  au(2, "2026-10-22T09:30:00+05:30", "Kavita Iyer (admin)", "Exit moved to under review", "Exit", "DEMO-EX-0001"),
  au(3, "2026-10-22T10:00:00+05:30", "Ananya Rao (investor)", "Withdrawal requested", "Withdrawal", "DEMO-WD-0002"),
  au(4, "2026-09-20T15:00:00+05:30", "Kavita Iyer (admin)", "Project rejected (demo)", "Project", "p-10"),
  au(5, "2026-09-12T10:00:00+05:30", "System (demo)", "Exit settled; proceeds credited once", "Exit", "DEMO-EX-0002"),
  au(6, "2026-09-02T11:00:00+05:30", "Ananya Rao (investor)", "Demo investment confirmed", "Investment", "DEMO-INV-0004"),
];

const rc = (n: number, txId: string, internal: number, provider: number | null, status: ReconEntry["status"], note: string): ReconEntry => ({
  id: `REC-${String(n).padStart(4, "0")}`, txId, ref: `PRV-DEMO-${String(n).padStart(4, "0")}`, internalAmount: internal, providerAmount: provider, status, note,
});

const recon: ReconEntry[] = [
  rc(1, "DEMO-TX-0001", 5000, 5000, "matched", "Matches demo provider record"),
  rc(2, "DEMO-TX-0006", 1200, 1200, "matched", "Matches demo provider record"),
  rc(3, "DEMO-TX-0008", 2000, 2000, "matched", "Matches demo provider record"),
  rc(4, "DEMO-TX-0003", 10000, null, "exception", "Demo provider reference missing — needs investigation"),
  rc(5, "DEMO-TX-0007", 1000, null, "unmatched", "Pending: not yet settled"),
];

export function createSeedState(): DemoState {
  return {
    version: STATE_VERSION,
    seq: 100,
    users: structuredClone(SEED_USERS),
    projects: structuredClone(SEED_PROJECTS),
    investments: structuredClone(investments),
    valuations: structuredClone(valuations),
    transactions: structuredClone(transactions),
    exits: structuredClone(exits),
    withdrawals: structuredClone(withdrawals),
    cash: structuredClone(cash),
    documents: structuredClone(documents),
    notifications: structuredClone(notifications),
    audit: structuredClone(audit),
    recon: structuredClone(recon),
    tickets: [],
    watchlist: { "inv-1": ["p-5", "p-2"] },
  };
}
