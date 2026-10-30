"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, CheckField, DefList, PageTitle, TextField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDate, formatINR } from "@/lib/format";
import { updateProfile } from "@/lib/mock-service";
import { isPhone } from "@/lib/validation";

export default function ProfilePage() {
  const { user, run } = useDemo();
  const toast = useToast();
  const d = useInvestor();
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", location: user?.location ?? "", alerts: user?.emailAlerts ?? true });
  const [e, setE] = useState<Record<string, string>>({});
  if (!user) return null;
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid 10-digit mobile number.";
    setE(er);
    if (Object.keys(er).length) return;
    run((s) => updateProfile(s, user.id, { name: f.name.trim(), phone: f.phone, location: f.location, emailAlerts: f.alerts }));
    toast("Profile saved (local demo data).", "ok");
  };
  return (
    <div>
      <PageTitle title="Profile" subtitle={<span className="flex items-center gap-2">Verification: <VerificationBadge status={user.verification} /></span>} />
      <Card className="max-w-4xl p-6!">
        <form onSubmit={submit} noValidate className="grid items-start gap-6 md:grid-cols-2">
          <TextField label="Full name" required value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} error={e.name} />
          <TextField label="Email" value={user.email} readOnly hint="Email cannot be changed in the demo." />
          <TextField label="Phone" type="tel" required value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} error={e.phone} />
          <TextField label="City" value={f.location} onChange={(x) => setF({ ...f, location: x.target.value })} />
          <div className="md:col-span-2"><CheckField checked={f.alerts} onChange={(v) => setF({ ...f, alerts: v })}>Show email-style alerts in my notifications (nothing is actually emailed).</CheckField></div>
          <div className="md:col-span-2"><Button type="submit">Save changes</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
        <Card className="p-6!">
          <h2 className="text-lg font-bold text-brand-900">Account details</h2>
          <div className="mt-4">
            <DefList rows={[
              ["Account ID", user.id],
              ["Account type", "Investor (demo)"],
              ["Member since", formatDate(user.createdAt)],
              ["Verification", <VerificationBadge key="v" status={user.verification} />],
              ["Bank account", user.bank ? `${user.bank.bankName} · ${user.bank.maskedAccount}` : "Not added"],
              ["Account holder", user.bank?.holderName ?? "—"],
            ]} />
          </div>
          <Link href="/investor/bank-details" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Manage bank details &amp; verification</Link>
        </Card>
        <Card className="p-6!">
          <h2 className="text-lg font-bold text-brand-900">Portfolio at a glance</h2>
          <div className="mt-4">
            <DefList rows={[
              ["Active investments", d.summary.activeCount],
              ["Amount invested (open)", formatINR(d.summary.invested)],
              ["Est. portfolio value", formatINR(d.summary.value)],
              ["Available cash", formatINR(d.cash.available)],
              ["Total positions", d.investments.length],
              ["Transactions", d.transactions.length],
            ]} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-brand-700">
            <Link href="/investor/portfolio" className="hover:underline">View portfolio</Link>
            <Link href="/investor/transactions" className="hover:underline">View transactions</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
