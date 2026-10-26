"use client";

import { useState } from "react";
import { Button, Callout, PageTitle, SelectField, TextAreaField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { VERIFICATION_LABEL } from "@/config/demo-config";
import { ROLE_LABEL } from "@/config/navigation";
import { useDemo } from "@/context/DemoContext";
import { setVerification } from "@/lib/mock-service";
import type { DemoUser, VerificationStatus } from "@/types";

const ACTIONS: { to: VerificationStatus; label: string; reason: boolean; from: VerificationStatus[] }[] = [
  { to: "under_review", label: "Start review", reason: false, from: ["submitted"] },
  { to: "approved_demo", label: "Approve (demo)", reason: false, from: ["submitted", "under_review"] },
  { to: "action_required", label: "Action required", reason: true, from: ["submitted", "under_review"] },
  { to: "rejected_demo", label: "Reject (demo)", reason: true, from: ["submitted", "under_review"] },
];

export default function AdminVerifications() {
  const { state, run, actor } = useDemo();
  const toast = useToast();
  const [filter, setFilter] = useState("open");
  const [pending, setPending] = useState<{ user: DemoUser; a: (typeof ACTIONS)[number] } | null>(null);
  const [reason, setReason] = useState("");
  const rows = state.users.filter((u) => u.role !== "admin" && (filter === "open" ? ["submitted", "under_review", "action_required"].includes(u.verification) : filter === "" ? true : u.verification === filter));

  const columns: Column<DemoUser>[] = [
    { key: "n", header: "Applicant", sort: (u) => u.name, cell: (u) => <div><span className="font-semibold">{u.name}</span><span className="block text-xs text-muted">{u.email} · {ROLE_LABEL[u.role]}</span></div> },
    { key: "v", header: "Status", cell: (u) => <VerificationBadge status={u.verification} /> },
    { key: "c", header: "Checklist", cell: (u) => <span className="text-xs text-muted">{u.checklist.filter((c) => c.status === "approved_demo").length}/{u.checklist.length} approved</span> },
    { key: "a", header: "Actions", cell: (u) => { const av = ACTIONS.filter((a) => a.from.includes(u.verification)); return av.length === 0 ? <span className="text-xs text-muted">No actions for this status</span> : <div className="flex flex-wrap gap-1.5">{av.map((a) => <Button key={a.to} variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { setReason(""); setPending({ user: u, a }); }}>{a.label}</Button>)}</div>; } },
  ];
  const apply = () => {
    if (!pending) return;
    const r = run((s) => setVerification(s, pending.user.id, pending.a.to, reason.trim(), actor));
    toast(r.ok ? `${pending.user.name}: ${VERIFICATION_LABEL[pending.a.to]}` : r.error, r.ok ? "ok" : "bad");
    setPending(null);
  };
  return (
    <>
      <PageTitle title="Verification cases" subtitle="Sample cases only — this is not real identity verification." />
      <div className="mb-4 max-w-xs"><SelectField label="Show" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="open">Open cases</option><option value="">All</option>{Object.entries(VERIFICATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField></div>
      <DataTable caption="Verification cases" rows={rows} columns={columns} rowKey={(u) => u.id} searchText={(u) => `${u.name} ${u.email}`} emptyTitle="No cases in this view" />
      <Callout tone="info" className="mt-4">The applicant sees status changes and your reason in their demo notifications.</Callout>
      <ConfirmationDialog open={!!pending} title={pending ? `${pending.a.label} — ${pending.user.name}?` : ""} confirmLabel={pending?.a.label ?? "Confirm"} confirmDisabled={!!pending?.a.reason && !reason.trim()} danger={pending?.a.to === "rejected_demo"} onCancel={() => setPending(null)} onConfirm={apply}>
        <TextAreaField label={pending?.a.reason ? "Reason (required)" : "Comment (optional)"} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmationDialog>
    </>
  );
}
