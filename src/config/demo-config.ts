import type {
  CategoryId,
  EvidenceLabel,
  ProjectStage,
  ProjectStatus,
  TxStatus,
  VerificationStatus,
} from "@/types";

/** All configurable demo assumptions live here (see docs/ASSUMPTIONS.md). */
export const DEMO_CONFIG = {
  /** Illustrative exit fee. NOT an approved fee. */
  exitFeePct: 0.5,
  /** Prototype default for ₹100 test amount. NOT a legal minimum. */
  testAmount: 100,
  quickAmounts: [100, 500, 1000, 5000],
  /** Valuation freshness label only. */
  valuationMethodNote:
    "Sample valuation for the prototype. Not an approved valuation method and not an executable sale price.",
} as const;

/** Scenario adjustments (illustrative test ranges, not universal agricultural assumptions). */
export const SCENARIOS = {
  conservative: { label: "Downside", yieldPct: -20, pricePct: -15, costPct: 10, extraLossPts: 5 },
  base: { label: "Base", yieldPct: 0, pricePct: 0, costPct: 0, extraLossPts: 0 },
  optimistic: { label: "Upside", yieldPct: 10, pricePct: 10, costPct: 0, extraLossPts: 0 },
} as const;
export type ScenarioKey = keyof typeof SCENARIOS;

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "crop_cultivation", label: "Crop Cultivation" },
  { id: "dairy_farming", label: "Dairy Farming" },
  { id: "fish_farming", label: "Fish Farming" },
  { id: "poultry_farming", label: "Poultry Farming" },
  { id: "biogas_composting", label: "Biogas & Composting" },
  { id: "agri_forestry", label: "Agri Forestry" },
];
export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const STAGE_LABEL: Record<ProjectStage, string> = {
  preparation: "Preparation",
  growing: "Growing / production",
  harvest: "Harvest",
  sales: "Sales & delivery",
  closed: "Closed out",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  submitted: "Submitted (demo)",
  under_review: "Under review (demo)",
  changes_requested: "Changes requested (demo)",
  approved_demo: "Approved (demo)",
  active_demo: "Active (demo)",
  completed_demo: "Completed (demo)",
  rejected_demo: "Rejected (demo)",
};

export const TX_STATUS_LABEL: Record<TxStatus, string> = {
  draft: "Draft",
  submitted_demo: "Submitted (demo)",
  under_review_demo: "Under review (demo)",
  approved_demo: "Approved (demo)",
  rejected_demo: "Rejected (demo)",
  settlement_pending_demo: "Settlement pending (demo)",
  processing_demo: "Processing (demo)",
  settled_demo: "Settled (demo)",
  paid_demo: "Paid (demo)",
  confirmed_demo: "Demo confirmed",
  failed_demo: "Failed (demo)",
  cancelled_demo: "Cancelled (demo)",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  action_required: "Action required",
  approved_demo: "Approved (demo)",
  rejected_demo: "Rejected (demo)",
};

export const EVIDENCE_LABEL: Record<EvidenceLabel, { label: string; help: string }> = {
  operator_provided: {
    label: "Operator-provided",
    help: "Entered by the project owner; not independently verified.",
  },
  document_supported: {
    label: "Document-supported",
    help: "Backed by a submitted document. A document upload alone is not verification.",
  },
  reviewer_checked: {
    label: "Reviewer-checked",
    help: "Reviewed under the platform's documented process (demo label).",
  },
  independently_verified: {
    label: "Independently verified",
    help: "Only where a qualified independent party actually performed the work.",
  },
};

/** Shared disclaimer copy. */
export const COPY = {
  demoShort: "Demo data — no real money moves.",
  demoLong:
    "This is a frontend prototype. All projects, amounts, valuations and records are fictional sample data. Nothing here is an offer, investment advice, or a real transaction.",
  noGuarantee:
    "Estimates are not guarantees. Crop yield, prices, project completion and any investor outcome are uncertain.",
  projectNotReturn:
    "Project economics are not investor returns. What an investor would receive depends on a contractual model that has not been decided.",
} as const;

export const INVESTMENT_STATUS_LABEL = {
  active_demo: "Active (demo)",
  partially_exited_demo: "Partially exited (demo)",
  exited_demo: "Exited (demo)",
} as const;

/** All 38 districts of Tamil Nadu. */
export const TN_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi",
  "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
  "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur",
  "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
  "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
] as const;

/** Investment duration is limited to 1–3 months. */
export const MAX_DURATION_MONTHS = 3;
export const DURATION_OPTIONS = [1, 2, 3] as const;
export const durationLabel = (m: number) => `${m} ${m === 1 ? "Month" : "Months"}`;
