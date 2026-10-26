import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

export default function InvestorLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell role="investor">{children}</WorkspaceShell>;
}
