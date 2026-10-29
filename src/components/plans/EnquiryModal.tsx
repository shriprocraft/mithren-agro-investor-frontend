"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/common/feedback";
import { Button, Callout, SelectField, TextAreaField, TextField } from "@/components/common/ui";
import { CATEGORIES } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { addEnquiry } from "@/lib/mock-service";
import { publishedProjects } from "@/lib/project-helpers";
import { parseAmount } from "@/lib/validation";

export type EnquiryPrefill = { projectId?: string; planId?: string; amount?: number; heading?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{10,15}$/;

function EnquiryForm({ prefill, onClose }: { prefill: EnquiryPrefill; onClose: () => void }) {
  const { state, user, run } = useDemo();
  const projects = publishedProjects(state);
  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.email ?? "");
  const [projectId, setProjectId] = useState(prefill.projectId ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const effectiveCategory = project?.category ?? categoryId;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const er: Record<string, string> = {};
    if (name.trim().length < 2) er.name = "Enter your name.";
    if (!EMAIL_RE.test(contact.trim()) && !PHONE_RE.test(contact.trim())) er.contact = "Enter a valid email address or phone number.";
    if (amount.trim() !== "") { const p = parseAmount(amount); if (!p.ok) er.amount = p.error; }
    if (message.length > 1000) er.message = "Keep the message under 1,000 characters.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSubmitting(true);
    const r = run((s) => addEnquiry(s, { userId: user?.id ?? null, name, contact, projectId: projectId || null, categoryId: effectiveCategory || null, planId: prefill.planId ?? null, amount, message }));
    setSubmitting(false);
    if (r.ok) setDone(r.data);
    else setErrors({ form: r.error });
  };

  if (done) {
    return (
      <div className="space-y-4 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-brand-600" aria-hidden />
        <p className="font-semibold text-brand-900">Enquiry recorded</p>
        <p className="text-sm text-muted">Reference {done}. This prototype stores enquiries in your browser only; no team member has received it yet because no backend endpoint is connected.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {prefill.heading && <p className="text-sm text-muted">{prefill.heading}</p>}
      {errors.form && <div role="alert" className="rounded-control bg-bad-bg p-3 text-sm text-bad-fg">{errors.form}</div>}
      <TextField label="Name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="Your full name" />
      <TextField label="Email or phone number" required autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} error={errors.contact} placeholder="name@example.com or 9876543210" />
      <SelectField label="Agricultural project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        <option value="">No specific project</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </SelectField>
      <SelectField label="Project category" value={effectiveCategory} onChange={(e) => setCategoryId(e.target.value)} disabled={!!project} hint={project ? "Set by the selected project." : undefined}>
        <option value="">Any category</option>
        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </SelectField>
      <TextField label="Preferred contribution amount (₹)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} placeholder="e.g. 25000" />
      <TextAreaField label="Message" value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} placeholder="Tell us what you would like to discuss" maxLength={1000} />
      <Callout tone="neutral">An enquiry is not a commitment, and contributions are not guaranteed returns.</Callout>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>Send enquiry</Button>
      </div>
    </form>
  );
}

export function EnquiryModal({ open, onClose, prefill = {} }: { open: boolean; onClose: () => void; prefill?: EnquiryPrefill }) {
  return (
    <Modal open={open} onClose={onClose} title="Contribution enquiry" wide>
      <div className="max-h-[75dvh] overflow-y-auto p-1">
        <EnquiryForm prefill={prefill} onClose={onClose} />
      </div>
    </Modal>
  );
}
