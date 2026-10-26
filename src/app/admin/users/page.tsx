"use client";

import { useState } from "react";
import { Button, PageTitle, SelectField, DefList } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/feedback";
import { ROLE_LABEL } from "@/config/navigation";
import { useDemo } from "@/context/DemoContext";
import { formatDate } from "@/lib/format";
import type { DemoUser } from "@/types";

export default function AdminUsers() {
  const { state } = useDemo();
  const [role, setRole] = useState("");
  const [sel, setSel] = useState<DemoUser | null>(null);
  const rows = state.users.filter((u) => !role || u.role === role);
  const columns: Column<DemoUser>[] = [
    { key: "n", header: "User", sort: (u) => u.name, cell: (u) => <div><span className="font-semibold">{u.name}</span><span className="block text-xs text-muted">{u.email}</span></div> },
    { key: "r", header: "Role", sort: (u) => u.role, cell: (u) => ROLE_LABEL[u.role] },
    { key: "v", header: "Verification (demo)", cell: (u) => <VerificationBadge status={u.verification} /> },
    { key: "c", header: "Created", sort: (u) => u.createdAt, cell: (u) => formatDate(u.createdAt) },
    { key: "a", header: "", cell: (u) => <Button variant="secondary" className="min-h-9" onClick={() => setSel(u)}>View</Button> },
  ];
  return (
    <>
      <PageTitle title="Users" subtitle="Mock profiles. Role here is a UI label, not real access control." />
      <div className="mb-4 max-w-xs"><SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="investor">Investors</option><option value="owner">Project owners</option><option value="admin">Admins</option></SelectField></div>
      <DataTable caption="Users" rows={rows} columns={columns} rowKey={(u) => u.id} searchText={(u) => `${u.name} ${u.email} ${u.role}`} emptyTitle="No users match" />
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ""} wide>
        {sel && (<div className="space-y-4"><DefList rows={[["Email", sel.email], ["Phone", sel.phone], ["Role", ROLE_LABEL[sel.role]], ["Organisation", sel.orgName ?? "—"], ["Location", sel.location ?? "—"], ["Bank (masked)", sel.bank ? `${sel.bank.maskedAccount} · ${sel.bank.bankName}` : "None"]]} />
          <div><h3 className="mb-2 text-sm font-semibold">Verification checklist (demo)</h3><ul className="space-y-1 text-sm">{sel.checklist.map((c) => <li key={c.label} className="flex items-center justify-between gap-2"><span>{c.label}</span><VerificationBadge status={c.status} /></li>)}</ul></div>
          <div className="flex justify-end"><Button variant="secondary" onClick={() => setSel(null)}>Close</Button></div></div>)}
      </Modal>
    </>
  );
}
