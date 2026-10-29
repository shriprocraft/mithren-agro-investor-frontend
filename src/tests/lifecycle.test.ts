import { describe, expect, it } from "vitest";
import { createSeedState as createCatalogueState } from "@/data/seed";
import {
  createExitRequest, createInvestment, createWithdrawal, projectCompleteness, registerUser, reviewProject, runReconciliation,
  saveProjectDraft, submitProject, transitionExit, transitionWithdrawal, applyValuationUpdate,
} from "@/lib/mock-service";
import { canTransition, EXIT_TRANSITIONS, TERMINAL, WITHDRAWAL_TRANSITIONS } from "@/lib/mock-transitions";
import { cashSummary } from "@/lib/portfolio-calculations";
import type { DemoState, ServiceResult } from "@/types";

/**
 * The shipped catalogue is enquiry-only (no verified figures), so lifecycle tests build their own
 * fixtures: an investable funded project (p-1), a closed one (p-4), an unpublished draft (p-7) and a submission (p-8).
 */
function createSeedState(): DemoState {
  const s = createCatalogueState();
  const patch = (id: string, change: Partial<DemoState["projects"][number]>) => {
    s.projects = s.projects.map((p) => (p.id === id ? { ...p, ...change } : p));
  };
  const analysis = {
    asOf: "2026-10-02", reviewedBy: "Demo Reviewer", plannedQty: 18000, qtyUnit: "kg", lossRatePct: 8, pricePerUnit: 28, salesDeductionPct: 6,
    costs: [{ id: "c1", label: "Seedlings", amount: 42000, kind: "opex" as const, basis: "quoted" as const }], assumptions: [],
  };
  patch("p-1", { funding: { target: 360000, raised: 241000 }, analysis, demoConfig: { investable: true, minAmount: 100, maxAmount: 50000 } });
  patch("p-4", { funding: { target: 420000, raised: 420000 }, analysis, demoConfig: { investable: false, notInvestableReason: "Funding target reached (demo).", minAmount: 100, maxAmount: 50000 } });
  patch("p-7", { status: "draft", district: "", analysis: null });
  patch("p-8", { status: "submitted", district: "Erode", analysis, funding: { target: 280000, raised: 0 } });
  return s;
}

const must = <R>(r: ServiceResult<R>): { state: DemoState; data: R } => {
  if (!r.ok) throw new Error(r.error);
  return r;
};
const cash = (s: DemoState, u = "inv-1") => cashSummary(u, s.cash, s.exits, s.withdrawals);
const admin = { id: "admin-1", name: "Kavita Iyer", role: "admin" as const };

describe("transition tables", () => {
  it("terminal states have no outgoing transitions", () => {
    for (const t of TERMINAL) {
      expect(EXIT_TRANSITIONS[t]).toEqual([]);
      expect(WITHDRAWAL_TRANSITIONS[t]).toEqual([]);
    }
  });
  it("blocks skipping steps", () => {
    expect(canTransition("exit", "submitted_demo", "settled_demo")).toBe(false);
    expect(canTransition("withdrawal", "submitted_demo", "paid_demo")).toBe(false);
    expect(canTransition("exit", "settlement_pending_demo", "settled_demo")).toBe(true);
  });
});

