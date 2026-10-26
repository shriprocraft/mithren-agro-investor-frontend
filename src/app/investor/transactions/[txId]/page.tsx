"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs, Button, Callout, Card, DefList, EmptyState, LinkButton, PageTitle } from "@/components/common/ui";
import { TransactionStatusBadge } from "@/components/common/badges";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { StatusTimeline } from "@/components/common/visuals";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDateTime, formatINR } from "@/lib/format";
import { transitionExit, transitionWithdrawal } from "@/lib/mock-service";
import { INVESTOR_CANCELLABLE } from "@/lib/mock-transitions";
import { projectById } from "@/lib/project-helpers";

export default function TransactionDetailPage() {
  const { txId } = useParams<{ txId: string }>();
  const { state, run, actor } = useDemo();
  const d = useInvestor();
  const toast = useToast();
  const [cancel, setCancel] = useState(false);
  const t = d.transactions.find((x) => x.id === txId);
  if (!t) return <EmptyState title="Transaction not found" action={<LinkButton href="/investor/transactions">Back to transactions</LinkButton>} />;

  const p = projectById(state, t.projectId ?? "");
  const canCancel = (t.type === "exit" || t.type === "withdrawal") && INVESTOR_CANCELLABLE.includes(t.status);
  const pending = !["settled_demo", "paid_demo", "confirmed_demo", "rejected_demo", "failed_demo", "cancelled_demo"].includes(t.status);

  const doCancel = () => {
    const r = run<unknown>((s) => (t.type === "exit" ? transitionExit(s, t.refId!, "cancelled_demo", actor, "Cancelled by investor") : transitionWithdrawal(s, t.refId!, "cancelled_demo", actor, "Cancelled by investor")));
    setCancel(false);
    toast(r.ok ? "Request cancelled (demo)." : r.error, r.ok ? "ok" : "bad");
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Transactions", href: "/investor/transactions" }, { label: t.id }]} />
      <PageTitle title={`${t.type[0].toUpperCase()}${t.type.slice(1)} ${t.id}`} subtitle={<TransactionStatusBadge status={t.status} />} actions={canCancel && <Button variant="danger" onClick={() => setCancel(true)}>Cancel request</Button>} />
      {pending && <Callout tone="warn" className="mb-4" title="Pending — not settled">{t.type === "exit" ? "Net proceeds are not part of your available cash yet." : "This amount is reserved from available cash but no transfer has occurred."}</Callout>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold text-brand-900">Details</h2>
          <DefList rows={[["Reference", t.id], ["Type", t.type], ["Created", formatDateTime(t.createdAt)], ["Gross amount", formatINR(t.amount)], ["Illustrative fee", formatINR(t.fee)], ["Net amount", formatINR(t.amount - t.fee)], ["Project", p ? <Link key="p" href={`/projects/${p.id}`} className="text-brand-700 underline">{p.title}</Link> : "—"], ["Investment", t.investmentId ? <Link key="i" href={`/investor/portfolio/${t.investmentId}`} className="text-brand-700 underline">{t.investmentId}</Link> : "—"]]} />
          <p className="mt-4 text-xs text-muted">Demo reference only — not a bank, payment-provider or legal reference.</p>
        </Card>
        <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Status timeline</h2><StatusTimeline events={t.events} /></Card>
      </div>
      <ConfirmationDialog open={cancel} danger title="Cancel this request?" body="The request will be cancelled (demo). Any reserved amount is released back to available cash." confirmLabel="Cancel request" cancelLabel="Keep request" onCancel={() => setCancel(false)} onConfirm={doCancel} />
    </>
  );
}
