"use client";

import Link from "next/link";
import { Callout, Card, PageTitle, StatCard } from "@/components/common/ui";
import { useDemo } from "@/context/DemoContext";
import { isOpenExit, isOpenWithdrawal } from "@/lib/portfolio-calculations";
import { formatDateTime } from "@/lib/format";

export default function AdminDashboard() {
  const { state } = useDemo();
  const awaitingProjects = state.projects.filter((p) => ["submitted", "under_review"].includes(p.status)).length;
  const verif = state.users.filter((u) => ["submitted", "under_review"].includes(u.verification)).length;
  const exits = state.exits.filter(isOpenExit).length;
  const wds = state.withdrawals.filter(isOpenWithdrawal).length;
  const failed = state.transactions.filter((t) => ["failed_demo"].includes(t.status)).length;
  const pendingTx = state.transactions.filter((t) => !["settled_demo", "paid_demo", "confirmed_demo", "rejected_demo", "failed_demo", "cancelled_demo"].includes(t.status)).length;
  const exceptions = state.recon.filter((r) => r.status !== "matched").length;
  const cards: [string, number, string, string?][] = [
    ["Projects awaiting review", awaitingProjects, "/admin/projects"],
    ["Verification cases", verif, "/admin/verifications"],
    ["Open exit requests", exits, "/admin/exits"],
    ["Open withdrawals", wds, "/admin/withdrawals"],
    ["Pending transactions", pendingTx, "/admin/transactions"],
    ["Failed transactions", failed, "/admin/transactions"],
    ["Reconciliation exceptions", exceptions, "/admin/reconciliation"],
  ];
  return (
    <>
      <PageTitle title="Operations overview" subtitle="Demo metrics derived from the shared sample records." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, n, href]) => (<Link key={label} href={href} className="block rounded-card focus-visible:outline-offset-4"><StatCard label={label} value={n} note="Demo data" /></Link>))}
      </div>
      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-brand-900">Recent audit events (demo)</h2><Link href="/admin/audit" className="text-sm font-semibold text-brand-700 hover:underline">All events</Link></div>
        <ul className="divide-y divide-line">{state.audit.slice(0, 6).map((a) => (<li key={a.id} className="py-2 text-sm"><span className="font-semibold">{a.action}</span> <span className="text-muted">· {a.entity} {a.ref} · {a.actor} · {formatDateTime(a.at)}</span></li>))}</ul>
      </Card>
      <Callout tone="neutral" className="mt-6">Every metric here is demo data. This console cannot move money or approve anything in the real world.</Callout>
    </>
  );
}
