"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Heart, ShoppingCart } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/cn";
import { DemoMenu } from "./DemoMenu";

const pill =
  "grid size-11 place-items-center rounded-full text-ink transition-all duration-200 hover:bg-brand-50 hover:text-brand-600 active:scale-90";

/**
 * Header action section: [ ♡ | 🛒 | 🔔 ] pill + account menu.
 * The pill is shown to investors only (wishlist, portfolio and notifications are investor features).
 * Heart → Wishlist. Bell → Notifications (same data as the sidebar link). Cart → Portfolio (the app has no shopping cart; this is the closest "my investments" view).
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
  const onNotes = pathname.startsWith("/investor/notifications");
  const unread = investor ? state.notifications.filter((n) => n.userId === session.userId && !n.read).length : 0;

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {investor && (
        <div role="group" aria-label="Quick links" className="flex items-center rounded-full border border-line/70 bg-white p-1 shadow-[0_6px_24px_rgba(31,45,33,0.10)]">
          <Link href="/investor/watchlist" aria-label={`Wishlist, ${saved} saved`} title="Wishlist" aria-current={onWatch ? "page" : undefined} className={cn(pill, onWatch && "text-brand-600")}>
            <Heart className={cn("size-[22px]", onWatch && "fill-brand-600")} strokeWidth={1.75} aria-hidden />
          </Link>
          <span aria-hidden className="h-6 w-px bg-line" />
          <Link href="/investor/portfolio" aria-label={`Portfolio, ${positions} active`} title="Portfolio" aria-current={onPortfolio ? "page" : undefined} className={cn(pill, onPortfolio && "text-brand-600")}>
            <ShoppingCart className="size-[22px]" strokeWidth={1.75} aria-hidden />
          </Link>
          <span aria-hidden className="h-6 w-px bg-line" />
          <Link href="/investor/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications" aria-current={onNotes ? "page" : undefined} className={cn(pill, "relative", onNotes && "text-brand-600")}>
            <Bell className={cn("size-[22px]", onNotes && "fill-brand-600")} strokeWidth={1.75} aria-hidden />
            {unread > 0 && <span aria-hidden className="tabular absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad-fg px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>}
          </Link>
        </div>
      )}
      <DemoMenu />
    </div>
  );
}
