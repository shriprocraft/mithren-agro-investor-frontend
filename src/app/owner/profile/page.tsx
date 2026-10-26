"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, PageTitle, TextField } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { updateProfile } from "@/lib/mock-service";
import { isPhone } from "@/lib/validation";

export default function OwnerProfile() {
  const { user, run } = useDemo();
  const toast = useToast();
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", org: user?.orgName ?? "", location: user?.location ?? "" });
  const [e, setE] = useState<Record<string, string>>({});
  if (!user) return null;
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid 10-digit mobile number.";
    if (f.org.trim().length < 2) er.org = "Enter your farm or organisation name.";
    setE(er);
    if (Object.keys(er).length) return;
    run((s) => updateProfile(s, user.id, { name: f.name.trim(), phone: f.phone, orgName: f.org.trim(), location: f.location }));
    toast("Profile saved (local demo data).", "ok");
  };
  return (
    <div className="max-w-2xl">
      <PageTitle title="Owner profile" subtitle={<>Verification: <VerificationBadge status={user.verification} /> (demo)</>} />
      <Card><form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Contact person" required value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} error={e.name} />
        <TextField label="Farm / organisation" required value={f.org} onChange={(x) => setF({ ...f, org: x.target.value })} error={e.org} />
        <TextField label="Email" value={user.email} readOnly />
        <TextField label="Phone" type="tel" required value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} error={e.phone} />
        <TextField label="Location" value={f.location} onChange={(x) => setF({ ...f, location: x.target.value })} />
        <Button type="submit">Save changes</Button>
      </form></Card>
    </div>
  );
}
