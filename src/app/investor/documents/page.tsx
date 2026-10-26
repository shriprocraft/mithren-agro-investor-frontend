"use client";

import { useState } from "react";
import { Badge, Button, Callout, PageTitle, SelectField } from "@/components/common/ui";
import { DataTable, type Column } from "@/components/common/DataTable";
import { DemoDocumentPreview } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDate } from "@/lib/format";
import { projectById } from "@/lib/project-helpers";
import type { DemoDocument } from "@/types";

export default function DocumentsPage() {
  const { state } = useDemo();
  const d = useInvestor();
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<DemoDocument | null>(null);
  const rows = d.documents.filter((x) => !cat || x.category === cat);
  const columns: Column<DemoDocument>[] = [
    { key: "title", header: "Document", sort: (x) => x.title, cell: (x) => <span className="font-semibold">{x.title}</span> },
    { key: "cat", header: "Category", cell: (x) => <span className="capitalize">{x.category}</span> },
    { key: "proj", header: "Related project", cell: (x) => (x.projectId ? projectById(state, x.projectId)?.title ?? "—" : "General") },
    { key: "date", header: "Date", sort: (x) => x.date, cell: (x) => formatDate(x.date) },
    { key: "act", header: "Availability", cell: (x) => x.available ? <Button variant="secondary" className="min-h-9" onClick={() => setOpen(x)}>View</Button> : <Badge tone="neutral">Unavailable in demo</Badge> },
  ];
  return (
    <>
      <PageTitle title="Documents" subtitle="Demonstration material only — nothing here is an executed agreement or official statement." />
      <div className="mb-4 max-w-xs"><SelectField label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All</option><option value="agreement">Agreements (sample)</option><option value="disclosure">Disclosures</option><option value="receipt">Receipts</option><option value="statement">Statements</option></SelectField></div>
      <DataTable caption="Documents" rows={rows} columns={columns} rowKey={(x) => x.id} searchText={(x) => x.title} emptyTitle="No documents" />
      <Callout tone="info" className="mt-4">Viewing opens a labelled placeholder. No file is generated or downloaded.</Callout>
      <DemoDocumentPreview open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} category={open?.category ?? ""} />
    </>
  );
}
