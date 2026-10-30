"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { LinkButton, LoadingPage, EmptyState, Skeleton } from "@/components/common/ui";
import { InvestorRouteSkeleton } from "@/components/common/skeletons";
import { INVESTOR_NAV, INVESTOR_NAV_GROUPS, type NavItem } from "@/config/navigation";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/cn";
import { HeaderActions } from "./HeaderActions";
import { DemoBanner, Logo } from "./PublicLayout";

/** Investor workspace shell. The role guard is a UI convenience only — real authorization must be server-side. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
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

  // While the demo store hydrates, keep the static chrome and show a skeleton of the requested page.
  const loading = !ready;
  if (ready && !session) return <LoadingPage label="Redirecting to log in…" />;
  if (session && session.role !== "investor") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <EmptyState
          title="This area is for investor accounts"
          body="Sign in with an investor demo account to continue."
          action={<LinkButton href="/login">Log in</LinkButton>}
        />
      </div>
    );
  }

  const nav = INVESTOR_NAV;
  // Longest matching nav href wins, so a nested route highlights only its own nav item.
  const best = nav.filter((n) => pathname === n.href || pathname.startsWith(n.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (href: string) => href === best;
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
          {!pathname.startsWith("/investor/bank-details") && <DemoBanner />}
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button type="button" className="grid size-11 place-items-center rounded-control border border-line lg:hidden" aria-label={drawer ? "Close navigation" : "Open navigation"} aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
                {drawer ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </button>
              <span className="lg:hidden"><Logo /></span>
              <span className="hidden rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 sm:inline">Investor workspace</span>
            </div>
            {loading ? (
              <div aria-hidden className="flex items-center gap-2 sm:gap-4"><Skeleton className="h-[3.25rem] w-[8.75rem] rounded-full" /><Skeleton className="size-12 rounded-full" /></div>
            ) : <HeaderActions />}
            {drawer && (
              <nav aria-label="Investor navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-white p-4 shadow-card lg:hidden">{grouped}</nav>
            )}
          </header>
          <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{loading ? <InvestorRouteSkeleton /> : children}</main>
        </div>
      </div>
    );
}