describe("createInvestment", () => {
  const s0 = createSeedState();
  it("creates exactly one investment + one transaction for ₹100 and is idempotent", () => {
    const a = must(createInvestment(s0, { userId: "inv-2", projectId: "p-1", amount: 100, riskAcknowledged: true, clientRequestId: "REQ-1" }));
    expect(a.state.investments.filter((i) => i.userId === "inv-2")).toHaveLength(1);
    const b = must(createInvestment(a.state, { userId: "inv-2", projectId: "p-1", amount: 100, riskAcknowledged: true, clientRequestId: "REQ-1" }));
    expect(b.data).toEqual(a.data);
    expect(b.state.investments.filter((i) => i.userId === "inv-2")).toHaveLength(1);
    expect(b.state.transactions.filter((t) => t.userId === "inv-2")).toHaveLength(1);
    expect(b.state.projects.find((p) => p.id === "p-1")!.funding!.raised).toBe(241100);
  });
  it("enforces server-side style checks", () => {
    const base = { userId: "inv-2", projectId: "p-1", amount: 100, riskAcknowledged: true, clientRequestId: "X" };
    expect(createInvestment(s0, { ...base, amount: 50 }).ok).toBe(false);
    expect(createInvestment(s0, { ...base, riskAcknowledged: false }).ok).toBe(false);
    expect(createInvestment(s0, { ...base, projectId: "p-4" }).ok).toBe(false); // funding closed
    expect(createInvestment(s0, { ...base, projectId: "p-5" }).ok).toBe(false); // no analysis
    expect(createInvestment(s0, { ...base, userId: "owner-1" }).ok).toBe(false);
    expect(createInvestment(s0, { ...base, projectId: "p-7" }).ok).toBe(false); // unpublished draft
  });
});

describe("exit lifecycle", () => {
  const s0 = createSeedState();
  const open = (s: DemoState, kind: "partial" | "full" = "partial", value = 1000) =>
    must(createExitRequest(s, { userId: "inv-1", investmentId: "DEMO-INV-0001", kind, requestedValue: value }));

  it("pending exit does not touch available cash or the position", () => {
    const r = open(s0);
    expect(cash(r.state).available).toBe(cash(s0).available);
    expect(cash(r.state).pendingProceeds).toBe(995 + 995); // seeded request + new request
    expect(r.state.investments.find((i) => i.id === "DEMO-INV-0001")!.currentEstimatedValue).toBe(5320);
  });

  it("blocks duplicate exits, ineligible positions and bad amounts", () => {
    const r = open(s0);
    expect(createExitRequest(r.state, { userId: "inv-1", investmentId: "DEMO-INV-0001", kind: "partial", requestedValue: 500 }).ok).toBe(false);
    expect(createExitRequest(s0, { userId: "inv-1", investmentId: "DEMO-INV-0003", kind: "full", requestedValue: 9400 }).ok).toBe(false); // locked
    expect(createExitRequest(s0, { userId: "inv-1", investmentId: "DEMO-INV-0004", kind: "partial", requestedValue: 500 }).ok).toBe(false); // already pending
    expect(createExitRequest(s0, { userId: "inv-1", investmentId: "DEMO-INV-0005", kind: "partial", requestedValue: 500 }).ok).toBe(false); // full-only fixture
    expect(createExitRequest(s0, { userId: "inv-1", investmentId: "DEMO-INV-0001", kind: "partial", requestedValue: 99999 }).ok).toBe(false);
    expect(createExitRequest(s0, { userId: "inv-2", investmentId: "DEMO-INV-0001", kind: "full", requestedValue: 5320 }).ok).toBe(false); // someone else's
  });

  it("settles once: credits cash once and keeps a remaining position for partial exits", () => {
    let s = open(s0).state;
    const id = s.exits[0].id;
    for (const next of ["under_review_demo", "approved_demo", "settlement_pending_demo"] as const) s = must(transitionExit(s, id, next, admin)).state;
    expect(cash(s).available).toBe(7694);
    s = must(transitionExit(s, id, "settled_demo", admin)).state;
    expect(cash(s).available).toBe(7694 + 995);
    const inv = s.investments.find((i) => i.id === "DEMO-INV-0001")!;
    expect(inv.status).toBe("partially_exited_demo");
    expect(inv.currentEstimatedValue).toBe(4320);
    expect(inv.originalAmount).toBe(5000 - 939.85); // 5000 × (1000 / 5320)
    // re-settling is impossible
    expect(transitionExit(s, id, "settled_demo", admin).ok).toBe(false);
    expect(s.cash.filter((c) => c.refId === id)).toHaveLength(1);
  });

  it("full exit marks the position exited only at settlement", () => {
    let s = open(s0, "full", 5320).state;
    const id = s.exits[0].id;
    expect(s.investments.find((i) => i.id === "DEMO-INV-0001")!.status).toBe("active_demo");
    for (const next of ["under_review_demo", "approved_demo", "settlement_pending_demo", "settled_demo"] as const) s = must(transitionExit(s, id, next, admin)).state;
    const inv = s.investments.find((i) => i.id === "DEMO-INV-0001")!;
    expect(inv.status).toBe("exited_demo");
    expect(inv.currentEstimatedValue).toBe(0);
    expect(createExitRequest(s, { userId: "inv-1", investmentId: inv.id, kind: "full", requestedValue: 1 }).ok).toBe(false);
  });

  it("reject / cancel / fail leave cash and position unchanged", () => {
    for (const path of [["under_review_demo", "rejected_demo"], ["cancelled_demo"], ["under_review_demo", "approved_demo", "settlement_pending_demo", "failed_demo"]] as const) {
      let s = open(s0).state;
      const id = s.exits[0].id;
      for (const n of path) s = must(transitionExit(s, id, n, admin)).state;
      expect(cash(s).available).toBe(7694);
      expect(s.investments.find((i) => i.id === "DEMO-INV-0001")!.currentEstimatedValue).toBe(5320);
      expect(cash(s).pendingProceeds).toBe(995); // only the pre-existing seed request
    }
  });

  it("rejects invalid transitions and keeps the linked transaction in sync", () => {
    const s = open(s0).state;
    const e = s.exits[0];
    expect(transitionExit(s, e.id, "settled_demo", admin).ok).toBe(false);
    const t = must(transitionExit(s, e.id, "under_review_demo", admin)).state;
    expect(t.transactions.find((x) => x.id === e.txId)!.status).toBe("under_review_demo");
    expect(t.transactions.find((x) => x.id === e.txId)!.events.length).toBe(2);
  });
});

