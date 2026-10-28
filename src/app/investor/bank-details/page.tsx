"use client";

import { PageTitle } from "@/components/common/ui";
import { BankDetailsSection } from "@/components/investor/BankDetailsSection";
import { VerificationSection } from "@/components/investor/VerificationSection";

export default function BankDetailsVerificationPage() {
  return (
    <div>
      <PageTitle title="Bank Details / Verification" subtitle="Masked, fictional values only." />
      <div className="space-y-8">
        <BankDetailsSection />
        <VerificationSection />
      </div>
    </div>
  );
}
