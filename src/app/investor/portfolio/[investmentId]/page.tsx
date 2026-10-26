"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FileText } from "lucide-react";
import { Badge, Breadcrumbs, Button, Callout, Card, DefList, EmptyState, LinkButton, PageTitle, Tabs } from "@/components/common/ui";
import { CurrencyAmount, GainLossValue, TransactionStatusBadge } from "@/components/common/badges";
import { DemoDocumentPreview } from "@/components/common/feedback";
import { MilestoneTimeline } from "@/components/common/visuals";
import { ValuationChart } from "@/components/analysis/ValuationChart";
import { DEMO_CONFIG, INVESTMENT_STATUS_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { gainLoss, gainLossPercent, isOpenExit } from "@/lib/portfolio-calculations";
import { projectById } from "@/lib/project-helpers";

export default function InvestmentDetailPage() {
  const { investmentId } = useParams<{ investmentId: string }>();
  const { state } = useDemo();
  const d = useInvestor();
  const [doc, setDoc] = useState<{ title: string; category: string } | null>(null);
  const inv = d.investments.find((i) => i.id === investmentId);
  if (!inv) return <EmptyState title="Investment not found" body="It may belong to another account or not exist in this demo." action={<LinkButton href="/investor/portfolio">Back to portfolio</LinkButton>} />;

  const p = projectById(state, inv.projectId);
  const gl = gainLoss(inv.currentEstimatedValue, inv.originalAmount);
  const pct = gainLossPercent(inv.currentEstimatedValue, inv.originalAmount);
  const el = inv.exitEligibility;
  const openExit = state.exits.find((e) => e.investmentId === inv.id && isOpenExit(e));
  const exited = inv.status === "exited_demo";
  const txs = d.transactions.filter((t) => t.investmentId === inv.id);
  const docs = d.documents.filter((x) => x.projectId === inv.projectId && x.userId === d.user?.id);
  const history = state.valuations[inv.id] ?? [];

  const sellDisabledReason = exited ? "This position has already been exited (demo)." : openExit ? `Exit request ${openExit.id} is already in progress.` : !el.canRequestExit ? el.reason ?? "Not eligible for a simulated exit." : null;

  return (
    <>
      <Breadcrumbs items={[{ label: "Portfolio", href: "/investor/portfolio" }, { label: inv.id }]} />
      <PageTitle title={p?.title ?? "Investment"} subtitle={<>{inv.id} · simulated {formatDate(inv.purchasedAt)} · <Badge tone={exited ? "neutral" : "ok"}>{INVESTMENT_STATUS_LABEL[inv.status]}</Badge></>} actions={p && <LinkButton variant="secondary" href={`/projects/${p.id}`}>Project page</LinkButton>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs font-semibold uppercase text-muted">Original amount</p><p className="mt-1 text-2xl font-bold"><CurrencyAmount value={inv.originalAmount} /></p></Card>
        <Card><p className="text-xs font-semibold uppercase text-muted">Current estimated value</p><p className="mt-1 text-2xl font-bold"><CurrencyAmount value={inv.currentEstimatedValue} /></p><p className="text-xs text-muted">as of {formatDate(inv.valuationAsOf)}</p></Card>
        <Card><p className="text-xs font-semibold uppercase text-muted">Unrealised gain / loss</p><p className="mt-1 text-xl">{exited ? "—" : <GainLossValue amount={gl} percent={pct} />}</p></Card>
        <Card><p className="text-xs font-semibold uppercase text-muted">Exit</p>
          {sellDisabledReason ? (<><Button disabled className="mt-1 w-full" title={sellDisabledReason}>Sell / redeem (demo)</Button><p className="mt-2 text-xs text-muted">{sellDisabledReason}</p></>) : <LinkButton href={`/investor/portfolio/${inv.id}/sell`} className="mt-1 w-full">Sell / redeem (demo)</LinkButton>}
        </Card>
      </div>
      <Callout tone="warn" className="mt-4">Valuation method: {DEMO_CONFIG.valuationMethodNote} A current estimate is not necessarily a sell quote, and a buyer or settlement is never guaranteed.</Callout>

      <div className="mt-6">
        <Tabs tabs={[
          { id: "overview", label: "Overview", content: (
            <div className="space-y-6">
              <ValuationChart points={history} title="Estimated value history (sample)" />
              <Link href={`/investor/portfolio/${inv.id}/history`} className="inline-block text-sm font-semibold text-brand-700 hover:underline">Open full valuation history</Link>
              <DefList rows={[["Project stage", p?.stage ?? "—"], ["Demo reference", inv.id], ["Currency", inv.currency], ["Exit options", el.canRequestExit ? `${el.canRequestPartialExit ? "Partial, " : ""}${el.canRequestFullExit ? "Full" : ""}`.replace(/, $/, "") + " (demo fixture)" : "None (demo fixture)"]]} />
            </div>) },
          { id: "progress", label: "Project progress", content: p ? (<div className="space-y-5"><MilestoneTimeline items={p.milestones} />{p.updates.length > 0 && <ul className="space-y-2 text-sm">{p.updates.map((u) => <li key={u.id}><strong>{u.title}</strong> <span className="text-muted">· {formatDate(u.date)}</span><br /><span className="text-muted">{u.body}</span></li>)}</ul>}</div>) : <EmptyState title="Project unavailable" /> },
          { id: "tx", label: "Transactions", content: txs.length === 0 ? <EmptyState title="No transactions" /> : (<ul className="divide-y divide-line">{txs.map((t) => (<li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><Link href={`/investor/transactions/${t.id}`} className="font-semibold capitalize hover:underline">{t.type} · {formatINR(t.amount)}</Link><span className="block text-xs text-muted">{t.id} · {formatDateTime(t.createdAt)}</span></div><TransactionStatusBadge status={t.status} /></li>))}</ul>) },
          { id: "docs", label: "Documents", content: docs.length === 0 ? <EmptyState title="No documents for this position" /> : (<ul className="space-y-2">{docs.map((x) => (<li key={x.id}><button type="button" disabled={!x.available} onClick={() => setDoc({ title: x.title, category: x.category })} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline disabled:text-muted disabled:no-underline"><FileText className="size-4" aria-hidden /> {x.title}{!x.available && " — unavailable in demo"}</button></li>))}</ul>) },
        ]} />
      </div>
      <DemoDocumentPreview open={!!doc} onClose={() => setDoc(null)} title={doc?.title ?? ""} category={doc?.category ?? ""} />
    </>
  );
}
