import { DEMO_CONFIG } from "@/config/demo-config";
import { checklistFor } from "@/data/users";
import type {
  BankDetails,
  DemoState,
  DemoUser,
  ExitRequest,
  MockInvestment,
  MockTransaction,
  Project,
  ProjectStatus,
  Role,
  ServiceResult,
  TxEvent,
  TxStatus,
  VerificationStatus,
  WithdrawalRequest,
} from "@/types";
import { canTransition } from "./mock-transitions";
import { cashSummary, exitPreview, isOpenExit } from "./portfolio-calculations";
import { validateExitAmount, validateInvestmentAmount, validateWithdrawalAmount } from "./validation";

/**
 * Frontend-only "service layer". Every function is pure: (state, input) → new state.
 * Replace the bodies with API calls later; keep the signatures and result shape.
 */

export type Actor = { id?: string; name: string; role: Role | "system" };
const SYSTEM: Actor = { name: "System (demo)", role: "system" };

const nowIso = () => new Date().toISOString();
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const pad = (n: number) => String(n).padStart(4, "0");

const ok = <R>(state: DemoState, data: R): ServiceResult<R> => ({ ok: true, state, data });
const fail = (error: string): ServiceResult<never> => ({ ok: false, error });

function mint(state: DemoState, prefix: string): { state: DemoState; id: string } {
  const seq = state.seq + 1;
  return { state: { ...state, seq }, id: `${prefix}-${pad(seq)}` };
}

function addAudit(state: DemoState, actor: Actor, action: string, entity: string, ref: string): DemoState {
  const m = mint(state, "AUD");
  return {
    ...m.state,
    audit: [{ id: m.id, at: nowIso(), actor: `${actor.name}${actor.role === "system" ? "" : ` (${actor.role})`}`, action, entity, ref }, ...state.audit],
  };
}

function addNotification(state: DemoState, userId: string, kind: string, title: string, body: string, href?: string): DemoState {
  const m = mint(state, "NT");
  return { ...m.state, notifications: [{ id: m.id, userId, kind, title, body, at: nowIso(), read: false, href }, ...state.notifications] };
}

const event = (status: TxStatus, note: string): TxEvent => ({ status, at: nowIso(), note });

/* ===================== Investments ===================== */

export function createInvestment(
  state: DemoState,
  input: { userId: string; projectId: string; amount: number; riskAcknowledged: boolean; clientRequestId: string },
): ServiceResult<{ investmentId: string; txId: string }> {
  // Idempotency: a repeated request id never creates a second record.
  const dup = state.transactions.find((t) => t.idempotencyKey === input.clientRequestId);
  if (dup && dup.investmentId) return ok(state, { investmentId: dup.investmentId, txId: dup.id });

  const user = state.users.find((u) => u.id === input.userId);
  if (!user || user.role !== "investor") return fail("Only investor accounts can simulate an investment.");
  const project = state.projects.find((p) => p.id === input.projectId);
  if (!project) return fail("Project not found.");
  if (!project.demoConfig.investable || !["approved_demo", "active_demo"].includes(project.status))
    return fail(project.demoConfig.notInvestableReason ?? "This project is not open for demo investment.");
  if (!input.riskAcknowledged) return fail("Please acknowledge the risk and demo terms.");

  const remaining = project.funding ? round2(project.funding.target - project.funding.raised) : null;
  const v = validateInvestmentAmount(String(input.amount), {
    min: project.demoConfig.minAmount,
    max: project.demoConfig.maxAmount,
    remainingAllocation: remaining,
  });
  if (!v.ok) return fail(v.error);

  let s = state;
  const mInv = mint(s, "DEMO-INV"); s = mInv.state;
  const mTx = mint(s, "DEMO-TX"); s = mTx.state;
  const mDoc = mint(s, "DOC"); s = mDoc.state;
  const at = nowIso();
  const date = at.slice(0, 10);
  const investment: MockInvestment = {
    id: mInv.id, userId: input.userId, projectId: project.id, originalAmount: v.value, currentEstimatedValue: v.value,
    currency: "INR", purchasedAt: at, status: "active_demo", valuationAsOf: date,
    exitEligibility: { canRequestExit: true, canRequestPartialExit: true, canRequestFullExit: true },
  };
  const t: MockTransaction = {
    id: mTx.id, userId: input.userId, type: "investment", status: "confirmed_demo", amount: v.value, fee: 0,
    projectId: project.id, investmentId: mInv.id, createdAt: at, idempotencyKey: input.clientRequestId,
    events: [event("confirmed_demo", "Simulated commitment confirmed. No real payment was made.")],
  };
  const newRaised = project.funding ? round2(project.funding.raised + v.value) : null;
  const closes = project.funding && newRaised !== null && newRaised >= project.funding.target;
  s = {
    ...s,
    investments: [investment, ...s.investments],
    valuations: { ...s.valuations, [mInv.id]: [{ date, value: v.value, note: "Purchase (demo)" }] },
    transactions: [t, ...s.transactions],
    documents: [{ id: mDoc.id, userId: input.userId, title: `Demo receipt ${mTx.id}`, category: "receipt", date: at, projectId: project.id, available: true }, ...s.documents],
    projects: s.projects.map((p) =>
      p.id !== project.id || !p.funding
        ? p
        : {
            ...p,
            funding: { ...p.funding, raised: newRaised! },
            demoConfig: closes ? { ...p.demoConfig, investable: false, notInvestableReason: "Funding target reached (demo)." } : p.demoConfig,
          },
    ),
  };
  s = addNotification(s, input.userId, "investment", "Demo investment confirmed", `${mInv.id} was recorded in the simulation. No real money moved.`, `/investor/portfolio/${mInv.id}`);
  s = addAudit(s, { name: user.name, role: "investor" }, "Demo investment confirmed", "Investment", mInv.id);
  return ok(s, { investmentId: mInv.id, txId: mTx.id });
}

