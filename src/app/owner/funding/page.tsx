"use client";

import Link from "next/link";
import { Callout, Card, EmptyState, PageTitle, ProgressBar, StatCard } from "@/components/common/ui";
import { CurrencyAmount } from "@/components/common/badges";
import { useOwner } from "@/hooks/useOwner";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatINR } from "@/lib/format";

export default function OwnerFunding() {
  const o = useOwner();
  const list = o.projects.filter((p) => p.funding);
  return (
    <>
      <PageTitle title="Funding overview" subtitle="Sample targets and sample amounts raised. No funds were received or disbursed." />
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Total sample target" value={<CurrencyAmount value={o.target} />} /><StatCard label="Sample raised" value={<CurrencyAmount value={o.raised} />} /><StatCard label="Remaining" value={<CurrencyAmount value={Math.max(0, o.target - o.raised)} />} /></div>
      <div className="mt-6 space-y-4">
        {list.length === 0 ? <EmptyState title="No funding information" /> : list.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-2"><Link href={`/owner/projects/${p.id}`} className="text-lg font-bold text-brand-900 hover:underline">{p.title}</Link><span className="tabular text-sm font-semibold">{formatINR(p.funding!.raised)} / {formatINR(p.funding!.target)} ({fundingProgress(p.funding)}%)</span></div>
            <div className="mt-2"><ProgressBar value={fundingProgress(p.funding)} label={`Funding progress for ${p.title}`} /></div>
            {p.useOfFunds.length > 0 ? (
              <table className="mt-4 w-full text-sm"><caption className="sr-only">Planned use of funds for {p.title}</caption><tbody>{p.useOfFunds.map((u) => (<tr key={u.label} className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">{u.label}</th><td className="tabular py-2 text-right">{formatINR(u.amount)}</td></tr>))}</tbody></table>
            ) : <p className="mt-3 text-sm text-muted">No use-of-funds breakdown provided.</p>}
          </Card>
        ))}
      </div>
      <Callout tone="info" className="mt-6">Changes to approved use of funds would need a controlled change request in a live product.</Callout>
    </>
  );
}
