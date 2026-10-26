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
    <div className="max-w-2xl">
      <PageTitle title="Profile" subtitle={<>Verification: <VerificationBadge status={user.verification} /></>} />
      <Card>
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField label="Full name" required value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} error={e.name} />
          <TextField label="Email" value={user.email} readOnly hint="Email cannot be changed in the demo." />
          <TextField label="Phone" type="tel" required value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} error={e.phone} />
          <TextField label="City" value={f.location} onChange={(x) => setF({ ...f, location: x.target.value })} />
          <CheckField checked={f.alerts} onChange={(v) => setF({ ...f, alerts: v })}>Show email-style alerts in my notifications (nothing is actually emailed).</CheckField>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
