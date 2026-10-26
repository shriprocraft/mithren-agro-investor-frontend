"use client";

import Link from "next/link";
import { useState } from "react";
import { Callout, LinkButton, PageTitle, SelectField } from "@/components/common/ui";
import { ProjectStatusBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { categoryLabel, PROJECT_STATUS_LABEL, STAGE_LABEL } from "@/config/demo-config";
import { useOwner } from "@/hooks/useOwner";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatDate, formatINR } from "@/lib/format";
import type { Project } from "@/types";

export default function OwnerProjects() {
  const o = useOwner();
  const [status, setStatus] = useState("");
  const rows = o.projects.filter((p) => !status || p.status === status);
  const columns: Column<Project>[] = [
    { key: "t", header: "Project", sort: (p) => p.title, cell: (p) => (<div><Link href={`/owner/projects/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.title}</Link><span className="block text-xs text-muted">{categoryLabel(p.category)} · {p.location}</span></div>) },
    { key: "stage", header: "Stage", cell: (p) => STAGE_LABEL[p.stage] },
    { key: "st", header: "Status", cell: (p) => <ProjectStatusBadge status={p.status} /> },
    { key: "f", header: "Funding (sample)", sort: (p) => fundingProgress(p.funding) ?? -1, cell: (p) => (p.funding ? `${formatINR(p.funding.raised)} / ${formatINR(p.funding.target)}` : "—") },
    { key: "u", header: "Updated", sort: (p) => p.updatedAt, cell: (p) => formatDate(p.updatedAt) },
    { key: "a", header: "Actions", cell: (p) => (<div className="flex gap-2"><LinkButton variant="secondary" href={`/owner/projects/${p.id}`} className="min-h-9">Open</LinkButton>{["draft", "changes_requested"].includes(p.status) && <LinkButton variant="secondary" href={`/owner/projects/${p.id}/edit`} className="min-h-9">Edit</LinkButton>}</div>) },
  ];
  return (
    <>
      <PageTitle title="My projects" actions={<LinkButton href="/owner/projects/new">New project</LinkButton>} />
      <div className="mb-4 max-w-xs"><SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(PROJECT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField></div>
      <DataTable caption="My projects" rows={rows} columns={columns} rowKey={(p) => p.id} searchText={(p) => `${p.title} ${p.location} ${p.crop}`} emptyTitle="No projects" emptyBody="Create your first project to get started." />
      <Callout tone="info" className="mt-4">Only drafts and projects with changes requested can be edited. Approved projects need a controlled change request in a live product.</Callout>
    </>
  );
}
