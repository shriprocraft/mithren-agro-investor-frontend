"use client";

import Link from "next/link";
import { Callout, Card, EmptyState, LinkButton, PageTitle, StatCard } from "@/components/common/ui";
import { CurrencyAmount, GainLossValue, TransactionStatusBadge } from "@/components/common/badges";
import { ValuationChart } from "@/components/analysis/ValuationChart";
import { VerificationBadge } from "@/components/common/badges";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDate, formatINR } from "@/lib/format";
import { projectById } from "@/lib/project-helpers";
import { COPY } from "@/config/demo-config";

export default function InvestorDashboard() {
  const { state } = useDemo();
  const d = useInvestor();
  const active = d.investments.filter((i) => i.status !== "exited_demo");
  const milestones = active
    .map((i) => projectById(state, i.projectId))
    .filter((p) => !!p)
    .flatMap((p) => p!.milestones.filter((m) => m.status !== "done").map((m) => ({ ...m, project: p!.title, projectId: p!.id })))
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
    .slice(0, 4);
  const actions: { text: string; href: string }[] = [];
  if (d.user && d.user.verification !== "approved_demo") actions.push({ text: "Complete demo verification", href: "/investor/verification" });
  if (d.exits.some((e) => ["submitted_demo", "under_review_demo"].includes(e.status))) actions.push({ text: "Exit request awaiting review (demo)", href: "/investor/transactions" });
  if (d.withdrawals.some((w) => ["submitted_demo", "under_review_demo"].includes(w.status))) actions.push({ text: "Withdrawal awaiting review (demo)", href: "/investor/transactions" });
  if (!d.user?.bank) actions.push({ text: "Add a fictional demo bank account", href: "/investor/bank-details" });

  return (
    <>
      <PageTitle title={`Welcome, ${d.user?.name.split(" ")[0] ?? ""}`} subtitle={<>{COPY.demoShort} <span className="mr-1">Verification:</span>{d.user && <VerificationBadge status={d.user.verification} />}</>} actions={<LinkButton href="/projects">Explore projects</LinkButton>} />

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Amount invested (sample)" value={<CurrencyAmount value={d.summary.invested} />} note="Original simulated amounts on open positions" />
        <StatCard label="Estimated portfolio value" value={<CurrencyAmount value={d.summary.value} />} note="Sample valuation — not a sale price" />
        <StatCard label="Unrealised gain / loss" value={<GainLossValue amount={d.summary.gain} percent={d.summary.gainPct} />} note="Estimated value minus original amount" />
        <StatCard label="Active investments" value={d.summary.activeCount} note="Simulated positions" />
        <StatCard label="Settled available cash" value={<CurrencyAmount value={d.cash.available} />} note="Withdrawable demo cash only" />
        <StatCard tone="pending" label="Pending exit proceeds" value={<CurrencyAmount value={d.cash.pendingProceeds} />} note="Not withdrawable until settled" />
        <StatCard tone="pending" label="Pending withdrawals" value={<CurrencyAmount value={d.cash.pendingWithdrawals} />} note="Already reserved from available cash" />
      </section>
      <p className="mt-2 text-xs text-muted">Portfolio value and available cash are kept separate on purpose and are never added together.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-brand-900">Estimated portfolio value over time</h2>
          {d.history.length === 0 ? <EmptyState title="No portfolio history yet" body="Simulate an investment to start a demo valuation history." action={<LinkButton href="/projects">Browse projects</LinkButton>} /> : <ValuationChart points={d.history} title="Sample estimated portfolio value" />}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold text-brand-900">Needs your attention</h2>
          {actions.length === 0 ? <p className="text-sm text-muted">Nothing is waiting on you.</p> : <ul className="space-y-2">{actions.map((a) => (<li key={a.text}><Link href={a.href} className="block rounded-control bg-warn-bg px-3 py-2 text-sm font-semibold text-warn-fg hover:underline">{a.text}</Link></li>))}</ul>}
          <h2 className="mb-2 mt-6 text-lg font-bold text-brand-900">Upcoming milestones</h2>
          {milestones.length === 0 ? <p className="text-sm text-muted">No upcoming milestones for your projects.</p> : <ul className="space-y-2 text-sm">{milestones.map((m) => (<li key={m.projectId + m.id}><Link href={`/projects/${m.projectId}`} className="font-semibold hover:underline">{m.title}</Link><span className="block text-xs text-muted">{m.project} · planned {formatDate(m.plannedDate)}</span></li>))}</ul>}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-brand-900">Active investments</h2><Link href="/investor/portfolio" className="text-sm font-semibold text-brand-700 hover:underline">View portfolio</Link></div>
          {active.length === 0 ? <EmptyState title="No investments yet" body="Your simulated positions will appear here." /> : (
            <ul className="divide-y divide-line">{active.slice(0, 4).map((i) => (<li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div className="min-w-0"><Link href={`/investor/portfolio/${i.id}`} className="block truncate font-semibold hover:underline">{projectById(state, i.projectId)?.title}</Link><span className="text-xs text-muted">{i.id}</span></div><span className="tabular font-semibold">{formatINR(i.currentEstimatedValue)}</span></li>))}</ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-brand-900">Recent transactions</h2><Link href="/investor/transactions" className="text-sm font-semibold text-brand-700 hover:underline">All transactions</Link></div>
          {d.transactions.length === 0 ? <EmptyState title="No transactions yet" /> : (
            <ul className="divide-y divide-line">{d.transactions.slice(0, 4).map((t) => (<li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><Link href={`/investor/transactions/${t.id}`} className="font-semibold capitalize hover:underline">{t.type} · {formatINR(t.amount)}</Link><span className="block text-xs text-muted">{t.id} · {formatDate(t.createdAt)}</span></div><TransactionStatusBadge status={t.status} /></li>))}</ul>
          )}
        </Card>
      </div>
      <Callout tone="warn" className="mt-6">Demo data. {COPY.noGuarantee}</Callout>
    </>
  );
}
