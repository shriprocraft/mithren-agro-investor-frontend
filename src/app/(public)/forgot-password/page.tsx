"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Callout, Card, TextField } from "@/components/common/ui";
import { isEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError("Enter a valid email address.");
    setError(undefined);
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">Reset password</h1>
        {sent ? (
          <div className="mt-4 space-y-4" role="status">
            <Callout tone="ok" title="Demo confirmation">If a demo account exists for {email}, a reset message would be sent in a live product. No email was sent.</Callout>
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to log in</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            <p className="text-sm text-muted">UI only — no email is sent in the prototype.</p>
            <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
            <Button type="submit" className="w-full">Send reset link</Button>
            <Link href="/login" className="block text-center text-sm font-semibold text-brand-700 hover:underline">Back to log in</Link>
          </form>
        )}
      </Card>
    </div>
  );
}
