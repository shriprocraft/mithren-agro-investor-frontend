"use client";

import { Callout, PageTitle } from "@/components/common/ui";
import { DataTable, type Column } from "@/components/common/DataTable";
import { useDemo } from "@/context/DemoContext";
import { formatDateTime } from "@/lib/format";
import type { AuditEvent } from "@/types";

export default function AdminAudit() {
  const { state } = useDemo();
  const columns: Column<AuditEvent>[] = [
    { key: "at", header: "Time", sort: (a) => a.at, cell: (a) => formatDateTime(a.at) },
    { key: "actor", header: "Actor", sort: (a) => a.actor, cell: (a) => a.actor },
    { key: "act", header: "Action", cell: (a) => <span className="font-semibold">{a.action}</span> },
    { key: "ent", header: "Entity", cell: (a) => a.entity },
    { key: "ref", header: "Demo reference", cell: (a) => a.ref },
  ];
  return (
    <>
      <PageTitle title="Audit activity (demo)" subtitle="Local events for important actions in this browser session." />
      <DataTable caption="Audit events" rows={state.audit} columns={columns} rowKey={(a) => a.id} searchText={(a) => `${a.actor} ${a.action} ${a.entity} ${a.ref}`} pageSize={12} emptyTitle="No audit events" />
      <Callout tone="warn" className="mt-4">This is a UI demonstration, not a tamper-proof audit system. A live product needs server-side, append-only audit storage.</Callout>
    </>
  );
}
