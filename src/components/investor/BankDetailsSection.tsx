"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Card, TextField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { saveBank } from "@/lib/mock-service";

export function BankDetailsSection() {
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
    <section id="bank-details" aria-labelledby="bank-details-heading" className="scroll-mt-20">
      <h2 id="bank-details-heading" className="mb-4 text-xl font-bold text-brand-900">Bank details</h2>
      <div className="grid items-stretch gap-6 md:grid-cols-2">
        {user.bank && (
          <Card className="flex flex-col p-6!">
            <h3 className="mb-4 text-lg font-bold text-brand-900">Saved payout account</h3>
            <dl className="flex flex-1 flex-col divide-y divide-line border-y border-line">
              {([["Holder", user.bank.holderName], ["Bank", user.bank.bankName], ["Account", user.bank.maskedAccount], ["Demo verification", <VerificationBadge key="v" status={user.bank.status} />]] as [string, ReactNode][]).map(([k, v]) => (
                <div key={k} className="flex flex-1 items-center justify-between gap-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="tabular text-right text-sm text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
        <Card className="p-6!">
          <h3 className="mb-4 text-lg font-bold text-brand-900">{user.bank ? "Replace account" : "Add account"}</h3>
          <form onSubmit={submit} noValidate className="space-y-5">
            <TextField label="Account holder" required value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })} error={err.holder} />
            <TextField label="Bank name" required value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} error={err.bank} />
            <TextField label="Masked account" required value={f.masked} onChange={(e) => setF({ ...f, masked: e.target.value.toUpperCase() })} error={err.masked} hint="Example: XXXX 1234" />
            <Button type="submit">Save demo account</Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
