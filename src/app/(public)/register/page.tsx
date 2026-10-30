"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Card, CheckField, TextField } from "@/components/common/ui";
import { useDemo } from "@/context/DemoContext";
import { registerUser } from "@/lib/mock-service";
import { isEmail, isPhone, isStrongEnough } from "@/lib/validation";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "terms" | "org" | "form", string>>;

export default function RegisterPage() {
  const { run, loginAs } = useDemo();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "", role: "investor" as const, org: "", terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const er: Errors = {};
    if (f.name.trim().length < 2) er.name = "Enter your full name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (!isPhone(f.phone)) er.phone = "Enter a 10-digit Indian mobile number (format check only).";
    if (!isStrongEnough(f.password)) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    if (!f.terms) er.terms = "Please acknowledge the demo terms to continue.";
    if (Object.keys(er).length) return setErrors(er);

    setBusy(true);
    const r = run((s) => registerUser(s, { name: f.name, email: f.email, phone: f.phone, role: "investor" }));
    if (!r.ok) { setBusy(false); return setErrors({ form: r.error }); }
    loginAs(r.data.id);
    router.push("/investor/onboarding");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">Create a demo account</h1>
        <p className="mt-1 text-sm text-muted">This creates a local record in your browser only. It is not legally verified or approved.</p>
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          {errors.form && <div role="alert" className="rounded-control bg-bad-bg p-3 text-sm text-bad-fg">{errors.form}</div>}
          <TextField label="Full name" autoComplete="name" required value={f.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
          <TextField label="Email" type="email" autoComplete="email" required value={f.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
          <TextField label="Phone number" type="tel" autoComplete="tel" required value={f.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} hint="Example: 9876543210" />
          <TextField label="Password" type="password" autoComplete="new-password" required value={f.password} onChange={(e) => set("password", e.target.value)} error={errors.password} hint="Demo only — never reuse a real password." />
          <TextField label="Confirm password" type="password" autoComplete="new-password" required value={f.confirm} onChange={(e) => set("confirm", e.target.value)} error={errors.confirm} />
          <CheckField checked={f.terms} onChange={(v) => set("terms", v)} error={errors.terms}>I understand this is a demo with placeholder terms and privacy text, and that no real account, money or verification is involved.</CheckField>
          <Button type="submit" loading={busy} className="w-full">Create demo account</Button>
        </form>
        <p className="mt-4 text-sm text-muted">Already have a demo account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></p>
      </Card>
      <Callout tone="neutral" className="mt-4">Passwords are never stored or checked in this prototype.</Callout>
    </div>
  );
}
