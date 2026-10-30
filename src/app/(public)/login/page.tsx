"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Callout, Card, TextField } from "@/components/common/ui";
import { LoginSkeleton } from "@/components/common/skeletons";
import { useDemo } from "@/context/DemoContext";
import { DEMO_CREDENTIALS } from "@/data/users";
import { safeNext } from "@/lib/safe-next";
import { isEmail } from "@/lib/validation";

function LoginForm() {
  const { loginWithEmail } = useDemo();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Enter your email.";
    else if (!isEmail(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Enter your password.";
    if (Object.keys(errs).length) return setErrors(errs);
    setBusy(true);
    // Demo only: the password is never checked or stored.
    const u = loginWithEmail(email);
    if (!u) { setBusy(false); return setErrors({ form: "No demo account uses this email. Use the demo credentials shown below." }); }
    router.push(safeNext(next));
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">Log in</h1>
        <p className="mt-1 text-sm text-muted">Demo session — no password is verified.</p>
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          {errors.form && <div role="alert" className="rounded-control bg-bad-bg p-3 text-sm text-bad-fg">{errors.form}</div>}
          <TextField label="Email" type="email" autoComplete="email" placeholder={DEMO_CREDENTIALS.email} required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <div className="relative">
            <TextField label="Password" type={show ? "text" : "password"} autoComplete="current-password" placeholder={DEMO_CREDENTIALS.password} required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-1 top-[1.65rem] grid size-10 place-items-center text-muted">{show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button>
          </div>
          <Button type="submit" loading={busy} className="w-full">Log in</Button>
          <div className="text-sm"><Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">Forgot password?</Link></div>
        </form>
      </Card>
      <section aria-labelledby="demo-creds" className="rounded-card border border-brand-200 bg-brand-50 p-4">
        <h2 id="demo-creds" className="text-sm font-bold uppercase tracking-wide text-brand-800">Demo credentials</h2>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">Demo Email:</dt><dd className="break-all font-semibold text-ink">{DEMO_CREDENTIALS.email}</dd>
          <dt className="text-muted">Demo Password:</dt><dd className="font-semibold text-ink">{DEMO_CREDENTIALS.password}</dd>
        </dl>
      </section>
      <Callout tone="neutral">Demo session. Do not enter real credentials anywhere in this prototype.</Callout>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<LoginSkeleton />}><LoginForm /></Suspense>;
}
