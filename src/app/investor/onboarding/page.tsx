"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Card, CheckField, DefList, LinkButton, PageTitle, SelectField, TextField } from "@/components/common/ui";
import { Stepper } from "@/components/common/Stepper";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { saveBank, submitVerification, updateProfile } from "@/lib/mock-service";
import { isPhone } from "@/lib/validation";

const STEPS = ["Personal details", "Investor profile", "Identity (demo)", "Bank (demo)", "Review", "Complete"];

export default function InvestorOnboarding() {
  const { user, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", city: user?.location ?? "", state: "", pin: "", experience: "", understand: false, fileName: "", holder: user?.name ?? "", bankName: "Demo Bank (fictional)", masked: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  const validate = (s: number): Record<string, string> => {
    const er: Record<string, string> = {};
    if (s === 0) {
      if (f.name.trim().length < 2) er.name = "Enter your full name.";
      if (!isPhone(f.phone)) er.phone = "Enter a valid 10-digit mobile number.";
      if (!f.city.trim()) er.city = "Enter your city.";
      if (!f.state.trim()) er.state = "Enter your state.";
      if (!/^\d{6}$/.test(f.pin)) er.pin = "Enter a 6-digit PIN code.";
    }
    if (s === 1) {
      if (!f.experience) er.experience = "Choose an option.";
      if (!f.understand) er.understand = "Please confirm you have read the risk information.";
    }
    if (s === 2 && !f.fileName) er.file = "Choose any local file to preview. It is not uploaded anywhere.";
    if (s === 3 && !/^X{4} \d{4}$/.test(f.masked)) er.masked = "Use the masked demo format XXXX 1234 (fictional account).";
    return er;
  };

  const next = () => {
    const er = validate(step);
    setE(er);
    if (Object.keys(er).length) return;
    if (step === 4) {
      run((s) => updateProfile(s, user!.id, { name: f.name, phone: f.phone, location: f.city }));
      const b = run((s) => saveBank(s, user!.id, { holderName: f.holder, bankName: f.bankName, maskedAccount: f.masked }));
      const v = run((s) => submitVerification(s, user!.id));
      if (!b.ok) return setE({ masked: b.error });
      if (!v.ok) toast(v.error, "warn");
    }
    setStep(step + 1);
  };

  return (
    <div className="max-w-2xl">
      <PageTitle title="Investor onboarding (demo)" subtitle="Simulated steps only. No identity or bank check actually happens." />
      <Stepper steps={STEPS} current={step} />
      <Card className="space-y-4">
        {step === 0 && (<>
          <TextField label="Full name" required value={f.name} onChange={(x) => set("name", x.target.value)} error={e.name} />
          <TextField label="Email" value={user?.email ?? ""} readOnly hint="Set at registration" />
          <TextField label="Phone" type="tel" required value={f.phone} onChange={(x) => set("phone", x.target.value)} error={e.phone} />
          <div className="grid gap-4 sm:grid-cols-3"><TextField label="City" required value={f.city} onChange={(x) => set("city", x.target.value)} error={e.city} /><TextField label="State" required value={f.state} onChange={(x) => set("state", x.target.value)} error={e.state} /><TextField label="PIN code" required inputMode="numeric" value={f.pin} onChange={(x) => set("pin", x.target.value)} error={e.pin} /></div>
        </>)}
        {step === 1 && (<>
          <SelectField label="Prior experience with agriculture or financial products" required value={f.experience} onChange={(x) => set("experience", x.target.value)} error={e.experience}><option value="">Select…</option><option>None</option><option>Some</option><option>Experienced</option></SelectField>
          <Callout tone="info">This is a placeholder question, not a legal suitability test. The real eligibility questionnaire is a pending decision.</Callout>
          <CheckField checked={f.understand} onChange={(v) => set("understand", v)} error={e.understand}>I have read the risk information and understand outcomes are uncertain.</CheckField>
        </>)}
        {step === 2 && (<>
          <label className="block text-sm font-semibold" htmlFor="idfile">Identity document (local preview only)</label>
          <input id="idfile" type="file" accept="image/*,.pdf" onChange={(x) => set("fileName", x.target.files?.[0]?.name ?? "")} className="block w-full text-sm" />
          {e.file && <p role="alert" className="text-xs font-medium text-bad-fg">{e.file}</p>}
          {f.fileName && <p className="text-sm text-muted">Selected: {f.fileName} (stays in your browser; nothing is uploaded or stored).</p>}
          <Callout tone="warn">Do not choose real identity documents. Use any sample file.</Callout>
        </>)}
        {step === 3 && (<>
          <TextField label="Account holder" value={f.holder} onChange={(x) => set("holder", x.target.value)} />
          <TextField label="Bank name" value={f.bankName} onChange={(x) => set("bankName", x.target.value)} />
          <TextField label="Masked account (fictional)" required value={f.masked} onChange={(x) => set("masked", x.target.value.toUpperCase())} error={e.masked} hint="Format: XXXX 1234. Never enter a real account number." />
        </>)}
        {step === 4 && (<><DefList rows={[["Name", f.name], ["Phone", f.phone], ["Location", `${f.city}, ${f.state} ${f.pin}`], ["Experience", f.experience], ["Identity file", f.fileName || "—"], ["Bank (masked)", f.masked]]} /><p className="text-sm text-muted">Submitting records a demo verification request. Go back to edit anything.</p></>)}
        {step === 5 && (<div className="space-y-3" role="status"><h2 className="text-xl font-bold text-brand-900">Demo onboarding complete</h2><p className="text-sm text-muted">Current mock verification status: {user && <VerificationBadge status={user.verification} />}</p><p className="text-sm text-muted">An admin can approve this in the demo admin workspace. This is not a real identity check.</p><div className="flex gap-2"><LinkButton href="/investor/dashboard">Go to dashboard</LinkButton><LinkButton variant="secondary" href="/investor/verification">View checklist</LinkButton></div></div>)}
        {step < 5 && (
          <div className="flex justify-between gap-2 pt-2"><Button variant="secondary" disabled={step === 0} onClick={() => { setE({}); setStep(step - 1); }}>Back</Button><div className="flex gap-2"><Button variant="ghost" onClick={() => router.push("/investor/dashboard")}>Skip for now</Button><Button onClick={next}>{step === 4 ? "Submit (demo)" : "Continue"}</Button></div></div>
        )}
      </Card>
    </div>
  );
}
