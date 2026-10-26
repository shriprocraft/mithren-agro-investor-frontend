import { ROLE_HOME } from "@/config/navigation";
import type { Role } from "@/types";

/** Only same-site paths that the role may actually open. */
export function safeNext(next: string | null, role: Role): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return ROLE_HOME[role];
  if (next.startsWith("/investor") && role !== "investor") return ROLE_HOME[role];
  if (next.startsWith("/owner") && role !== "owner") return ROLE_HOME[role];
  if (next.startsWith("/admin") && role !== "admin") return ROLE_HOME[role];
  return next;
}
