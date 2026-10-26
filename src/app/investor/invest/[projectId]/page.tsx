"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Breadcrumbs, Button, Callout, Card, CheckField, DefList, EmptyState, LinkButton, PageTitle, TextField } from "@/components/common/ui";
import { ProjectImage } from "@/components/common/visuals";
import { useToast } from "@/components/common/feedback";
import { COPY, DEMO_CONFIG } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatINR } from "@/lib/format";
import { createInvestment } from "@/lib/mock-service";
import { projectById } from "@/lib/project-helpers";
import { validateInvestmentAmount } from "@/lib/validation";
import { VerificationBadge } from "@/components/common/badges";

export default function InvestPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state, user, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"amount" | "review">("amount");
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const [ack, setAck] = useState(false);
  const [ackError, setAckError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // One stable request id per checkout visit → repeated submits are idempotent.
  const requestId = useId();

  const p = projectById(state, projectId);
  if (!p || !["approved_demo", "active_demo", "completed_demo"].includes(p.status)) {
    return <EmptyState title="Project not found" body="This project is not available in the demo catalogue." action={<LinkButton href="/projects">Browse projects</LinkButton>} />;
  }
  const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
  if (!p.demoConfig.investable) {
    return (
      <div className="max-w-xl">
        <EmptyState title="This project is not open for demo investment" body={p.demoConfig.notInvestableReason ?? "Not available."} action={<LinkButton href={`/projects/${p.id}`}>Back to project</LinkButton>} />
      </div>
    );
  }

  const v = validateInvestmentAmount(raw, { min: p.demoConfig.minAmount, max: p.demoConfig.maxAmount, remainingAllocation: remaining });
  const amountError = touched && !v.ok ? v.error : undefined;
  const fee = 0; // No fee configured for the demo; shown explicitly so nothing is hidden.
  const total = v.ok ? v.value + fee : null;

  const goReview = () => {
    setTouched(true);
    if (v.ok) { setFailure(null); setStep("review"); }
  };

  const confirm = () => {
    if (busy) return;
    if (!ack) return setAckError("Please acknowledge the risks and demo terms to continue.");
    if (!v.ok || !user) return;
    setAckError(undefined);
    setBusy(true);
    setFailure(null);
    if (simulateFailure) {
      setBusy(false);
      setSimulateFailure(false);
      return setFailure("Simulated failure: the demo action did not complete. Nothing was recorded. You can retry or cancel.");
    }
    const r = run((s) => createInvestment(s, { userId: user.id, projectId: p.id, amount: v.value, riskAcknowledged: ack, clientRequestId: requestId }));
    if (!r.ok) { setBusy(false); return setFailure(r.error); }
    toast("Simulated investment recorded. No real money moved.", "ok");
    router.push(`/investor/investment-confirmation/${r.data.investmentId}`);
  };

  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: p.title, href: `/projects/${p.id}` }, { label: "Simulate investment" }]} />
      <PageTitle title="Simulate an investment" subtitle="Demo only — no payment provider is connected and no real money moves." />

      {user && user.verification !== "approved_demo" && (
        <Callout tone="info" title="Demo verification incomplete" className="mb-4">
          Your demo verification status is <VerificationBadge status={user.verification} />. Real eligibility rules are not implemented in this prototype, so you can continue — but a mock approval never authorises a real investment. <Link href="/investor/verification" className="font-semibold underline">Open verification checklist</Link>.
        </Callout>
      )}

      <Card className="mb-4 flex gap-4">
        <ProjectImage category={p.category} title={p.title} className="hidden size-24 shrink-0 rounded-control sm:grid" />
        <div className="min-w-0 text-sm"><p className="font-bold text-brand-900">{p.title}</p><p className="text-muted">{p.location}</p>
          {p.funding && <p className="mt-1 tabular text-xs text-muted">{formatINR(p.funding.raised)} of {formatINR(p.funding.target)} sample target ({fundingProgress(p.funding)}%)</p>}</div>
      </Card>

      {failure && <div role="alert" className="mb-4 rounded-card border border-bad-fg/30 bg-bad-bg p-4 text-sm text-bad-fg"><p className="font-semibold">Could not complete the demo action</p><p className="mt-1">{failure}</p><div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => setFailure(null)}>Dismiss</Button>{step === "review" && <Button onClick={confirm}>Retry</Button>}</div></div>}

      {step === "amount" ? (
        <Card>
          <h2 className="text-lg font-bold text-brand-900">1. Enter an amount</h2>
          <div className="mt-4 space-y-4">
            <TextField label="Amount (INR)" inputMode="decimal" autoComplete="off" required value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={() => setTouched(true)} error={amountError} hint={`Demo limits: ${formatINR(p.demoConfig.minAmount)} – ${formatINR(p.demoConfig.maxAmount)}${remaining !== null ? ` · ${formatINR(remaining)} sample allocation remaining` : ""}`} placeholder="e.g. 100" />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Optional presets</p>
              <div className="flex flex-wrap gap-2">{DEMO_CONFIG.quickAmounts.map((a) => (<Button key={a} variant="secondary" aria-pressed={raw === String(a)} onClick={() => { setRaw(String(a)); setTouched(true); }}>{formatINR(a)}{a === DEMO_CONFIG.testAmount ? " (test)" : ""}</Button>))}</div>
            </div>
            <DefList rows={[["Fees (illustrative)", "None configured in the demo"], ["Total payable (demo)", total === null ? "—" : formatINR(total)], ["What the amount represents", "Undecided — a simulated commitment only. No return is calculated."]]} />
            <Callout tone="warn">₹100 is accepted here as a prototype test amount. It is not a statement that ₹100 is a legally valid minimum for a live product. {COPY.noGuarantee}</Callout>
            <div className="flex flex-wrap justify-between gap-2"><LinkButton variant="secondary" href={`/projects/${p.id}`}>Cancel</LinkButton><Button onClick={goReview}>Review</Button></div>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-bold text-brand-900">2. Review before confirming</h2>
          <div className="mt-4 space-y-4">
            <DefList rows={[["Project", p.title], ["Amount entered", formatINR(v.ok ? v.value : null)], ["Fees (illustrative)", formatINR(fee)], ["Total demo commitment", formatINR(total)], ["Scenario view", "Project scenarios are on the project page; none is a promised outcome"], ["Reference", "Created on confirmation (demo)"]]} />
            <Callout tone="warn" title="What could go wrong">Yield, prices, timing and completion are uncertain. This simulated amount is not a guaranteed return and may not be exit-able in a live product. <Link href="/risk-disclosure" target="_blank" className="font-semibold underline">Risk disclosure</Link></Callout>
            <CheckField checked={ack} onChange={(x) => { setAck(x); setAckError(undefined); }} error={ackError}>I understand this is a simulated action with sample data, no real payment is made, and outcomes are not guaranteed.</CheckField>
            <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} className="size-4 accent-brand-600" /> Demo only: make the next confirmation fail so I can see the error state</label>
            <div className="flex flex-wrap justify-between gap-2"><Button variant="secondary" onClick={() => setStep("amount")} disabled={busy}>Back</Button><div className="flex gap-2"><LinkButton variant="ghost" href={`/projects/${p.id}`}>Cancel</LinkButton><Button onClick={confirm} loading={busy}>Confirm demo investment</Button></div></div>
          </div>
        </Card>
      )}
    </div>
  );
}
