"use client";

import { useMemo } from "react";
import { useDemo } from "@/context/DemoContext";
import { aggregateHistory, cashSummary, portfolioSummary } from "@/lib/portfolio-calculations";

/** Derived investor-scoped data. Everything is filtered by the signed-in user's id. */
export function useInvestor() {
  const { state, user } = useDemo();
  const uid = user?.id ?? "";
  return useMemo(() => {
    const investments = state.investments.filter((i) => i.userId === uid);
    const transactions = state.transactions.filter((t) => t.userId === uid);
    const exits = state.exits.filter((e) => e.userId === uid);
    const withdrawals = state.withdrawals.filter((w) => w.userId === uid);
    const cashEntries = state.cash.filter((c) => c.userId === uid);
    return {
      user,
      investments,
      transactions,
      exits,
      withdrawals,
      cashEntries,
      summary: portfolioSummary(investments),
      cash: cashSummary(uid, state.cash, state.exits, state.withdrawals),
      history: aggregateHistory(investments.filter((i) => i.status !== "exited_demo").map((i) => i.id), state.valuations),
      notifications: state.notifications.filter((n) => n.userId === uid),
      documents: state.documents.filter((d) => d.userId === uid || d.userId === null),
      watchlist: state.watchlist[uid] ?? [],
    };
  }, [state, uid, user]);
}
