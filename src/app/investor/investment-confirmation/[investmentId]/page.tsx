"use client";

import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Callout, Card, DefList, EmptyState, LinkButton, PageTitle } from "@/components/common/ui";
import { TransactionStatusBadge } from "@/components/common/badges";
import { useInvestor } from "@/hooks/useInvestor";
import { useDemo } from "@/context/DemoContext";
import { formatDateTime, formatINR } from "@/lib/format";
import { projectById } from "@/lib/project-helpers";

export default function ConfirmationPage() {
  const { investmentId } = useParams<{ investmentId: string }>();
  const { state } = useDemo();
  const d = useInvestor();
  const inv = d.investments.find((i) => i.id === investmentId);
  const tx = d.transactions.find((t) => t.investmentId === investmentId && t.type === "investment");
  if (!inv || !tx) return <EmptyState title="Confirmation not found" action={<LinkButton href="/investor/portfolio">Go to portfolio</LinkButton>} />;
  const p = projectById(state, inv.projectId);
  return (
    <div className="max-w-2xl">
      <PageTitle title="Demo investment recorded" />
      <Card>
        <div className="flex items-center gap-3"><CheckCircle2 className="size-8 text-brand-600" aria-hidden /><div><p className="font-bold text-brand-900">Simulated — no real money moved</p><TransactionStatusBadge status={tx.status} /></div></div>
        <div className="mt-5"><DefList rows={[["Demo reference", inv.id], ["Transaction", tx.id], ["Project", p?.title ?? "—"], ["Amount", formatINR(inv.originalAmount)], ["Date", formatDateTime(inv.purchasedAt)], ["Status", "Demo confirmed (simulated)"]]} /></div>
        <Callout tone="info" className="mt-5" title="Next steps">Your simulated position now appears in your portfolio and transactions. Its estimated value is sample data and not a guaranteed return.</Callout>
        <div className="mt-5 flex flex-wrap gap-2"><LinkButton href={`/investor/portfolio/${inv.id}`}>View investment</LinkButton><LinkButton variant="secondary" href="/investor/portfolio">Portfolio</LinkButton><LinkButton variant="secondary" href={`/projects/${inv.projectId}`}>Project details</LinkButton></div>
      </Card>
    </div>
  );
}
