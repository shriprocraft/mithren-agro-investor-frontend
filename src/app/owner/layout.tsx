import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell role="owner">{children}</WorkspaceShell>;
}
