"use client";

import { useState, type FormEvent } from "react";
import { Button, Callout, Card, DefList, PageTitle, TextField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { saveBank } from "@/lib/mock-service";

export default function BankDetailsPage() {
  const { user, run } = useDemo();
  const toast = useToast();
  const [f, setF] = useState({ holder: user?.name ?? "", bank: "Demo Bank (fictional)", masked: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!user) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.holder.trim().length < 2) er.holder = "Enter the account holder name.";
    if (!f.bank.trim()) er.bank = "Enter a bank name.";
    if (!/^X{4} \d{4}$/.test(f.masked)) er.masked = "Use the masked demo format XXXX 1234.";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = run((s) => saveBank(s, user.id, { holderName: f.holder, bankName: f.bank, maskedAccount: f.masked }));
    if (r.ok) { toast("Demo bank details saved (masked).", "ok"); setF({ ...f, masked: "" }); } else setErr({ masked: r.error });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageTitle title="Bank details (demo)" subtitle="Masked, fictional values only." />
      <Callout tone="warn" title="Never enter real bank details">This prototype does not collect or store real account numbers, IFSC codes, card details, UPI PINs or OTPs.</Callout>
      {user.bank && (<Card><h2 className="mb-3 text-lg font-bold text-brand-900">Saved payout account</h2><DefList rows={[["Holder", user.bank.holderName], ["Bank", user.bank.bankName], ["Account", user.bank.maskedAccount], ["Demo verification", <VerificationBadge key="v" status={user.bank.status} />]]} /></Card>)}
      <Card>
        <h2 className="mb-3 text-lg font-bold text-brand-900">{user.bank ? "Replace account" : "Add account"}</h2>
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField label="Account holder" required value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })} error={err.holder} />
          <TextField label="Bank name" required value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} error={err.bank} />
          <TextField label="Masked account" required value={f.masked} onChange={(e) => setF({ ...f, masked: e.target.value.toUpperCase() })} error={err.masked} hint="Example: XXXX 1234" />
          <Button type="submit">Save demo account</Button>
        </form>
      </Card>
    </div>
  );
}
