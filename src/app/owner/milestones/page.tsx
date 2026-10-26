"use client";

import { useState } from "react";
import { Card, EmptyState, PageTitle, SelectField } from "@/components/common/ui";
import { AddUpdateForm, MilestoneControls } from "@/components/owner/ProgressPanel";
import { useOwner } from "@/hooks/useOwner";

export default function OwnerMilestones() {
  const o = useOwner();
  const usable = o.projects.filter((p) => p.status !== "rejected_demo");
  const [id, setId] = useState("");
  const sel = usable.find((p) => p.id === id) ?? usable[0];
  if (!sel) return <><PageTitle title="Milestones & updates" /><EmptyState title="No projects yet" body="Create a project to track milestones." /></>;
  return (
    <>
      <PageTitle title="Milestones & updates" subtitle="Self-reported progress. Reviewers see these as owner-provided until checked." />
      <div className="mb-4 max-w-md"><SelectField label="Project" value={sel.id} onChange={(e) => setId(e.target.value)}>{usable.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</SelectField></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Milestones</h2><MilestoneControls project={sel} /></Card>
        <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Post an update</h2><AddUpdateForm project={sel} /></Card>
      </div>
    </>
  );
}
