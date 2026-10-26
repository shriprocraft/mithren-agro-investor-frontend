import type { ChecklistItem, DemoUser, VerificationStatus } from "@/types";

export const checklistFor = (status: VerificationStatus): ChecklistItem[] => {
  const done = status === "approved_demo";
  const s = (ok: VerificationStatus): VerificationStatus => (done ? "approved_demo" : ok);
  switch (status) {
    case "not_started":
      return [
        { label: "Personal details", status: "not_started" },
        { label: "Identity document (demo upload)", status: "not_started" },
        { label: "Bank details (masked demo)", status: "not_started" },
      ];
    case "action_required":
      return [
        { label: "Personal details", status: "approved_demo" },
        { label: "Identity document (demo upload)", status: "action_required" },
        { label: "Bank details (masked demo)", status: "draft" },
      ];
    default:
      return [
        { label: "Personal details", status: s("submitted") },
        { label: "Identity document (demo upload)", status: s(status === "rejected_demo" ? "rejected_demo" : status) },
        { label: "Bank details (masked demo)", status: s(status === "draft" ? "draft" : "submitted") },
      ];
  }
};

const mk = (u: Omit<DemoUser, "checklist" | "emailAlerts" | "phone"> & Partial<Pick<DemoUser, "phone" | "emailAlerts">>): DemoUser => ({
  phone: "9000000000",
  emailAlerts: true,
  ...u,
  checklist: checklistFor(u.verification),
});

const bank = (holder: string, mask: string) => ({
  holderName: holder,
  bankName: "Demo Bank (fictional)",
  maskedAccount: mask,
  ifscDemo: "DEMO0000001",
  status: "approved_demo" as const,
});

export const SEED_USERS: DemoUser[] = [
  mk({ id: "inv-1", name: "Ananya Rao", email: "ananya.demo@example.com", phone: "9000000001", role: "investor", verification: "approved_demo", bank: bank("Ananya Rao", "XXXX 4821"), location: "Bengaluru", createdAt: "2026-05-01T10:00:00+05:30" }),
  mk({ id: "inv-2", name: "Rohan Mehta", email: "rohan.demo@example.com", phone: "9000000002", role: "investor", verification: "action_required", bank: null, location: "Mumbai", createdAt: "2026-10-12T10:00:00+05:30" }),
  mk({ id: "inv-3", name: "Vikram Shah", email: "vikram.demo@example.com", role: "investor", verification: "submitted", bank: null, location: "Ahmedabad", createdAt: "2026-10-18T10:00:00+05:30" }),
  mk({ id: "inv-4", name: "Neha Kulkarni", email: "neha.demo@example.com", role: "investor", verification: "rejected_demo", bank: null, location: "Pune", createdAt: "2026-09-02T10:00:00+05:30" }),
  mk({ id: "inv-5", name: "Arjun Das", email: "arjun.demo@example.com", role: "investor", verification: "under_review", bank: bank("Arjun Das", "XXXX 7710"), location: "Kolkata", createdAt: "2026-10-20T10:00:00+05:30" }),
  mk({ id: "owner-1", name: "Meera Patil", email: "meera.owner@example.com", phone: "9000000011", role: "owner", verification: "approved_demo", bank: null, orgName: "Green Terrace Farms (fictional)", location: "Nashik", createdAt: "2026-04-10T10:00:00+05:30" }),
  mk({ id: "owner-2", name: "Suresh Nair", email: "suresh.owner@example.com", phone: "9000000012", role: "owner", verification: "approved_demo", bank: null, orgName: "Southern Fields Collective (fictional)", location: "Kochi", createdAt: "2026-04-15T10:00:00+05:30" }),
  mk({ id: "admin-1", name: "Kavita Iyer", email: "admin@example.com", phone: "9000000099", role: "admin", verification: "approved_demo", bank: null, location: "Demo HQ", createdAt: "2026-01-01T10:00:00+05:30" }),
];

/** Quick-login shortcuts on /login. */
export const DEMO_LOGINS = [
  { userId: "inv-1", label: "Investor with portfolio", hint: "Ananya Rao · positions, cash, pending requests" },
  { userId: "inv-2", label: "Investor, no positions", hint: "Rohan Mehta · empty states, verification pending" },
  { userId: "owner-1", label: "Project owner", hint: "Meera Patil · drafts, submissions, active project" },
  { userId: "admin-1", label: "Admin", hint: "Kavita Iyer · review queues, reconciliation" },
] as const;
