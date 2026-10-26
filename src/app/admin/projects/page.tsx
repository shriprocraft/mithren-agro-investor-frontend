"use client";

import Link from "next/link";
import { useState } from "react";
import { LinkButton, PageTitle, SelectField } from "@/components/common/ui";
import { ProjectStatusBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { categoryLabel, PROJECT_STATUS_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { formatDate } from "@/lib/format";
import { analysisCompleteness, COMPLETENESS_LABEL } from "@/lib/project-helpers";
import type { Project } from "@/types";

export default function AdminProjects() {
  const { state } = useDemo();
  const [status, setStatus] = useState("queue");
  const rows = state.projects.filter((p) => (status === "queue" ? ["submitted", "under_review", "changes_requested"].includes(p.status) : status === "" ? true : p.status === status));
  const owner = (p: Project) => state.users.find((u) => u.id === p.ownerId)?.orgName ?? p.ownerId;
  const columns: Column<Project>[] = [
    { key: "t", header: "Project", sort: (p) => p.title, cell: (p) => (<div><Link href={`/admin/projects/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.title}</Link><span className="block text-xs text-muted">{categoryLabel(p.category)} · {p.location}</span></div>) },
    { key: "o", header: "Owner", cell: (p) => owner(p) },
    { key: "a", header: "Analysis", cell: (p) => COMPLETENESS_LABEL[analysisCompleteness(p)] },
    { key: "s", header: "Status", cell: (p) => <ProjectStatusBadge status={p.status} /> },
    { key: "u", header: "Updated", sort: (p) => p.updatedAt, cell: (p) => formatDate(p.updatedAt) },
    { key: "r", header: "", cell: (p) => <LinkButton variant="secondary" href={`/admin/projects/${p.id}`} className="min-h-9">Review</LinkButton> },
  ];
  return (
    <>
      <PageTitle title="Project review queue" subtitle="Filter, open and simulate decisions on submitted projects." />
      <div className="mb-4 max-w-xs"><SelectField label="Show" value={status} onChange={(e) => setStatus(e.target.value)}><option value="queue">Needs attention</option><option value="">All projects</option>{Object.entries(PROJECT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField></div>
      <DataTable caption="Project review queue" rows={rows} columns={columns} rowKey={(p) => p.id} searchText={(p) => `${p.title} ${p.location} ${owner(p)}`} emptyTitle="Queue is empty" emptyBody="No projects match this view." />
    </>
  );
}
