"use client";

import { useState } from "react";
import { Button, Callout, Card, LinkButton, PageTitle, SelectField, TextAreaField, TextField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useDemo } from "@/context/DemoContext";
import { submitVerification, updateProfile } from "@/lib/mock-service";
import { isPhone } from "@/lib/validation";

export default function OwnerOnboarding() {
  const { user, run } = useDemo();
  const [f, setF] = useState({ org: user?.orgName ?? "", contact: user?.name ?? "", phone: user?.phone ?? "", location: "", region: "", overview: "", experience: "", fileName: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  if (!user) return null;

  const submit = () => {
    const er: Record<string, string> = {};
    if (f.org.trim().length < 2) er.org = "Enter your farm or organisation name.";
    if (f.contact.trim().length < 2) er.contact = "Enter a contact person.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid 10-digit mobile number.";
    if (!f.location.trim()) er.location = "Enter your location.";
    if (f.overview.trim().length < 20) er.overview = "Describe your farm or business (20+ characters).";
    if (!f.experience) er.experience = "Choose an option.";
    setE(er);
    if (Object.keys(er).length) return;
    run((s) => updateProfile(s, user.id, { name: f.contact, phone: f.phone, orgName: f.org, location: f.location }));
    run((s) => submitVerification(s, user.id));
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-2xl"><PageTitle title="Owner onboarding submitted (demo)" /><Card className="space-y-3"><p className="text-sm">Status: <VerificationBadge status={user.verification} />. No land title, business registration or certification has been verified — this is a simulation.</p><div className="flex gap-2"><LinkButton href="/owner/dashboard">Go to dashboard</LinkButton><LinkButton variant="secondary" href="/owner/projects/new">Start a project</LinkButton></div></Card></div>
    );
  }
  return (
    <div className="max-w-2xl">
      <PageTitle title="Project-owner onboarding (demo)" subtitle="Tell us about your farm or business. Nothing is verified in the prototype." />
      <Card className="space-y-4">
        <TextField label="Farm or organisation name" required value={f.org} onChange={(x) => set("org", x.target.value)} error={e.org} />
        <div className="grid gap-4 sm:grid-cols-2"><TextField label="Contact person" required value={f.contact} onChange={(x) => set("contact", x.target.value)} error={e.contact} /><TextField label="Phone" type="tel" required value={f.phone} onChange={(x) => set("phone", x.target.value)} error={e.phone} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><TextField label="Location" required value={f.location} onChange={(x) => set("location", x.target.value)} error={e.location} /><TextField label="Operating region" value={f.region} onChange={(x) => set("region", x.target.value)} /></div>
        <TextAreaField label="Farm / business overview" required value={f.overview} onChange={(x) => set("overview", x.target.value)} error={e.overview} />
        <SelectField label="Years of agriculture experience" required value={f.experience} onChange={(x) => set("experience", x.target.value)} error={e.experience}><option value="">Select…</option><option>Less than 2</option><option>2–5</option><option>5–10</option><option>More than 10</option></SelectField>
        <div><label htmlFor="odoc" className="mb-1 block text-sm font-semibold">Supporting document (optional, local preview only)</label><input id="odoc" type="file" onChange={(x) => set("fileName", x.target.files?.[0]?.name ?? "")} className="block text-sm" />{f.fileName && <p className="mt-1 text-xs text-muted">Selected: {f.fileName} — stays in your browser.</p>}</div>
        <Callout tone="warn">Do not choose real documents. Land, licence and certification checks are not performed in this prototype.</Callout>
        <div className="flex justify-end"><Button onClick={submit}>Submit (demo)</Button></div>
      </Card>
    </div>
  );
}
