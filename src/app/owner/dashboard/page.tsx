"use client";

import Link from "next/link";
import { Callout, Card, EmptyState, LinkButton, PageTitle, ProgressBar, StatCard } from "@/components/common/ui";
import { ProjectStatusBadge, VerificationBadge } from "@/components/common/badges";
import { CurrencyAmount } from "@/components/common/badges";
import { useOwner } from "@/hooks/useOwner";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatDate, formatINR } from "@/lib/format";

export default function OwnerDashboard() {
  const o = useOwner();
  const by = (...s: string[]) => o.projects.filter((p) => s.includes(p.status)).length;
  const actions = o.projects.filter((p) => ["draft", "changes_requested"].includes(p.status));
  return (
    <>
      <PageTitle title={`Welcome, ${o.user?.name.split(" ")[0] ?? ""}`} subtitle={<>{o.user?.orgName} · verification: {o.user && <VerificationBadge status={o.user.verification} />}</>} actions={<LinkButton href="/owner/projects/new">New project</LinkButton>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={o.projects.length} />
        <StatCard label="Drafts / changes requested" value={by("draft", "changes_requested")} />
        <StatCard label="Submitted / in review" value={by("submitted", "under_review")} />
        <StatCard label="Active / approved (demo)" value={by("active_demo", "approved_demo")} />
        <StatCard label="Sample funds raised" value={<CurrencyAmount value={o.raised} />} note={`of ${formatINR(o.target)} in sample targets`} />
      </div>
      <p className="mt-2 text-xs text-muted">Funding amounts are sample data. No money was received or disbursed.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold text-brand-900">Action required</h2>
          {actions.length === 0 ? <p className="text-sm text-muted">Nothing needs your attention.</p> : <ul className="space-y-2">{actions.map((p) => (<li key={p.id} className="flex items-center justify-between gap-2 text-sm"><span className="font-semibold">{p.title}</span><span className="flex items-center gap-2"><ProjectStatusBadge status={p.status} /><Link href={`/owner/projects/${p.id}/edit`} className="font-semibold text-brand-700 underline">Edit</Link></span></li>))}</ul>}
          <h2 className="mb-3 mt-6 text-lg font-bold text-brand-900">Next milestones</h2>
          {o.milestones.length === 0 ? <p className="text-sm text-muted">No upcoming milestones.</p> : <ul className="space-y-2 text-sm">{o.milestones.slice(0, 4).map((m) => (<li key={m.projectId + m.id}><span className="font-semibold">{m.title}</span><span className="block text-xs text-muted">{m.project} · planned {formatDate(m.plannedDate)}</span></li>))}</ul>}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-brand-900">Funding progress (sample)</h2><Link href="/owner/funding" className="text-sm font-semibold text-brand-700 hover:underline">Details</Link></div>
          {o.projects.filter((p) => p.funding && p.status !== "rejected_demo").length === 0 ? <EmptyState title="No funding data" /> : (
            <ul className="space-y-4">{o.projects.filter((p) => p.funding && p.status !== "rejected_demo").map((p) => (<li key={p.id}><div className="mb-1 flex justify-between text-sm"><Link href={`/owner/projects/${p.id}`} className="font-semibold hover:underline">{p.title}</Link><span className="tabular text-muted">{fundingProgress(p.funding)}%</span></div><ProgressBar value={fundingProgress(p.funding)} label={`Funding progress for ${p.title}`} /></li>))}</ul>
          )}
        </Card>
      </div>
      <Callout tone="info" className="mt-6">Submitting a project only places it in the demo admin queue. An admin decision is simulated and is not legal or due-diligence approval.</Callout>
    </>
  );
}
