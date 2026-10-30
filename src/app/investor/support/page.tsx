"use client";

import { useState, type FormEvent } from "react";
import { Button, Callout, Card, PageTitle, SelectField, TextAreaField, TextField } from "@/components/common/ui";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { addTicket } from "@/lib/mock-service";

const TOPICS = [
  "General question",
  "Investment",
  "Portfolio",
  "Exit request",
  "Payments and withdrawals",
  "Account and verification",
  "Technical issue",
  "Complaint",
  "Other",
];

export default function SupportPage() {
  const { user, run } = useDemo();
  const toast = useToast();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  if (!user) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!topic) er.topic = "Select a support topic.";
    if (subject.trim().length < 3) er.subject = "Add a short subject.";
    if (message.trim().length < 10) er.message = "Describe your question (10+ characters).";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = run((s) => addTicket(s, user.id, `${topic}: ${subject}`, message));
    if (r.ok) {
      setSaved(r.data);
      toast(`Demo request ${r.data} saved in this browser.`, "ok");
      setTopic(""); setSubject(""); setMessage("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Help & support" subtitle="UI-only support form. Requests stay in your browser." />
      <Card className="p-5! sm:p-8!">
        {saved && (
          <Callout tone="ok" title="Demo request saved" className="mb-6">
            Reference {saved}. Your request was saved locally in this browser only. It has not been sent to Mithren Agro or any support team, and nobody will reply.
          </Callout>
        )}
        <form onSubmit={submit} noValidate className="space-y-5">
          <SelectField label="Topic" required value={topic} onChange={(e) => setTopic(e.target.value)} error={err.topic}>
            <option value="" disabled>Select a support topic</option>
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </SelectField>
          <TextField label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} error={err.subject} placeholder="Briefly describe your issue" />
          <TextAreaField label="Message" required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} error={err.message} placeholder="Explain your question or issue in detail..." />
          <Callout tone="neutral">Do not include real personal or financial information.</Callout>
          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto">Send (demo)</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
