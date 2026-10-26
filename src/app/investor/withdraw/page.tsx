"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Callout, Card, CheckField, DefList, EmptyState, LinkButton, PageTitle, SelectField, TextField } from "@/components/common/ui";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatINR } from "@/lib/format";
import { createWithdrawal } from "@/lib/mock-service";
import { validateWithdrawalAmount } from "@/lib/validation";

export default function WithdrawPage() {
  const { run } = useDemo();
  const d = useInvestor();
  const router = useRouter();
  const toast = useToast();
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const [ack, setAck] = useState(false);
  const [ackErr, setAckErr] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const requestId = useId();

  const bank = d.user?.bank;
  if (!bank) {
    return (
      <>
        <PageTitle title="Withdraw funds (simulated)" />
        <EmptyState title="Add a demo bank account first" body="Use a fictional masked account only (for example XXXX 1234). Never enter real bank details in this prototype." action={<LinkButton href="/investor/bank-details">Add demo bank details</LinkButton>} />
      </>
    );
  }
  const v = validateWithdrawalAmount(raw, d.cash.available);
  const amountErr = touched && !v.ok ? v.error : undefined;

  const review = () => {
    setTouched(true);
    if (!ack) setAckErr("Please confirm to continue.");
    if (v.ok && ack) setConfirm(true);
  };
  const submit = () => {
    if (busy || !v.ok || !d.user) return;
    setBusy(true);
    const r = run((s) => createWithdrawal(s, { userId: d.user!.id, amount: v.value, clientRequestId: requestId }));
    setConfirm(false);
    if (!r.ok) { setBusy(false); return setErr(r.error); }
    toast("Withdrawal request submitted (demo). No transfer will occur.", "ok");
    router.push(`/investor/transactions/${r.data.txId}`);
  };

  return (
    <div className="max-w-2xl">
      <PageTitle title="Withdraw funds (simulated)" subtitle="Only settled available cash can be requested. Nothing is transferred." />
      {err && <div role="alert" className="mb-4 rounded-card bg-bad-bg p-4 text-sm text-bad-fg">{err}</div>}
      <Card className="space-y-5">
        <DefList rows={[["Settled available cash", formatINR(d.cash.available)], ["Pending sale proceeds (not withdrawable)", formatINR(d.cash.pendingProceeds)]]} />
        <TextField label="Amount (INR)" inputMode="decimal" required value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={() => setTouched(true)} error={amountErr} hint={`Up to ${formatINR(d.cash.available)}`} />
        <SelectField label="Payout method (demo)"><option>{bank.maskedAccount} · {bank.bankName}</option></SelectField>
        <CheckField checked={ack} onChange={(x) => { setAck(x); setAckErr(undefined); }} error={ackErr}>I understand this is a simulated request. No real transfer will happen and no real bank details were entered.</CheckField>
        <div className="flex flex-wrap justify-between gap-2"><LinkButton variant="secondary" href="/investor/cash">Cancel</LinkButton><button type="button" onClick={review} className="inline-flex min-h-11 items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Review withdrawal</button></div>
      </Card>
      <Callout tone="info" className="mt-4">Want to turn an investment into cash? Use <strong>Sell / redeem</strong> on a portfolio position instead — proceeds are pending until settled.</Callout>
      <ConfirmationDialog open={confirm} title="Submit simulated withdrawal?" confirmLabel="Submit demo request" onCancel={() => setConfirm(false)} onConfirm={submit} confirmDisabled={busy}
        body={<>You are requesting <strong>{formatINR(v.ok ? v.value : null)}</strong> to {bank.maskedAccount}. This amount is reserved from your available cash while the request is reviewed. No money moves in this demo.</>} />
    </div>
  );
}
