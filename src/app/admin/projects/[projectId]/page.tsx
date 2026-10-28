"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs, Button, Callout, Card, CheckField, DefList, EmptyState, LinkButton, PageTitle, TextAreaField } from "@/components/common/ui";
import { ProjectStatusBadge } from "@/components/common/badges";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { ProjectAnalysisView } from "@/components/analysis/ProjectAnalysisView";
import { MilestoneTimeline } from "@/components/common/visuals";
import { categoryLabel, durationLabel } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { formatDateTime, formatINR } from "@/lib/format";
import { projectCompleteness, reviewProject, type ReviewDecision } from "@/lib/mock-service";
import { projectById } from "@/lib/project-helpers";

const CHECKLIST = ["Operator identity and authority", "Land / capacity evidence", "Budget completeness and arithmetic", "Price evidence source and freshness", "Scenario analysis and risk disclosures", "Certification claims accurate", "Use-of-funds plan"];
const DECISIONS: { id: ReviewDecision; label: string; needsReason: boolean; from: string[]; danger?: boolean }[] = [
  { id: "start_review", label: "Start review", needsReason: false, from: ["submitted"] },
  { id: "approve", label: "Approve (demo)", needsReason: false, from: ["submitted", "under_review"] },
  { id: "request_changes", label: "Request changes", needsReason: true, from: ["submitted", "under_review"] },
  { id: "reject", label: "Reject (demo)", needsReason: true, from: ["submitted", "under_review"], danger: true },
];

export default function AdminProjectReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state, run, actor } = useDemo();
  const toast = useToast();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<(typeof DECISIONS)[number] | null>(null);
  const [reason, setReason] = useState("");
  const p = projectById(state, projectId);
  if (!p) return <EmptyState title="Project not found" action={<LinkButton href="/admin/projects">Back to queue</LinkButton>} />;
  const owner = state.users.find((u) => u.id === p.ownerId);
  const issues = projectCompleteness(p);

  const apply = () => {
    if (!pending) return;
    const r = run((s) => reviewProject(s, p.id, pending.id, reason, actor));
    toast(r.ok ? `${pending.label}: recorded in the demo audit log.` : r.error, r.ok ? "ok" : "bad");
    setPending(null);
    setReason("");
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Review queue", href: "/admin/projects" }, { label: p.title }]} />
      <PageTitle title={p.title} subtitle={<span className="flex flex-wrap items-center gap-2"><ProjectStatusBadge status={p.status} /> {categoryLabel(p.category)} · {p.location} · Owner: {owner?.orgName ?? p.ownerId}</span>} />
      <Callout tone="neutral" className="mb-4">Decisions here are simulated. They do not constitute legal, compliance or due-diligence approval.</Callout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Submission</h2><p className="mb-3 text-sm">{p.summary}</p><DefList rows={[["Objective", p.objective || "—"], ["Production method", p.productionMethod], ["Certification statement", p.certification.note], ["Funding target (sample)", p.funding ? formatINR(p.funding.target) : "—"], ["District", p.district || "—"], ["Duration", `${durationLabel(p.durationMonths)} · ${p.season}`], ["Last updated", formatDateTime(p.updatedAt)]]} /></Card>
          <ProjectAnalysisView project={p} />
          <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Risks</h2>{p.risks.length === 0 ? <p className="text-sm text-muted">None listed.</p> : <ul className="space-y-2 text-sm">{p.risks.map((r) => <li key={r.id}><strong>{r.title}</strong> ({r.severity}) — {r.mitigation}</li>)}</ul>}<h2 className="mb-3 mt-5 text-lg font-bold text-brand-900">Milestones</h2><MilestoneTimeline items={p.milestones} /></Card>
          <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Review history</h2>{p.reviewComments.length === 0 ? <p className="text-sm text-muted">No decisions recorded.</p> : <ul className="space-y-3 text-sm">{p.reviewComments.map((c) => <li key={c.id} className="rounded-control border border-line p-3"><p className="font-semibold">{c.decision} <span className="font-normal text-muted">· {c.actor} · {formatDateTime(c.at)}</span></p><p className="text-muted">{c.text}</p></li>)}</ul>}</Card>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <Card>
            <h2 className="mb-3 text-lg font-bold text-brand-900">Decision</h2>
            <div className="flex flex-col gap-2">
              {DECISIONS.map((d) => { const ok = d.from.includes(p.status); return (<Button key={d.id} variant={d.id === "approve" ? "primary" : d.danger ? "danger" : "secondary"} disabled={!ok} title={ok ? undefined : `Not available while status is “${p.status.replace(/_/g, " ")}”`} onClick={() => { setReason(""); setPending(d); }}>{d.label}</Button>); })}
            </div>
            {!["submitted", "under_review"].includes(p.status) && <p className="mt-3 text-xs text-muted">Decisions are only available for submitted or under-review projects.</p>}
          </Card>
          <Card>
            <h2 className="mb-3 text-lg font-bold text-brand-900">Completeness</h2>
            {issues.length === 0 ? <p className="text-sm text-ok-fg">All required submission fields are present.</p> : <ul className="list-disc space-y-1 pl-5 text-sm text-warn-fg">{issues.map((i) => <li key={i}>{i}</li>)}</ul>}
            <h3 className="mb-2 mt-4 text-sm font-semibold">Review checklist (local)</h3>
            <div className="space-y-2">{CHECKLIST.map((c) => <CheckField key={c} checked={!!checks[c]} onChange={(v) => setChecks({ ...checks, [c]: v })}>{c}</CheckField>)}</div>
          </Card>
        </aside>
      </div>
      <ConfirmationDialog open={!!pending} danger={pending?.danger} title={pending ? `${pending.label}?` : ""} confirmLabel={pending?.label ?? "Confirm"} confirmDisabled={!!pending?.needsReason && !reason.trim()} onCancel={() => setPending(null)} onConfirm={apply}
        body={pending?.id === "approve" ? "Approving publishes the project to the demo catalogue and the owner sees the new status." : undefined}>
        <TextAreaField label={pending?.needsReason ? "Reason (required)" : "Comment (optional)"} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmationDialog>
    </>
  );
}
