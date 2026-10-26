"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs, Button, Callout, Card, CheckField, DefList, EmptyState, LinkButton, PageTitle, TextField } from "@/components/common/ui";
import { useToast } from "@/components/common/feedback";
import { DEMO_CONFIG } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDateTime, formatINR } from "@/lib/format";
import { createExitRequest } from "@/lib/mock-service";
import { exitPreview, isOpenExit } from "@/lib/portfolio-calculations";
import { projectById } from "@/lib/project-helpers";
import { validateExitAmount } from "@/lib/validation";
import { cn } from "@/lib/cn";

export default function SellPage() {
  const { investmentId } = useParams<{ investmentId: string }>();
  const { state, user, run } = useDemo();
  const d = useInvestor();
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<"partial" | "full">("full");
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const [step, setStep] = useState<"choose" | "quote">("choose");
  const [ack, setAck] = useState(false);
  const [ackErr, setAckErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quotedAt, setQuotedAt] = useState("");

  const inv = d.investments.find((i) => i.id === investmentId);
  if (!inv) return <EmptyState title="Investment not found" action={<LinkButton href="/investor/portfolio">Back to portfolio</LinkButton>} />;
  const p = projectById(state, inv.projectId);
  const el = inv.exitEligibility;
  const open = state.exits.find((e) => e.investmentId === inv.id && isOpenExit(e));
  const blocked = inv.status === "exited_demo" ? "This position has already been exited (demo)." : open ? `Exit request ${open.id} is already in progress for this position.` : !el.canRequestExit ? (el.reason ?? "Not eligible for a simulated exit.") : null;

  if (blocked) {
    return (
      <div className="max-w-xl">
        <Breadcrumbs items={[{ label: "Portfolio", href: "/investor/portfolio" }, { label: inv.id, href: `/investor/portfolio/${inv.id}` }, { label: "Sell / redeem" }]} />
        <EmptyState title="Exit not available" body={blocked} action={<LinkButton href={`/investor/portfolio/${inv.id}`}>Back to investment</LinkButton>} />
      </div>
    );
  }

  const effKind = kind === "partial" && !el.canRequestPartialExit ? "full" : kind === "full" && !el.canRequestFullExit ? "partial" : kind;
  const v = validateExitAmount(raw, { currentValue: inv.currentEstimatedValue, allowPartial: el.canRequestPartialExit, allowFull: el.canRequestFullExit, kind: effKind });
  const amountErr = effKind === "partial" && touched && !v.ok ? v.error : undefined;
  const prev = v.ok ? exitPreview(inv, v.value, DEMO_CONFIG.exitFeePct) : null;

  const toQuote = () => {
    setTouched(true);
    if (!v.ok) return;
    setQuotedAt(new Date().toISOString());
    setStep("quote");
  };

  const submit = () => {
    if (busy) return;
    if (!ack) return setAckErr("Please acknowledge the terms to continue.");
    if (!v.ok || !user) return;
    setBusy(true);
    const r = run((s) => createExitRequest(s, { userId: user.id, investmentId: inv.id, kind: effKind, requestedValue: v.value }));
    if (!r.ok) { setBusy(false); return setErr(r.error); }
    toast("Exit request submitted (demo). Proceeds are pending and not yet available cash.", "ok");
    router.push(`/investor/transactions/${r.data.txId}`);
  };

  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Portfolio", href: "/investor/portfolio" }, { label: inv.id, href: `/investor/portfolio/${inv.id}` }, { label: "Sell / redeem" }]} />
      <PageTitle title="Sell / redeem (simulated)" subtitle={p?.title} />
      <Callout tone="warn" className="mb-4" title="This is a simulation">There is no guaranteed buyer, redemption, price or timing in a live product. Nothing here is a binding offer.</Callout>
      {err && <div role="alert" className="mb-4 rounded-card bg-bad-bg p-4 text-sm text-bad-fg">{err}</div>}

      {step === "choose" ? (
        <Card className="space-y-5">
          <h2 className="text-lg font-bold text-brand-900">1. Choose what to exit</h2>
          <DefList rows={[["Current estimated value", formatINR(inv.currentEstimatedValue)], ["Original amount", formatINR(inv.originalAmount)]]} />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Exit type</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["full", "partial"] as const).map((k) => {
                const enabled = k === "full" ? el.canRequestFullExit : el.canRequestPartialExit;
                return (
                  <label key={k} className={cn("flex items-start gap-3 rounded-control border p-3 text-sm", effKind === k ? "border-brand-600 bg-brand-50" : "border-line", !enabled && "opacity-60")}>
                    <input type="radio" name="kind" value={k} disabled={!enabled} checked={effKind === k} onChange={() => setKind(k)} className="mt-1 accent-brand-600" />
                    <span><span className="block font-semibold capitalize">{k} exit</span><span className="text-muted">{enabled ? (k === "full" ? "Exit the whole position." : "Exit part; the rest stays invested.") : "Not enabled for this position (demo fixture)."}</span></span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {effKind === "partial" && <TextField label="Amount of estimated value to exit (INR)" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={() => setTouched(true)} error={amountErr} required hint={`Must be below ${formatINR(inv.currentEstimatedValue)}`} />}
          {prev && v.ok && (
            <div className="rounded-control bg-earth-50 p-4 text-sm"><p className="font-semibold">Remaining position preview</p><p className="text-muted">Estimated value after exit: <span className="tabular font-semibold text-ink">{formatINR(prev.remainingValue)}</span> · original amount remaining {formatINR(prev.remainingOriginal)}</p></div>
          )}
          <div className="flex flex-wrap justify-between gap-2"><LinkButton variant="secondary" href={`/investor/portfolio/${inv.id}`}>Cancel</LinkButton><Button onClick={toQuote}>Get simulated quote</Button></div>
        </Card>
      ) : (
        <Card className="space-y-5">
          <h2 className="text-lg font-bold text-brand-900">2. Review simulated quote</h2>
          <DefList rows={[["Investment", inv.id], ["Exit type", effKind === "full" ? "Full" : "Partial"], ["Value to exit (estimated)", formatINR(v.ok ? v.value : null)], [`Illustrative fee (${DEMO_CONFIG.exitFeePct}%)`, formatINR(prev?.fee ?? null)], ["Net proceeds (simulated)", formatINR(prev?.netProceeds ?? null)], ["Quote generated", formatDateTime(quotedAt)]]} />
          <Callout tone="info">Net proceeds are <strong>pending</strong> after submission. They are added to settled available cash only if the request later reaches “Settled (demo)”, and never before.</Callout>
          <CheckField checked={ack} onChange={(x) => { setAck(x); setAckErr(undefined); }} error={ackErr}>I understand this is a simulated quote, not a binding offer, and that proceeds are not guaranteed or instant.</CheckField>
          <div className="flex flex-wrap justify-between gap-2"><Button variant="secondary" disabled={busy} onClick={() => setStep("choose")}>Back</Button><div className="flex gap-2"><LinkButton variant="ghost" href={`/investor/portfolio/${inv.id}`}>Cancel</LinkButton><Button loading={busy} onClick={submit}>Submit demo exit request</Button></div></div>
        </Card>
      )}
    </div>
  );
}
