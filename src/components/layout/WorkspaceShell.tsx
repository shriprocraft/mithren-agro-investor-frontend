"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { LinkButton, LoadingPage, EmptyState } from "@/components/common/ui";
import { INVESTOR_NAV_GROUPS, type NavItem, ROLE_HOME, ROLE_LABEL, WORKSPACE_NAV } from "@/config/navigation";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/cn";
import type { Role } from "@/types";
import { HeaderActions } from "./HeaderActions";
import { DemoBanner, Logo } from "./PublicLayout";

/** Role-aware shell. The role guard is a UI convenience only — real authorization must be server-side. */
export function WorkspaceShell({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, session } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  // Drawer is "open" only for the path it was opened on, so navigating closes it without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawer = drawerPath === pathname;
  const setDrawer = (open: boolean) => setDrawerPath(open ? pathname : null);
  useEffect(() => {
    if (ready && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, session, router, pathname]);

  if (!ready || !session) return <LoadingPage label="Checking demo session…" />;
  if (session.role !== role) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <EmptyState
          title={`This area is for ${ROLE_LABEL[role].toLowerCase()} accounts`}
          body={`You are signed in as a demo ${ROLE_LABEL[session.role].toLowerCase()}. Use the account menu to switch demo role, or go to your own workspace.`}
          action={<LinkButton href={ROLE_HOME[session.role]}>Go to my workspace</LinkButton>}
        />
      </div>
    );
  }

  const nav = WORKSPACE_NAV[role];
  // Longest matching nav href wins, so /owner/projects/new does not also highlight /owner/projects.
  const best = nav.filter((n) => pathname === n.href || pathname.startsWith(n.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (href: string) => href === best;
  const list = (
    <ul className="space-y-1">
      {nav.map((n) => {
        const active = isActive(n.href);
        return (
          <li key={n.href}>
            <Link href={n.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold", active ? "bg-brand-600 text-white" : "text-ink hover:bg-brand-50")}>
              <n.icon className="size-4 shrink-0" aria-hidden /> {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (role === "investor") {
    const grouped = (
      <div className="space-y-5">
        {INVESTOR_NAV_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[0.6875rem] font-bold uppercase tracking-wider text-muted">{g.title}</p>
            <ul className="space-y-1">
              {g.hrefs.map((href) => nav.find((n) => n.href === href)).filter((n): n is NavItem => !!n).map((n) => {
                const active = isActive(n.href);
                const Icon = n.icon;
                return (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-semibold transition-colors", active ? "bg-brand-600 text-white" : "text-ink hover:bg-brand-50")}>
                      <Icon className="size-4 shrink-0" aria-hidden /> {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
    return (
      <div className="min-h-dvh bg-white">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-3">Skip to content</a>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-line bg-white px-4 pb-6 pt-3 lg:flex">
          <div className="mb-5 px-1"><Logo /><p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-wider text-muted">Investor portal</p></div>
          <nav aria-label="Investor navigation">{grouped}</nav>
        </aside>
        <div className="lg:pl-64">
          <DemoBanner />
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button type="button" className="grid size-11 place-items-center rounded-control border border-line lg:hidden" aria-label={drawer ? "Close navigation" : "Open navigation"} aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
                {drawer ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </button>
              <span className="lg:hidden"><Logo /></span>
              <span className="hidden rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 sm:inline">{ROLE_LABEL[role]} workspace</span>
            </div>
            <HeaderActions />
            {drawer && (
              <nav aria-label="Investor navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-white p-4 shadow-card lg:hidden">{grouped}</nav>
            )}
          </header>
          <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-3">Skip to content</a>
      <DemoBanner />
      <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" className="grid size-11 place-items-center rounded-control border border-line lg:hidden" aria-label={drawer ? "Close navigation" : "Open navigation"} aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
            {drawer ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
          <Logo />
          <span className="hidden rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 sm:inline">{ROLE_LABEL[role]} workspace</span>
        </div>
        <HeaderActions />
        {drawer && (
          <nav aria-label={`${ROLE_LABEL[role]} navigation`} className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-white p-4 shadow-card lg:hidden">{list}</nav>
        )}
      </header>
      <div className="flex">
        <aside className="sticky top-[4.5rem] hidden h-[calc(100dvh-4.5rem)] w-60 shrink-0 overflow-y-auto border-r border-line p-4 lg:block">
          <nav aria-label={`${ROLE_LABEL[role]} navigation`}>{list}</nav>
        </aside>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
