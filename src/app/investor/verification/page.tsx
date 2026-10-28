import { redirect } from "next/navigation";

/** Verification now lives on the combined Bank Details / Verification page; keep old links working. */
export default function VerificationRedirect() {
  redirect("/investor/bank-details#verification");
}
