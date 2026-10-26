"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, TextAreaField, TextField } from "@/components/common/ui";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { formatDate } from "@/lib/format";
import { addProjectUpdate, setMilestoneStatus } from "@/lib/mock-service";
import type { Project } from "@/types";

const LABEL = { planned: "Planned", in_progress: "In progress", done: "Done", delayed: "Delayed" } as const;
const TONE = { planned: "neutral", in_progress: "info", done: "ok", delayed: "warn" } as const;

export function MilestoneControls({ project }: { project: Project }) {
  const { run, actor } = useDemo();
  const toast = useToast();
  const locked = ["rejected_demo", "completed_demo"].includes(project.status);
  if (project.milestones.length === 0) return <p className="text-sm text-muted">No milestones yet.{project.status === "draft" ? " Add them in the project form." : ""}</p>;
  return (
    <ul className="space-y-3">
      {project.milestones.map((m) => (
        <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line bg-earth-50 p-3 text-sm">
          <div><p className="font-semibold">{m.title} <Badge tone={TONE[m.status]}>{LABEL[m.status]}</Badge></p><p className="text-xs text-muted">Planned {formatDate(m.plannedDate)}{m.actualDate ? ` · actual ${formatDate(m.actualDate)}` : ""}</p></div>
          <div className="flex flex-wrap gap-2">
            {m.status === "planned" && <Button variant="secondary" className="min-h-9" disabled={locked} onClick={() => run((s) => setMilestoneStatus(s, project.id, m.id, "in_progress", actor))}>Start</Button>}
            {m.status !== "done" && <Button variant="secondary" className="min-h-9" disabled={locked} title={locked ? "Project is closed" : undefined} onClick={() => { run((s) => setMilestoneStatus(s, project.id, m.id, "done", actor)); toast("Milestone marked done (self-reported, demo).", "ok"); }}>Mark done</Button>}
            {m.status !== "done" && m.status !== "delayed" && <Button variant="ghost" className="min-h-9" disabled={locked} onClick={() => run((s) => setMilestoneStatus(s, project.id, m.id, "delayed", actor))}>Flag delay</Button>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AddUpdateForm({ project }: { project: Project }) {
  const { run, actor } = useDemo();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const disabled = ["draft", "submitted", "under_review", "rejected_demo"].includes(project.status);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (title.trim().length < 3) er.title = "Add a short title.";
    if (body.trim().length < 10) er.body = "Add some detail (10+ characters).";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = run((s) => addProjectUpdate(s, project.id, title, `${body}${fileName ? ` [evidence: ${fileName}]` : ""}`, actor));
    toast(r.ok ? "Update posted (sample content, owner-reported)." : r.error, r.ok ? "ok" : "bad");
    if (r.ok) { setTitle(""); setBody(""); setFileName(""); }
  };

  if (disabled) return <p className="rounded-control bg-earth-100 p-3 text-sm text-muted">Updates can be posted once the project is approved (demo).</p>;
  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <TextField label="Update title" required value={title} onChange={(e) => setTitle(e.target.value)} error={err.title} />
      <TextAreaField label="Details" required value={body} onChange={(e) => setBody(e.target.value)} error={err.body} />
      <div><label htmlFor={`ev-${project.id}`} className="mb-1 block text-sm font-semibold">Evidence (optional, local preview only)</label><input id={`ev-${project.id}`} type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} className="block text-sm" /></div>
      <Button type="submit">Post update</Button>
    </form>
  );
}
