"use client";

import { useParams } from "next/navigation";
import { Breadcrumbs, Callout, Card, DefList, EmptyState, LinkButton, PageTitle, Tabs } from "@/components/common/ui";
import { ProjectStatusBadge } from "@/components/common/badges";
import { ProjectAnalysisView } from "@/components/analysis/ProjectAnalysisView";
import { AddUpdateForm, MilestoneControls } from "@/components/owner/ProgressPanel";
import { useDemo } from "@/context/DemoContext";
import { categoryLabel, STAGE_LABEL } from "@/config/demo-config";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { projectById } from "@/lib/project-helpers";

export default function OwnerProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state, user } = useDemo();
  const p = projectById(state, projectId);
  if (!p || p.ownerId !== user?.id) return <EmptyState title="Project not found" body="It may belong to another owner." action={<LinkButton href="/owner/projects">My projects</LinkButton>} />;
  const editable = ["draft", "changes_requested"].includes(p.status);
  return (
    <>
      <Breadcrumbs items={[{ label: "My projects", href: "/owner/projects" }, { label: p.title }]} />
      <PageTitle title={p.title} subtitle={<span className="flex flex-wrap items-center gap-2"><ProjectStatusBadge status={p.status} /> {categoryLabel(p.category)} · {p.location}</span>}
        actions={<>{editable ? <LinkButton href={`/owner/projects/${p.id}/edit`}>Edit project</LinkButton> : null}{["approved_demo", "active_demo", "completed_demo"].includes(p.status) && <LinkButton variant="secondary" href={`/projects/${p.id}`}>Public page</LinkButton>}</>} />
      {p.status === "changes_requested" && <Callout tone="warn" title="Changes requested" className="mb-4">{p.reviewComments.at(-1)?.text}</Callout>}
      {p.status === "rejected_demo" && <Callout tone="warn" title="Rejected (demo)" className="mb-4">{p.reviewComments.at(-1)?.text} You can create a new project that addresses the points.</Callout>}
      {["submitted", "under_review"].includes(p.status) && <Callout tone="info" className="mb-4">Waiting for admin review (demo). Editing is locked.</Callout>}
      <Tabs tabs={[
        { id: "overview", label: "Overview", content: (<Card><DefList rows={[["Stage", STAGE_LABEL[p.stage]], ["Duration", `${p.durationMonths} months · ${p.season}`], ["Production method", p.productionMethod], ["Funding target (sample)", p.funding ? formatINR(p.funding.target) : "—"], ["Raised (sample)", p.funding ? formatINR(p.funding.raised) : "—"], ["Last updated", formatDateTime(p.updatedAt)]]} /><p className="mt-4 text-sm">{p.summary}</p></Card>) },
        { id: "analysis", label: "Analysis", content: <ProjectAnalysisView project={p} /> },
        { id: "milestones", label: "Milestones", content: <MilestoneControls project={p} /> },
        { id: "updates", label: "Updates", content: (<div className="grid gap-6 lg:grid-cols-2"><AddUpdateForm project={p} /><div>{p.updates.length === 0 ? <p className="text-sm text-muted">No updates yet.</p> : <ul className="space-y-3 text-sm">{p.updates.map((u) => <li key={u.id}><strong>{u.title}</strong> <span className="text-muted">· {formatDate(u.date)}</span><br /><span className="text-muted">{u.body}</span></li>)}</ul>}</div></div>) },
        { id: "reviews", label: "Review comments", content: p.reviewComments.length === 0 ? <p className="text-sm text-muted">No review comments yet.</p> : <ul className="space-y-3 text-sm">{p.reviewComments.map((c) => <li key={c.id} className="rounded-control border border-line p-3"><p className="font-semibold">{c.decision} <span className="font-normal text-muted">· {c.actor} · {formatDateTime(c.at)}</span></p><p className="text-muted">{c.text}</p></li>)}</ul> },
        { id: "docs", label: "Documents", content: p.documentTitles.length === 0 ? <p className="text-sm text-muted">No documents attached.</p> : <ul className="list-disc space-y-1 pl-5 text-sm">{p.documentTitles.map((t) => <li key={t}>{t}</li>)}</ul> },
      ]} />
    </>
  );
}