describe("withdrawal lifecycle", () => {
  const s0 = createSeedState();
  const req = (s: DemoState, amount: number, id = "W1") => createWithdrawal(s, { userId: "inv-1", amount, clientRequestId: id });

  it("reserves cash on submit and cannot exceed settled available", () => {
    const r = must(req(s0, 1000));
    expect(cash(r.state).available).toBe(6694);
    expect(cash(r.state).pendingWithdrawals).toBe(2500);
    expect(req(r.state, 6694.01, "W2").ok).toBe(false);
    expect(req(s0, 0, "W3").ok).toBe(false);
    expect(req(s0, -5, "W4").ok).toBe(false);
  });

  it("is idempotent per request id", () => {
    const a = must(req(s0, 1000, "SAME"));
    const b = must(req(a.state, 1000, "SAME"));
    expect(b.state.withdrawals).toHaveLength(a.state.withdrawals.length);
    expect(cash(b.state).available).toBe(6694);
  });

  it("requires a bank account", () => {
    expect(createWithdrawal(s0, { userId: "inv-2", amount: 100, clientRequestId: "Z" }).ok).toBe(false);
  });

  it("rejection / failure / cancel release the reserve exactly once", () => {
    for (const path of [["under_review_demo", "rejected_demo"], ["cancelled_demo"], ["under_review_demo", "approved_demo", "processing_demo", "failed_demo"]] as const) {
      let s = must(req(s0, 1000, "R")).state;
      const id = s.withdrawals[0].id;
      for (const n of path) s = must(transitionWithdrawal(s, id, n, admin)).state;
      expect(cash(s).available).toBe(7694);
      expect(transitionWithdrawal(s, id, "cancelled_demo", admin).ok).toBe(false);
      expect(s.cash.filter((c) => c.refId === id && c.kind === "withdrawal_release")).toHaveLength(1);
    }
  });

  it("paid consumes the reserve without changing available again", () => {
    let s = must(req(s0, 1000, "P")).state;
    const id = s.withdrawals[0].id;
    for (const n of ["under_review_demo", "approved_demo", "processing_demo", "paid_demo"] as const) s = must(transitionWithdrawal(s, id, n, admin)).state;
    expect(cash(s).available).toBe(6694);
    expect(cash(s).pendingWithdrawals).toBe(1500); // seed pending only
  });
});

