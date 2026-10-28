"use client";

import { useState, type FormEvent } from "react";
import { Button, Callout, Card, EmptyState, PageTitle, SelectField, TextAreaField, TextField } from "@/components/common/ui";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { formatDateTime } from "@/lib/format";
import { addTicket } from "@/lib/mock-service";

export default function SupportPage() {
  const { state, user, run } = useDemo();
  const toast = useToast();
  const [topic, setTopic] = useState("General question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  if (!user) return null;
  const mine = state.tickets.filter((t) => t.userId === user.id);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (subject.trim().length < 3) er.subject = "Add a short subject.";
    if (message.trim().length < 10) er.message = "Describe your question (10+ characters).";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = run((s) => addTicket(s, user.id, `${topic}: ${subject}`, message));
    if (r.ok) { toast(`Demo request ${r.data} recorded locally. Nobody will reply.`, "ok"); setSubject(""); setMessage(""); }
  };

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2"><PageTitle title="Help & support" subtitle="UI-only support form. Requests stay in your browser." /></div>
      <Card>
        <form onSubmit={submit} noValidate className="space-y-4">
          <SelectField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}><option>General question</option><option>Investment</option><option>Exit request</option><option>Withdrawal</option><option>Complaint</option></SelectField>
          <TextField label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} error={err.subject} />
          <TextAreaField label="Message" required value={message} onChange={(e) => setMessage(e.target.value)} error={err.message} />
          <Button type="submit">Send (demo)</Button>
        </form>
        <Callout tone="neutral" className="mt-4">Do not include real personal or financial information.</Callout>
      </Card>
      <div>
        <h2 className="mb-3 text-lg font-bold text-brand-900">Your demo requests</h2>
        {mine.length === 0 ? <EmptyState title="No requests yet" /> : <ul className="space-y-3">{mine.map((t) => (<li key={t.id} className="rounded-card border border-line bg-white p-4 text-sm shadow-card"><p className="font-semibold">{t.subject}</p><p className="text-muted">{t.message}</p><p className="mt-1 text-xs text-muted">{t.id} · {formatDateTime(t.at)}</p></li>))}</ul>}
      </div>
    </div>
  );
}
