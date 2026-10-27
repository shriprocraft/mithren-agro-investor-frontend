/**
 * Frontend prototype types. These are UI models for a mock-only phase —
 * NOT a production ledger, accounting, or legal schema.
 */

export type Role = "investor" | "owner" | "admin";

export type MockSession = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isDemo: true;
};

export type VerificationStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "under_review"
  | "action_required"
  | "approved_demo"
  | "rejected_demo";

export type ChecklistItem = { label: string; status: VerificationStatus };

export type BankDetails = {
  holderName: string;
  bankName: string;
  /** Always a masked demo value such as "XXXX 1234". Never real credentials. */
  maskedAccount: string;
  ifscDemo: string;
  status: VerificationStatus;
};

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  verification: VerificationStatus;
  checklist: ChecklistItem[];
  bank: BankDetails | null;
  location?: string;
  orgName?: string;
  createdAt: string;
  emailAlerts: boolean;
};

/* ---------- Projects ---------- */

export type ProjectStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved_demo"
  | "active_demo"
  | "completed_demo"
  | "rejected_demo";

export type ProjectStage = "preparation" | "growing" | "harvest" | "sales" | "closed";

export type CategoryId =
  | "crop_cultivation"
  | "dairy_farming"
  | "fish_farming"
  | "poultry_farming"
  | "biogas_composting"
  | "agri_forestry";

export type EvidenceLabel =
  | "operator_provided"
  | "document_supported"
  | "reviewer_checked"
  | "independently_verified";

export type CostItem = {
  id: string;
  label: string;
  amount: number;
  kind: "opex" | "capex";
  basis: "estimate" | "quoted" | "actual";
};

export type Assumption = {
  label: string;
  value: string;
  unit: string;
  period: string;
  source: string;
  evidence: EvidenceLabel;
  reviewedAt: string | null;
};

export type ProjectAnalysis = {
  asOf: string;
  reviewedBy: string | null;
  plannedQty: number;
  qtyUnit: string;
  lossRatePct: number;
  /** null → price evidence not provided (limited analysis). */
  pricePerUnit: number | null;
  salesDeductionPct: number | null;
  costs: CostItem[];
  assumptions: Assumption[];
  /** Reported actuals, only for completed projects. Self-reported unless noted. */
  actuals?: { qty: number; avgPrice: number; totalCost: number; label: string };
};

export type Risk = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
};

export type Milestone = {
  id: string;
  title: string;
  plannedDate: string;
  actualDate: string | null;
  status: "planned" | "in_progress" | "done" | "delayed";
  note?: string;
};

export type ProjectUpdate = { id: string; date: string; title: string; body: string };

export type ReviewComment = { id: string; at: string; actor: string; decision: string; text: string };

export type Project = {
  id: string;
  ownerId: string;
  title: string;
  category: CategoryId;
  crop: string;
  location: string;
  region: string;
  district: string;
  summary: string;
  objective: string;
  productionMethod: string;
  certification: { status: "none" | "claimed" | "reviewed"; note: string };
  stage: ProjectStage;
  status: ProjectStatus;
  durationMonths: number;
  season: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  funding: { target: number; raised: number } | null;
  demoConfig: {
    investable: boolean;
    notInvestableReason?: string;
    minAmount: number;
    maxAmount: number;
  };
  analysis: ProjectAnalysis | null;
  risks: Risk[];
  useOfFunds: { label: string; amount: number }[];
  milestones: Milestone[];
  updates: ProjectUpdate[];
  documentTitles: string[];
  reviewComments: ReviewComment[];
};

/* ---------- Investments, valuations, transactions ---------- */

export type TxStatus =
  | "draft"
  | "submitted_demo"
  | "under_review_demo"
  | "approved_demo"
  | "rejected_demo"
  | "settlement_pending_demo"
  | "processing_demo"
  | "settled_demo"
  | "paid_demo"
  | "confirmed_demo"
  | "failed_demo"
  | "cancelled_demo";

export type ExitEligibility = {
  canRequestExit: boolean;
  canRequestPartialExit: boolean;
  canRequestFullExit: boolean;
  reason?: string;
};

export type MockInvestment = {
  id: string;
  userId: string;
  projectId: string;
  originalAmount: number;
  currentEstimatedValue: number;
  currency: "INR";
  purchasedAt: string;
  status: "active_demo" | "partially_exited_demo" | "exited_demo";
  valuationAsOf: string;
  exitEligibility: ExitEligibility;
};

export type ValuationPoint = { date: string; value: number; note?: string };

export type TxType = "investment" | "exit" | "withdrawal" | "refund" | "adjustment";

export type TxEvent = { status: TxStatus; at: string; note: string };

export type MockTransaction = {
  id: string;
  userId: string;
  type: TxType;
  status: TxStatus;
  amount: number;
  fee: number;
  projectId?: string;
  investmentId?: string;
  /** exit / withdrawal record id */
  refId?: string;
  createdAt: string;
  events: TxEvent[];
  idempotencyKey?: string;
};

export type ExitRequest = {
  id: string;
  userId: string;
  investmentId: string;
  projectId: string;
  kind: "partial" | "full";
  requestedValue: number;
  /** cost basis released from the position on settlement */
  costBasisReleased: number;
  fee: number;
  netProceeds: number;
  status: TxStatus;
  createdAt: string;
  txId: string;
};

export type WithdrawalRequest = {
  id: string;
  userId: string;
  amount: number;
  maskedDestination: string;
  status: TxStatus;
  createdAt: string;
  txId: string;
};

export type CashEntryKind =
  | "demo_opening_balance"
  | "exit_settlement"
  | "withdrawal_hold"
  | "withdrawal_release"
  | "withdrawal_paid";

export type CashEntry = {
  id: string;
  userId: string;
  kind: CashEntryKind;
  /** change to settled available cash */
  availableDelta: number;
  refId?: string;
  at: string;
  note: string;
};

/* ---------- Misc ---------- */

export type DemoDocument = {
  id: string;
  userId: string | null;
  title: string;
  category: "agreement" | "disclosure" | "receipt" | "statement";
  projectId?: string;
  date: string;
  available: boolean;
};

export type Notification = {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  ref: string;
};

export type ReconEntry = {
  id: string;
  txId: string;
  ref: string;
  internalAmount: number;
  providerAmount: number | null;
  status: "matched" | "unmatched" | "exception";
  note: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  at: string;
};

export type DemoState = {
  version: number;
  seq: number;
  users: DemoUser[];
  projects: Project[];
  investments: MockInvestment[];
  valuations: Record<string, ValuationPoint[]>;
  transactions: MockTransaction[];
  exits: ExitRequest[];
  withdrawals: WithdrawalRequest[];
  cash: CashEntry[];
  documents: DemoDocument[];
  notifications: Notification[];
  audit: AuditEvent[];
  recon: ReconEntry[];
  tickets: SupportTicket[];
  watchlist: Record<string, string[]>;
};

export type ServiceResult<R = void> =
  | { ok: true; state: DemoState; data: R }
  | { ok: false; error: string };
