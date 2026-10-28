"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CheckField, PageTitle, TextField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { updateProfile } from "@/lib/mock-service";
import { isPhone } from "@/lib/validation";

export default function ProfilePage() {
  const { user, run } = useDemo();
  const toast = useToast();
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", location: user?.location ?? "", alerts: user?.emailAlerts ?? true });
  const [e, setE] = useState<Record<string, string>>({});
  if (!user) return null;
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid 10-digit mobile number.";
    setE(er);
    if (Object.keys(er).length) return;
    run((s) => updateProfile(s, user.id, { name: f.name.trim(), phone: f.phone, location: f.location, emailAlerts: f.alerts }));
    toast("Profile saved (local demo data).", "ok");
  };
  return (
    <div>
      <PageTitle title="Profile" subtitle={<span className="flex items-center gap-2">Verification: <VerificationBadge status={user.verification} /></span>} />
      <Card className="max-w-4xl p-6!">
        <form onSubmit={submit} noValidate className="grid items-start gap-6 md:grid-cols-2">
          <TextField label="Full name" required value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} error={e.name} />
          <TextField label="Email" value={user.email} readOnly hint="Email cannot be changed in the demo." />
          <TextField label="Phone" type="tel" required value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} error={e.phone} />
          <TextField label="City" value={f.location} onChange={(x) => setF({ ...f, location: x.target.value })} />
          <div className="md:col-span-2"><CheckField checked={f.alerts} onChange={(v) => setF({ ...f, alerts: v })}>Show email-style alerts in my notifications (nothing is actually emailed).</CheckField></div>
          <div className="md:col-span-2"><Button type="submit">Save changes</Button></div>
        </form>
      </Card>
    </div>
  );
}