/* ===================== Exits ===================== */

export function createExitRequest(
  state: DemoState,
  input: { userId: string; investmentId: string; kind: "partial" | "full"; requestedValue: number },
): ServiceResult<{ exitId: string; txId: string }> {
  const inv = state.investments.find((i) => i.id === input.investmentId && i.userId === input.userId);
  if (!inv) return fail("Investment not found.");
  if (inv.status === "exited_demo") return fail("This position has already been exited.");
  const el = inv.exitEligibility;
  if (!el.canRequestExit) return fail(el.reason ?? "This position is not eligible for a simulated exit.");
  if (state.exits.some((e) => e.investmentId === inv.id && isOpenExit(e)))
    return fail("An exit request is already in progress for this position.");

  const v = validateExitAmount(String(input.requestedValue), {
    currentValue: inv.currentEstimatedValue, allowPartial: el.canRequestPartialExit, allowFull: el.canRequestFullExit, kind: input.kind,
  });
  if (!v.ok) return fail(v.error);

  const p = exitPreview(inv, v.value, DEMO_CONFIG.exitFeePct);
  let s = state;
  const mEx = mint(s, "DEMO-EX"); s = mEx.state;
  const mTx = mint(s, "DEMO-TX"); s = mTx.state;
  const at = nowIso();
  const exit: ExitRequest = {
    id: mEx.id, userId: input.userId, investmentId: inv.id, projectId: inv.projectId, kind: input.kind, requestedValue: v.value,
    costBasisReleased: input.kind === "full" ? inv.originalAmount : p.costBasisReleased, fee: p.fee,
    netProceeds: p.netProceeds, status: "submitted_demo", createdAt: at, txId: mTx.id,
  };
  const t: MockTransaction = {
    id: mTx.id, userId: input.userId, type: "exit", status: "submitted_demo", amount: v.value, fee: p.fee,
    projectId: inv.projectId, investmentId: inv.id, refId: mEx.id, createdAt: at,
    events: [event("submitted_demo", `${input.kind === "full" ? "Full" : "Partial"} exit request submitted (demo). Simulated quote, not a binding offer.`)],
  };
  s = { ...s, exits: [exit, ...s.exits], transactions: [t, ...s.transactions] };
  const user = state.users.find((u) => u.id === input.userId);
  s = addNotification(s, input.userId, "exit", "Exit request submitted (demo)", `${mEx.id} is awaiting review. Proceeds are not available cash yet.`, `/investor/transactions/${mTx.id}`);
  s = addAudit(s, { name: user?.name ?? input.userId, role: "investor" }, "Exit requested", "Exit", mEx.id);
  return ok(s, { exitId: mEx.id, txId: mTx.id });
}

