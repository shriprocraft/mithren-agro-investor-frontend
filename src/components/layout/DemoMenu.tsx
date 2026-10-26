"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, RotateCcw, User, Users } from "lucide-react";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { ROLE_HOME, ROLE_LABEL } from "@/config/navigation";
import type { Role } from "@/types";

const SWITCH: { role: Role; userId: string }[] = [
  { role: "investor", userId: "inv-1" },
  { role: "owner", userId: "owner-1" },
  { role: "admin", userId: "admin-1" },
];

/** Demo-only convenience. NOT an authorization mechanism. */
export function DemoMenu() {
  const { session, loginAs, logout, resetDemo } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!session) return null;
  const item = "flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-earth-100";

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${session.name}`} onClick={() => setOpen(!open)} className="group inline-flex min-h-12 items-center gap-2 rounded-full pr-1 text-ink transition-colors sm:gap-3 sm:pr-2">
        <span className="grid size-12 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#ffffff,#F0F9F4_70%)] shadow-[0_4px_18px_rgba(46,125,50,0.16)] ring-1 ring-brand-100 transition-all duration-200 group-hover:shadow-[0_6px_22px_rgba(46,125,50,0.28)] group-hover:ring-brand-200">
          <User className="size-5 text-brand-600" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="hidden text-base font-medium tracking-tight transition-colors group-hover:text-brand-600 sm:inline">Account</span>
        <ChevronDown className={`hidden size-4 text-muted transition-transform duration-200 group-hover:text-brand-600 sm:block ${open ? "rotate-180" : ""}`} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label="Demo menu" className="absolute right-0 z-40 mt-1 w-64 overflow-hidden rounded-card border border-line bg-white shadow-card">
          <p className="border-b border-line px-3 py-2 text-xs text-muted">Demo session · {ROLE_LABEL[session.role]}<br />{session.email}</p>
          <p className="px-3 pt-2 text-xs font-semibold uppercase text-muted">Switch demo role</p>
          {SWITCH.map((s) => (
            <button key={s.role} role="menuitem" type="button" className={item} onClick={() => { loginAs(s.userId); setOpen(false); router.push(ROLE_HOME[s.role]); }}>
              <Users className="size-4" aria-hidden /> {ROLE_LABEL[s.role]} {session.role === s.role && <span className="ml-auto text-xs text-muted">current</span>}
            </button>
          ))}
          <div className="border-t border-line" />
          <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); setConfirmReset(true); }}><RotateCcw className="size-4" aria-hidden /> Reset demo data</button>
          <button role="menuitem" type="button" className={item} onClick={() => { logout(); setOpen(false); router.push("/"); toast("Signed out of the demo session.", "neutral"); }}><LogOut className="size-4" aria-hidden /> Log out</button>
        </div>
      )}
      <ConfirmationDialog
        open={confirmReset}
        title="Reset demo data?"
        body="This restores all seeded sample records and removes any demo records you created in this browser."
        confirmLabel="Reset demo data"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { resetDemo(); setConfirmReset(false); toast("Demo data restored to the seeded state.", "ok"); router.push(ROLE_HOME[session.role]); }}
      />
    </div>
  );
}
