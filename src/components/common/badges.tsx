import { EVIDENCE_LABEL, PROJECT_STATUS_LABEL, TX_STATUS_LABEL, VERIFICATION_LABEL } from "@/config/demo-config";
import { cn } from "@/lib/cn";
import { formatINR, formatPercent, formatSignedINR, MISSING } from "@/lib/format";
import type { EvidenceLabel, ProjectStatus, TxStatus, VerificationStatus } from "@/types";
import { Badge, type Tone } from "./ui";

const TX_TONE: Record<TxStatus, Tone> = {
  draft: "neutral", submitted_demo: "info", under_review_demo: "info", approved_demo: "ok", rejected_demo: "bad",
  settlement_pending_demo: "warn", processing_demo: "warn", settled_demo: "ok", paid_demo: "ok", confirmed_demo: "ok",
  failed_demo: "bad", cancelled_demo: "neutral",
};
export const TransactionStatusBadge = ({ status }: { status: TxStatus }) => <Badge tone={TX_TONE[status]}>{TX_STATUS_LABEL[status]}</Badge>;

const PROJECT_TONE: Record<ProjectStatus, Tone> = {
  draft: "neutral", submitted: "info", under_review: "info", changes_requested: "warn", approved_demo: "ok",
  active_demo: "ok", completed_demo: "neutral", rejected_demo: "bad",
};
export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => <Badge tone={PROJECT_TONE[status]}>{PROJECT_STATUS_LABEL[status]}</Badge>;

const VER_TONE: Record<VerificationStatus, Tone> = {
  not_started: "neutral", draft: "neutral", submitted: "info", under_review: "info", action_required: "warn", approved_demo: "ok", rejected_demo: "bad",
};
export const VerificationBadge = ({ status }: { status: VerificationStatus }) => <Badge tone={VER_TONE[status]}>{VERIFICATION_LABEL[status]}</Badge>;

const EV_TONE: Record<EvidenceLabel, Tone> = { operator_provided: "neutral", document_supported: "info", reviewer_checked: "ok", independently_verified: "ok" };
export const EvidenceBadge = ({ evidence }: { evidence: EvidenceLabel }) => (
  <span title={EVIDENCE_LABEL[evidence].help}><Badge tone={EV_TONE[evidence]}>{EVIDENCE_LABEL[evidence].label}</Badge></span>
);

export const ForecastTag = ({ kind }: { kind: "forecast" | "actual" | "demo" }) => (
  <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", kind === "actual" ? "bg-info-bg text-info-fg" : "bg-warn-bg text-warn-fg")}>
    {kind === "forecast" ? "Forecast" : kind === "actual" ? "Actual (self-reported)" : "Demo data"}
  </span>
);

export function CurrencyAmount({ value, className, signed }: { value: number | null | undefined; className?: string; signed?: boolean }) {
  return <span className={cn("tabular", className)}>{signed ? formatSignedINR(value) : formatINR(value)}</span>;
}

/** Gain/loss never relies on colour alone: sign and a text word are always shown. */
export function GainLossValue({ amount, percent, className }: { amount: number | null; percent: number | null; className?: string }) {
  if (amount === null) return <span>{MISSING}</span>;
  const dir = amount > 0 ? "Gain" : amount < 0 ? "Loss" : "No change";
  const color = amount > 0 ? "text-ok-fg" : amount < 0 ? "text-bad-fg" : "text-muted";
  return (
    <span className={cn("tabular font-semibold", color, className)}>
      <span className="sr-only">{dir}: </span>
      {formatSignedINR(amount)} <span className="font-normal">({formatPercent(percent, 2, true)})</span>
    </span>
  );
}