function patchTx(state: DemoState, txId: string, status: TxStatus, note: string): DemoState {
  return {
    ...state,
    transactions: state.transactions.map((t) => (t.id === txId ? { ...t, status, events: [...t.events, event(status, note)] } : t)),
  };
}

export function transitionExit(state: DemoState, exitId: string, next: TxStatus, actor: Actor = SYSTEM, reason?: string): ServiceResult<ExitRequest> {
  const ex = state.exits.find((e) => e.id === exitId);
  if (!ex) return fail("Exit request not found.");
  if (!canTransition("exit", ex.status, next)) return fail(`Invalid transition: ${ex.status} → ${next}.`);

  let s = state;
  const note = reason ? `${next.replace(/_/g, " ")} — ${reason}` : `Moved to ${next.replace(/_/g, " ")}`;

  if (next === "settled_demo") {
    const inv = s.investments.find((i) => i.id === ex.investmentId);
    if (!inv) return fail("Related investment not found.");
    if (ex.kind === "partial" && ex.requestedValue >= inv.currentEstimatedValue)
      return fail("Position value changed since the request; mark this exit as failed (demo).");
    const date = nowIso().slice(0, 10);
    const full = ex.kind === "full";
    const newValue = full ? 0 : round2(inv.currentEstimatedValue - ex.requestedValue);
    const updated: MockInvestment = {
      ...inv,
      originalAmount: full ? inv.originalAmount : round2(inv.originalAmount - ex.costBasisReleased),
      currentEstimatedValue: newValue,
      status: full ? "exited_demo" : "partially_exited_demo",
      valuationAsOf: date,
      exitEligibility: full ? { canRequestExit: false, canRequestPartialExit: false, canRequestFullExit: false, reason: "Position exited (demo)." } : inv.exitEligibility,
    };
    const m = mint(s, "DEMO-CS"); s = m.state;
    s = {
      ...s,
      investments: s.investments.map((i) => (i.id === inv.id ? updated : i)),
      valuations: { ...s.valuations, [inv.id]: [...(s.valuations[inv.id] ?? []), { date, value: newValue, note: full ? "Position exited (demo)" : "Partial exit settled (demo)" }] },
      cash: [...s.cash, { id: m.id, userId: ex.userId, kind: "exit_settlement", availableDelta: ex.netProceeds, refId: ex.id, at: nowIso(), note: "Settled exit proceeds (demo)" }],
    };
    s = addNotification(s, ex.userId, "exit", "Exit settled (demo)", `${ex.id}: net proceeds added to your demo available cash.`, `/investor/cash`);
  } else if (["rejected_demo", "cancelled_demo", "failed_demo"].includes(next)) {
    s = addNotification(s, ex.userId, "exit", `Exit ${next.replace("_demo", "").replace(/_/g, " ")} (demo)`, `${ex.id} did not proceed. Your position is unchanged.`, `/investor/transactions/${ex.txId}`);
  } else {
    s = addNotification(s, ex.userId, "exit", "Exit status changed (demo)", `${ex.id} is now ${next.replace("_demo", "").replace(/_/g, " ")}.`, `/investor/transactions/${ex.txId}`);
  }
  s = { ...s, exits: s.exits.map((e) => (e.id === exitId ? { ...e, status: next } : e)) };
  s = patchTx(s, ex.txId, next, note);
  s = addAudit(s, actor, `Exit → ${next}`, "Exit", exitId);
  return ok(s, s.exits.find((e) => e.id === exitId)!);
}

/* ===================== Withdrawals ===================== */