describe("owner → admin project flow", () => {
  const s0 = createSeedState();
  it("incomplete drafts cannot be submitted", () => {
    const draft = s0.projects.find((p) => p.id === "p-7")!;
    expect(projectCompleteness(draft).length).toBeGreaterThan(0);
    expect(submitProject(s0, "p-7", { name: "Meera", role: "owner" }).ok).toBe(false);
  });
  it("submitted project can be reviewed; reasons are required; decisions are one-way", () => {
    const owner = { id: "owner-1", name: "Meera Patil", role: "owner" as const };
    expect(reviewProject(s0, "p-8", "reject", "", admin).ok).toBe(false);
    expect(reviewProject(s0, "p-8", "approve", "", { id: "owner-1", name: "Meera", role: "admin" }).ok).toBe(false); // own project
    const a = must(reviewProject(s0, "p-8", "approve", "Looks complete", admin)).state;
    expect(a.projects.find((p) => p.id === "p-8")!.status).toBe("approved_demo");
    expect(reviewProject(a, "p-8", "reject", "late", admin).ok).toBe(false);
    expect(saveProjectDraft(a, a.projects.find((p) => p.id === "p-8")!, owner).ok).toBe(false); // locked after approval
    expect(a.audit[0].action).toContain("Approved");
  });
  it("request changes reopens editing and keeps comment history", () => {
    const r = must(reviewProject(s0, "p-8", "request_changes", "Need buyer letter", admin)).state;
    const p = r.projects.find((x) => x.id === "p-8")!;
    expect(p.status).toBe("changes_requested");
    expect(p.reviewComments.at(-1)!.text).toBe("Need buyer letter");
    expect(saveProjectDraft(r, p, { id: "owner-1", name: "Meera", role: "owner" }).ok).toBe(true);
  });
});

describe("misc services", () => {
  it("registers users once per email", () => {
    const s0 = createSeedState();
    const a = must(registerUser(s0, { name: "Test User", email: "T@Example.com", phone: "9876543210", role: "investor" }));
    expect(a.data.verification).toBe("not_started");
    expect(registerUser(a.state, { name: "Dup", email: "t@example.com", phone: "9876543210", role: "investor" }).ok).toBe(false);
  });
  it("valuation updates stay within bounds and append history", () => {
    const s0 = createSeedState();
    expect(applyValuationUpdate(s0, 50, admin).ok).toBe(false);
    const r = must(applyValuationUpdate(s0, 10, admin));
    expect(r.data).toBe(5);
    expect(r.state.investments.find((i) => i.id === "DEMO-INV-0001")!.currentEstimatedValue).toBe(5852);
    expect(r.state.valuations["DEMO-INV-0001"].length).toBe(s0.valuations["DEMO-INV-0001"].length + 1);
  });
  it("reconciliation is idempotent", () => {
    const s0 = createSeedState();
    const a = must(runReconciliation(s0, admin));
    const b = must(runReconciliation(a.state, admin));
    expect(b.data.added).toBe(0);
    expect(a.state.recon.length).toBe(s0.transactions.length);
  });
  it("seed data is internally consistent", () => {
    const s = createSeedState();
    for (const e of s.exits) expect(s.transactions.find((t) => t.id === e.txId)?.status).toBe(e.status);
    for (const w of s.withdrawals) expect(s.transactions.find((t) => t.id === w.txId)?.status).toBe(w.status);
    for (const i of s.investments) expect(s.projects.some((p) => p.id === i.projectId)).toBe(true);
  });
});
