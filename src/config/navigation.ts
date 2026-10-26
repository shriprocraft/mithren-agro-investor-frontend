import {
  Banknote, BarChart3, Bell, BookOpen, ClipboardCheck, FileText, Flag, FolderKanban, HandCoins, Heart, HelpCircle,
  LayoutDashboard, Landmark, ListChecks, PieChart, Receipt, Scale, Search, Settings, ShieldCheck, Sprout, UserCog, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const PUBLIC_NAV: { href: string; label: string }[] = [
  { href: "/projects", label: "Browse projects" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export const ROLE_HOME: Record<Role, string> = {
  investor: "/investor/dashboard",
  owner: "/owner/dashboard",
  admin: "/admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = { investor: "Investor", owner: "Project owner", admin: "Admin" };

export const WORKSPACE_NAV: Record<Role, NavItem[]> = {
  investor: [
    { href: "/investor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Explore projects", icon: Search },
    { href: "/investor/watchlist", label: "Watchlist", icon: Heart },
    { href: "/investor/portfolio", label: "Portfolio", icon: PieChart },
    { href: "/investor/cash", label: "Cash balance", icon: Wallet },
    { href: "/investor/withdraw", label: "Withdraw", icon: Banknote },
    { href: "/investor/transactions", label: "Transactions", icon: Receipt },
    { href: "/investor/documents", label: "Documents", icon: FileText },
    { href: "/investor/notifications", label: "Notifications", icon: Bell },
    { href: "/investor/verification", label: "Verification", icon: ShieldCheck },
    { href: "/investor/bank-details", label: "Bank details", icon: Landmark },
    { href: "/investor/profile", label: "Profile", icon: UserCog },
    { href: "/investor/support", label: "Help & support", icon: HelpCircle },
  ],
  owner: [
    { href: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/owner/projects", label: "My projects", icon: FolderKanban },
    { href: "/owner/projects/new", label: "New project", icon: Sprout },
    { href: "/owner/funding", label: "Funding", icon: HandCoins },
    { href: "/owner/milestones", label: "Milestones & updates", icon: Flag },
    { href: "/owner/reports", label: "Reports", icon: BarChart3 },
    { href: "/owner/profile", label: "Profile", icon: UserCog },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Project reviews", icon: ClipboardCheck },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/admin/transactions", label: "Transactions", icon: Receipt },
    { href: "/admin/exits", label: "Exit queue", icon: ListChecks },
    { href: "/admin/withdrawals", label: "Withdrawal queue", icon: Banknote },
    { href: "/admin/reconciliation", label: "Reconciliation", icon: Scale },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/audit", label: "Audit activity", icon: BookOpen },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};
