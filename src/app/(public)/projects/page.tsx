"use client";

import { Suspense } from "react";
import { MarketSkeleton } from "@/components/common/skeletons";
import { MarketDashboard } from "@/components/market/MarketDashboard";

/** Browse Projects. Selection comes from ?project=<id>, read inside MarketDashboard (hence the Suspense boundary). */
export default function BrowseProjectsPage() {
  return <Suspense fallback={<MarketSkeleton />}><MarketDashboard /></Suspense>;
}