export function createWithdrawal(
  state: DemoState,
  input: { userId: string; amount: number; clientRequestId: string },
): ServiceResult<{ withdrawalId: string; txId: string }> {
  const dup = state.transactions.find((t) => t.idempotencyKey === input.clientRequestId);
  if (dup && dup.refId) return ok(state, { withdrawalId: dup.refId, txId: dup.id });

  const user = state.users.find((u) => u.id === input.userId);
  if (!user) return fail("User not found.");
  if (!user.bank) return fail("Add a (fictional) demo bank account first.");
  const { available } = cashSummary(input.userId, state.cash, state.exits, state.withdrawals);
  const v = validateWithdrawalAmount(String(input.amount), available);
  if (!v.ok) return fail(v.error);

  let s = state;
  const mWd = mint(s, "DEMO-WD"); s = mWd.state;
  const mTx = mint(s, "DEMO-TX"); s = mTx.state;
  const mCs = mint(s, "DEMO-CS"); s = mCs.state;
  const at = nowIso();
  const w: WithdrawalRequest = {
    id: mWd.id, userId: input.userId, amount: v.value, maskedDestination: `${user.bank.maskedAccount} · ${user.bank.bankName}`,
    status: "submitted_demo", createdAt: at, txId: mTx.id,
  };
  const t: MockTransaction = {
    id: mTx.id, userId: input.userId, type: "withdrawal", status: "submitted_demo", amount: v.value, fee: 0, refId: mWd.id,
    createdAt: at, idempotencyKey: input.clientRequestId, events: [event("submitted_demo", "Withdrawal requested (demo). No transfer will occur.")],
  };
  s = {
    ...s,
    withdrawals: [w, ...s.withdrawals],
    transactions: [t, ...s.transactions],
    cash: [...s.cash, { id: mCs.id, userId: input.userId, kind: "withdrawal_hold", availableDelta: -v.value, refId: mWd.id, at, note: "Withdrawal requested — amount reserved" }],
  };
  s = addNotification(s, input.userId, "withdrawal", "Withdrawal submitted (demo)", `${mWd.id} is awaiting review. No real transfer will occur.`, `/investor/transactions/${mTx.id}`);
  s = addAudit(s, { name: user.name, role: "investor" }, "Withdrawal requested", "Withdrawal", mWd.id);
  return ok(s, { withdrawalId: mWd.id, txId: mTx.id });
}

export function transitionWithdrawal(state: DemoState, id: string, next: TxStatus, actor: Actor = SYSTEM, reason?: string): ServiceResult<WithdrawalRequest> {
  const w = state.withdrawals.find((x) => x.id === id);
  if (!w) return fail("Withdrawal not found.");
  if (!canTransition("withdrawal", w.status, next)) return fail(`Invalid transition: ${w.status} → ${next}.`);

  let s = state;
  const pretty = next.replace("_demo", "").replace(/_/g, " ");
  if (["rejected_demo", "cancelled_demo", "failed_demo"].includes(next)) {
    // Release the reserve exactly once (terminal states cannot be re-entered).
    const m = mint(s, "DEMO-CS"); s = m.state;
    s = { ...s, cash: [...s.cash, { id: m.id, userId: w.userId, kind: "withdrawal_release", availableDelta: w.amount, refId: w.id, at: nowIso(), note: `Reserve released — withdrawal ${pretty}` }] };
  } else if (next === "paid_demo") {
    const m = mint(s, "DEMO-CS"); s = m.state;
    s = { ...s, cash: [...s.cash, { id: m.id, userId: w.userId, kind: "withdrawal_paid", availableDelta: 0, refId: w.id, at: nowIso(), note: "Withdrawal marked paid (demo) — reserve consumed" }] };
  }
  s = { ...s, withdrawals: s.withdrawals.map((x) => (x.id === id ? { ...x, status: next } : x)) };
  s = patchTx(s, w.txId, next, reason ? `${pretty} — ${reason}` : `Moved to ${pretty}`);
  s = addNotification(s, w.userId, "withdrawal", `Withdrawal ${pretty} (demo)`, `${id} is now ${pretty}.`, `/investor/transactions/${w.txId}`);
  s = addAudit(s, actor, `Withdrawal → ${next}`, "Withdrawal", id);
  return ok(s, s.withdrawals.find((x) => x.id === id)!);
}

/* ===================== Users & onboarding ===================== */

export function registerUser(
  state: DemoState,
  input: { name: string; email: string; phone: string; role: "investor" | "owner"; orgName?: string },
): ServiceResult<DemoUser> {
  const email = input.email.trim().toLowerCase();
  if (state.users.some((u) => u.email.toLowerCase() === email)) return fail("An account with this email already exists in the demo. Try signing in.");
  const m = mint(state, "usr");
  const user: DemoUser = {
    id: m.id, name: input.name.trim(), email, phone: input.phone.trim(), role: input.role, verification: "not_started",
    checklist: checklistFor("not_started"), bank: null, orgName: input.orgName, createdAt: nowIso(), emailAlerts: true,
  };
  let s: DemoState = { ...m.state, users: [...m.state.users, user] };
  s = addAudit(s, { name: user.name, role: input.role }, "Demo account created", "User", user.id);
  return ok(s, user);
}

