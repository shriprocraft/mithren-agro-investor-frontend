import type { ReactNode } from "react";
import { PublicShell } from "@/components/layout/PublicLayout";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
