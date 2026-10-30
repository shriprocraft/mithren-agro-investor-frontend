import { INVESTOR_HOME } from "@/config/navigation";

/** Only same-site paths the investor workspace can open. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return INVESTOR_HOME;
  if (/^\/(owner|admin)(\/|$|\?)/.test(next)) return INVESTOR_HOME; // removed areas
  return next;
}
