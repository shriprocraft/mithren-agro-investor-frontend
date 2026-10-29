"use client";

import { Suspense } from "react";
import { LoadingPage } from "@/components/common/ui";
import { MarketDashboard } from "@/components/market/MarketDashboard";

/** Browse Projects. Selection comes from ?project=<id>, read inside MarketDashboard (hence the Suspense boundary). */
export default function BrowseProjectsPage() {
  return <Suspense fallback={<LoadingPage label="Loading projects…" />}><MarketDashboard /></Suspense>;
}
