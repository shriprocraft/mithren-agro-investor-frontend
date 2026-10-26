"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button, EmptyState, PageTitle } from "@/components/common/ui";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDateTime } from "@/lib/format";
import { markNotifications } from "@/lib/mock-service";
import { cn } from "@/lib/cn";

export default function NotificationsPage() {
  const { run, user } = useDemo();
  const d = useInvestor();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const list = d.notifications.filter((n) => filter === "all" || !n.read);
  const unread = d.notifications.filter((n) => !n.read).length;
  if (!user) return null;
  return (
    <>
      <PageTitle title="Notifications" subtitle="Local sample notifications — nothing is emailed, texted or pushed." actions={<Button variant="secondary" disabled={unread === 0} title={unread === 0 ? "Nothing unread" : undefined} onClick={() => run((s) => markNotifications(s, user.id, "all"))}>Mark all read</Button>} />
      <div className="mb-4 flex gap-2" role="group" aria-label="Filter">
        <Button variant={filter === "all" ? "primary" : "secondary"} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All ({d.notifications.length})</Button>
        <Button variant={filter === "unread" ? "primary" : "secondary"} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>Unread ({unread})</Button>
      </div>
      {list.length === 0 ? <EmptyState title={filter === "unread" ? "You are all caught up" : "No notifications"} /> : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n.id} className={cn("rounded-card border bg-white p-4 shadow-card", n.read ? "border-line" : "border-brand-500")}>
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{n.title} {!n.read && <span className="ml-1 rounded bg-brand-100 px-1.5 py-0.5 text-[11px] font-bold text-brand-800">NEW</span>}</p>
                  <p className="text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(n.at)}</p>
                  <div className="mt-2 flex gap-3">
                    {n.href && <Link href={n.href} onClick={() => run((s) => markNotifications(s, user.id, [n.id]))} className="font-semibold text-brand-700 hover:underline">Open</Link>}
                    <button type="button" className="font-semibold text-muted hover:underline" onClick={() => run((s) => markNotifications(s, user.id, [n.id], !n.read))}>{n.read ? "Mark unread" : "Mark read"}</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
