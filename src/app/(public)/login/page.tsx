"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Callout, Card, LoadingPage, TextField } from "@/components/common/ui";
import { useDemo } from "@/context/DemoContext";
import { DEMO_LOGINS } from "@/data/users";
import { safeNext } from "@/lib/safe-next";
import { isEmail } from "@/lib/validation";

function LoginForm() {
  const { loginWithEmail, loginAs, state } = useDemo();
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
    if (!u) { setBusy(false); return setErrors({ form: "No demo account uses this email. Use a demo shortcut below, or create a demo account." }); }
    router.push(safeNext(next, u.role));
  };

  const shortcut = (userId: string) => {
    const u = state.users.find((x) => x.id === userId);
    if (!u) return;
    loginAs(userId);
    router.push(safeNext(next, u.role));
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 md:grid-cols-2">
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">Log in</h1>
        <p className="mt-1 text-sm text-muted">Demo session — no password is verified.</p>
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          {errors.form && <div role="alert" className="rounded-control bg-bad-bg p-3 text-sm text-bad-fg">{errors.form}</div>}
          <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <div className="relative">
            <TextField label="Password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-1 top-[1.65rem] grid size-10 place-items-center text-muted">{show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button>
          </div>
          <Button type="submit" loading={busy} className="w-full">Log in</Button>
          <div className="flex justify-between text-sm"><Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">Forgot password?</Link><Link href="/register" className="font-semibold text-brand-700 hover:underline">Create demo account</Link></div>
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-bold text-brand-900">Demo shortcuts</h2>
        <p className="mt-1 text-sm text-muted">Jump straight into a seeded workspace.</p>
        <ul className="mt-4 space-y-3">
          {DEMO_LOGINS.map((d) => (
            <li key={d.userId}><button type="button" onClick={() => shortcut(d.userId)} className="w-full rounded-control border border-line bg-earth-50 p-3 text-left hover:bg-brand-50"><span className="block font-semibold">{d.label}</span><span className="block text-xs text-muted">{d.hint}</span></button></li>
          ))}
        </ul>
        <Callout tone="neutral" className="mt-4">Demo session. Do not enter real credentials anywhere in this prototype.</Callout>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<LoadingPage />}><LoginForm /></Suspense>;
}