export function updateProfile(state: DemoState, userId: string, patch: Partial<Pick<DemoUser, "name" | "phone" | "location" | "orgName" | "emailAlerts">>): ServiceResult {
  if (!state.users.some((u) => u.id === userId)) return fail("User not found.");
  return ok({ ...state, users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) }, undefined);
}

export function saveBank(state: DemoState, userId: string, bank: Pick<BankDetails, "holderName" | "bankName" | "maskedAccount">): ServiceResult {
  if (!/^X{4} \d{4}$/.test(bank.maskedAccount)) return fail("Use the masked demo format: XXXX 1234 (last four digits of a fictional account).");
  const b: BankDetails = { ...bank, ifscDemo: "DEMO0000001", status: "submitted" };
  return ok({ ...state, users: state.users.map((u) => (u.id === userId ? { ...u, bank: b } : u)) }, undefined);
}

export function setChecklistItem(state: DemoState, userId: string, label: string, status: VerificationStatus): ServiceResult {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return fail("User not found.");
  return ok({ ...state, users: state.users.map((u) => (u.id === userId ? { ...u, checklist: u.checklist.map((c) => (c.label === label ? { ...c, status } : c)) } : u)) }, undefined);
}

export function submitVerification(state: DemoState, userId: string): ServiceResult {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return fail("User not found.");
  if (!["not_started", "draft", "action_required", "rejected_demo"].includes(user.verification)) return fail("Verification is already submitted.");
  let s: DemoState = {
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, verification: "submitted", checklist: u.checklist.map((c) => ({ ...c, status: "submitted" })) } : u)),
  };
  s = addAudit(s, { name: user.name, role: user.role }, "Verification submitted (demo)", "User", userId);
  return ok(s, undefined);
}

export function setVerification(state: DemoState, userId: string, status: VerificationStatus, reason: string, actor: Actor): ServiceResult {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return fail("User not found.");
  if (["rejected_demo", "action_required"].includes(status) && !reason.trim()) return fail("A reason is required for this decision.");
  let s: DemoState = {
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, verification: status, checklist: u.checklist.map((c) => ({ ...c, status: status === "under_review" ? "under_review" : status })) } : u)),
  };
  s = addNotification(s, userId, "onboarding", `Verification ${status.replace("_demo", "").replace(/_/g, " ")} (demo)`, reason || "Your demo verification status changed.", "/investor/verification");
  s = addAudit(s, actor, `Verification → ${status}${reason ? ` (${reason})` : ""}`, "User", userId);
  return ok(s, undefined);
}

/* ===================== Watchlist, notifications, support ===================== */

export function toggleWatchlist(state: DemoState, userId: string, projectId: string): ServiceResult<boolean> {
  const cur = state.watchlist[userId] ?? [];
  const has = cur.includes(projectId);
  return ok({ ...state, watchlist: { ...state.watchlist, [userId]: has ? cur.filter((x) => x !== projectId) : [...cur, projectId] } }, !has);
}

export function markNotifications(state: DemoState, userId: string, ids: "all" | string[], read = true): ServiceResult {
  return ok({ ...state, notifications: state.notifications.map((n) => (n.userId === userId && (ids === "all" || ids.includes(n.id)) ? { ...n, read } : n)) }, undefined);
}

export function addTicket(state: DemoState, userId: string, subject: string, message: string): ServiceResult<string> {
  if (!subject.trim() || !message.trim()) return fail("Subject and message are required.");
  const m = mint(state, "TKT");
  return ok({ ...m.state, tickets: [{ id: m.id, userId, subject, message, at: nowIso() }, ...m.state.tickets] }, m.id);
}

/* ===================== Owner & admin project flows ===================== */

const EDITABLE: ProjectStatus[] = ["draft", "changes_requested"];

