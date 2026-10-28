"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { COPY } from "@/config/demo-config";
import { PUBLIC_NAV, ROLE_HOME } from "@/config/navigation";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/cn";
import { LinkButton } from "@/components/common/ui";
import { HeaderActions } from "./HeaderActions";

/** Brand logo (public/logo.png, trimmed from the supplied artwork). Multiply-blend lets its white background
 *  take on the page colour; on the dark footer it sits on a white pill instead. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="Mithren Agro Pvt. Ltd. — home" className={cn("inline-flex shrink-0 items-center", light && "rounded-control bg-white px-3 py-2")}>
      <Image src="/logo.png" alt="Mithren Agro Pvt. Ltd." width={1394} height={648} priority className={cn("h-12 w-auto sm:h-14", !light && "mix-blend-multiply")} />
    </Link>
  );
}

export function DemoBanner() {
  const { session } = useDemo();
  return (
    <div className="border-b border-line bg-white px-4 py-2 text-center text-xs font-semibold text-brand-900" role="note">
      DEMO MODE — {COPY.demoShort}{session ? ` Signed in as demo ${session.role}.` : ""}
    </div>
  );
}

export function PublicHeader() {
  const { session, ready } = useDemo();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <DemoBanner />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {PUBLIC_NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname.startsWith(n.href) ? "page" : undefined} className={cn("rounded-control px-3 py-2 text-sm font-semibold hover:bg-brand-50", pathname.startsWith(n.href) ? "text-brand-800" : "text-muted")}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {ready && session ? (
            <>
              <span className="hidden sm:inline-flex"><LinkButton href={ROLE_HOME[session.role]} variant="secondary">My workspace</LinkButton></span>
              <HeaderActions />
            </>
          ) : (
            <>
              <span className="hidden sm:inline-flex"><LinkButton href="/login" variant="ghost">Log in</LinkButton></span>
              <LinkButton href="/register">Get started</LinkButton>
            </>
          )}
          <button type="button" className="grid size-11 place-items-center rounded-control border border-line md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-line bg-white px-4 py-2 md:hidden">
          {PUBLIC_NAV.map((n) => (<Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block min-h-11 py-3 text-sm font-semibold">{n.label}</Link>))}
          {!session && <Link href="/login" onClick={() => setOpen(false)} className="block min-h-11 py-3 text-sm font-semibold">Log in</Link>}
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  const col = "space-y-2 text-sm";
  const a = "text-muted hover:text-brand-700 hover:underline";
  return (
    <footer className="mt-16 border-t border-line bg-white text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-md text-sm text-muted">{COPY.demoLong}</p>
        </div>
        <ul className={col}>
          <li className="font-semibold">Platform</li>
          <li><Link className={a} href="/projects">Browse projects</Link></li>
          <li><Link className={a} href="/how-it-works">How it works</Link></li>
          <li><Link className={a} href="/about">About</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold">Information</li>
          <li><Link className={a} href="/risk-disclosure">Risk disclosure</Link></li>
          <li><Link className={a} href="/faq">FAQ</Link></li>
          <li><Link className={a} href="/login">Log in</Link></li>
        </ul>
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        Prototype only. Not investment advice. {COPY.noGuarantee}
      </p>
      <p className="px-4 pb-5 text-center text-xs text-muted">
        Powered by{" "}
        <a
          href="https://shriprocraft.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-700 underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
        >
          Shri Pro Craft
        </a>
      </p>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-3">Skip to content</a>
      <PublicHeader />
      <main id="main">{children}</main>
      <PublicFooter />
    </>
  );
}
