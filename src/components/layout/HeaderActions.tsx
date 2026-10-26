"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/cn";
import { DemoMenu } from "./DemoMenu";

const pill =
  "grid size-11 place-items-center rounded-full text-ink transition-all duration-200 hover:bg-brand-50 hover:text-brand-600 active:scale-90";

/**
 * Header action section: [ ♡ | 🛒 ] pill + account menu.
 * The pill is shown to investors only (watchlist and portfolio are investor features).
 * Heart → Watchlist. Cart → Portfolio (the app has no shopping cart; this is the closest "my investments" view).
 */
export function HeaderActions() {
  const { session, state } = useDemo();
  const pathname = usePathname();
  if (!session) return null;

  const investor = session.role === "investor";
  const saved = investor ? (state.watchlist[session.userId] ?? []).length : 0;
  const positions = investor ? state.investments.filter((i) => i.userId === session.userId && i.status !== "exited_demo").length : 0;
  const onWatch = pathname.startsWith("/investor/watchlist");
  const onPortfolio = pathname.startsWith("/investor/portfolio");

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {investor && (
        <div role="group" aria-label="Quick links" className="flex items-center rounded-full border border-line/70 bg-white p-1 shadow-[0_6px_24px_rgba(31,45,33,0.10)]">
          <Link href="/investor/watchlist" aria-label={`Watchlist, ${saved} saved`} title="Watchlist" aria-current={onWatch ? "page" : undefined} className={cn(pill, onWatch && "text-brand-600")}>
            <Heart className={cn("size-[22px]", onWatch && "fill-brand-600")} strokeWidth={1.75} aria-hidden />
          </Link>
          <span aria-hidden className="h-6 w-px bg-line" />
          <Link href="/investor/portfolio" aria-label={`Portfolio, ${positions} active`} title="Portfolio" aria-current={onPortfolio ? "page" : undefined} className={cn(pill, onPortfolio && "text-brand-600")}>
            <ShoppingCart className="size-[22px]" strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      )}
      <DemoMenu />
    </div>
  );
}