export function projectCompleteness(p: Project): string[] {
  const issues: string[] = [];
  if (p.title.trim().length < 5) issues.push("Add a project title (5+ characters).");
  if (p.summary.trim().length < 20) issues.push("Write a summary (20+ characters).");
  if (!p.location.trim()) issues.push("Add the farm location.");
  if (!p.funding || !(p.funding.target > 0)) issues.push("Enter a funding target above zero.");
  if (!p.analysis || !(p.analysis.plannedQty > 0)) issues.push("Enter planned production quantity.");
  if (!p.analysis || p.analysis.costs.length === 0) issues.push("Add at least one cost line.");
  if (p.risks.length === 0) issues.push("Describe at least one risk and mitigation.");
  if (p.milestones.length === 0) issues.push("Add at least one milestone.");
  return issues;
}

export function saveProjectDraft(state: DemoState, project: Project, actor: Actor): ServiceResult<string> {
  const existing = state.projects.find((p) => p.id === project.id);
  if (existing && !EDITABLE.includes(existing.status)) return fail("This project can no longer be edited (it is under review or published).");
  const at = nowIso();
  if (existing) {
    const s = addAudit({ ...state, projects: state.projects.map((p) => (p.id === project.id ? { ...project, status: existing.status, updatedAt: at } : p)) }, actor, "Project draft saved", "Project", project.id);
    return ok(s, project.id);
  }
  const m = mint(state, "p");
  const created: Project = { ...project, id: m.id, status: "draft", createdAt: at, updatedAt: at };
  return ok(addAudit({ ...m.state, projects: [created, ...m.state.projects] }, actor, "Project draft created", "Project", m.id), m.id);
}

export function submitProject(state: DemoState, projectId: string, actor: Actor): ServiceResult {
  const p = state.projects.find((x) => x.id === projectId);
  if (!p) return fail("Project not found.");
  if (!EDITABLE.includes(p.status)) return fail("Only drafts or projects with requested changes can be submitted.");
  const issues = projectCompleteness(p);
  if (issues.length) return fail(`Not ready to submit: ${issues.join(" ")}`);
  let s: DemoState = { ...state, projects: state.projects.map((x) => (x.id === projectId ? { ...x, status: "submitted", updatedAt: nowIso() } : x)) };
  s = addAudit(s, actor, "Project submitted (demo)", "Project", projectId);
  return ok(s, undefined);
}

export type ReviewDecision = "start_review" | "approve" | "reject" | "request_changes";

export function reviewProject(state: DemoState, projectId: string, decision: ReviewDecision, reason: string, actor: Actor): ServiceResult {
  const p = state.projects.find((x) => x.id === projectId);
  if (!p) return fail("Project not found.");
  if (actor.id && p.ownerId === actor.id) return fail("Separation of duties: you cannot review your own project.");
  const allowedFrom: Record<ReviewDecision, ProjectStatus[]> = {
    start_review: ["submitted"], approve: ["submitted", "under_review"], reject: ["submitted", "under_review"], request_changes: ["submitted", "under_review"],
  };
  if (!allowedFrom[decision].includes(p.status)) return fail(`Cannot ${decision.replace("_", " ")} while the project is "${p.status}".`);
  if ((decision === "reject" || decision === "request_changes") && !reason.trim()) return fail("A reason is required for this decision.");

  const next: ProjectStatus = { start_review: "under_review", approve: "approved_demo", reject: "rejected_demo", request_changes: "changes_requested" }[decision] as ProjectStatus;
  const label = { start_review: "Review started", approve: "Approved (demo)", reject: "Rejected (demo)", request_changes: "Changes requested (demo)" }[decision];
  const m = mint(state, "RC");
  const withInvestable = (x: Project): Project =>
    decision === "approve"
      ? { ...x, demoConfig: x.analysis && x.analysis.pricePerUnit !== null ? { ...x.demoConfig, investable: true, notInvestableReason: undefined } : { ...x.demoConfig, investable: false, notInvestableReason: "Analysis review not complete (demo)." } }
      : x;
  let s: DemoState = {
    ...m.state,
    projects: m.state.projects.map((x) =>
      x.id === projectId
        ? withInvestable({ ...x, status: next, updatedAt: nowIso(), reviewComments: [...x.reviewComments, { id: m.id, at: nowIso(), actor: actor.name, decision: label, text: reason.trim() || label }] })
        : x,
    ),
  };
  s = addAudit(s, actor, `${label}${reason ? ` — ${reason}` : ""}`, "Project", projectId);
  return ok(s, undefined);
}

export function addProjectUpdate(state: DemoState, projectId: string, title: string, body: string, actor: Actor): ServiceResult {
  if (!title.trim() || !body.trim()) return fail("Title and details are required.");
  const m = mint(state, "U");
  const s = addAudit({ ...m.state, projects: m.state.projects.map((p) => (p.id === projectId ? { ...p, updatedAt: nowIso(), updates: [{ id: m.id, date: nowIso().slice(0, 10), title: title.trim(), body: `${body.trim()} (sample update)` }, ...p.updates] } : p)) }, actor, "Project update posted", "Project", projectId);
  return ok(s, undefined);
}

export function setMilestoneStatus(state: DemoState, projectId: string, milestoneId: string, status: "planned" | "in_progress" | "done" | "delayed", actor: Actor): ServiceResult {
  const date = nowIso().slice(0, 10);
  const s = addAudit({
    ...state,
    projects: state.projects.map((p) => (p.id === projectId ? { ...p, milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, status, actualDate: status === "done" ? date : null } : m)) } : p)),
  }, actor, `Milestone → ${status}`, "Project", projectId);
  return ok(s, undefined);
}

/* ===================== Admin tools ===================== */

export function applyValuationUpdate(state: DemoState, pct: number, actor: Actor): ServiceResult<number> {
  if (!Number.isFinite(pct) || pct < -20 || pct > 20) return fail("Enter a percentage between −20 and +20.");
  const date = nowIso().slice(0, 10);
  let count = 0;
  const valuations = { ...state.valuations };
  const investments = state.investments.map((i) => {
    if (i.status === "exited_demo" || i.currentEstimatedValue <= 0) return i;
    count += 1;
    const value = round2(i.currentEstimatedValue * (1 + pct / 100));
    valuations[i.id] = [...(valuations[i.id] ?? []), { date, value, note: `Sample revaluation ${pct >= 0 ? "+" : "−"}${Math.abs(pct)}% (demo)` }];
    return { ...i, currentEstimatedValue: value, valuationAsOf: date };
  });
  const s = addAudit({ ...state, investments, valuations }, actor, `Sample valuation update ${pct}%`, "Valuation", `${count} positions`);
  return ok(s, count);
}

export function runReconciliation(state: DemoState, actor: Actor): ServiceResult<{ added: number; matched: number }> {
  const done = new Set(["settled_demo", "paid_demo", "confirmed_demo"]);
  let s = state;
  let added = 0;
  let matched = 0;
  const recon = [...s.recon];
  for (const t of s.transactions) {
    const idx = recon.findIndex((r) => r.txId === t.id);
    if (idx === -1) {
      const m = mint(s, "REC"); s = m.state;
      const isDone = done.has(t.status);
      recon.push({ id: m.id, txId: t.id, ref: `PRV-DEMO-${m.id.slice(-4)}`, internalAmount: t.amount, providerAmount: isDone ? t.amount : null, status: isDone ? "matched" : "unmatched", note: isDone ? "Matches demo provider record" : "Pending: not yet settled" });
      added += 1;
      if (isDone) matched += 1;
    } else if (recon[idx].status === "unmatched" && done.has(t.status)) {
      recon[idx] = { ...recon[idx], providerAmount: t.amount, status: "matched", note: "Matched after settlement (demo)" };
      matched += 1;
    }
  }
  s = addAudit({ ...s, recon }, actor, "Demo reconciliation run", "Reconciliation", `${added} new, ${matched} matched`);
  return ok(s, { added, matched });
}

export function resolveReconException(state: DemoState, id: string, actor: Actor): ServiceResult {
  const r = state.recon.find((x) => x.id === id);
  if (!r || r.status !== "exception") return fail("Only exceptions can be resolved.");
  const s = addAudit({ ...state, recon: state.recon.map((x) => (x.id === id ? { ...x, providerAmount: x.internalAmount, status: "matched", note: "Resolved manually (demo)" } : x)) }, actor, "Reconciliation exception resolved", "Reconciliation", id);
  return ok(s, undefined);
}

