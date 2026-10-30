import {
  Banknote, Bell, FileText, Heart, HelpCircle, LayoutDashboard, Landmark, PieChart, Receipt, Search, UserCog, Wallet, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const PUBLIC_NAV: { href: string; label: string }[] = [
  { href: "/projects", label: "Browse projects" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

/** The investor workspace is the only signed-in area. */
export const INVESTOR_HOME = "/investor/dashboard";

export const INVESTOR_NAV: NavItem[] = [
    { href: "/investor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Explore projects", icon: Search },
    { href: "/investor/watchlist", label: "Wishlist", icon: Heart },
    { href: "/investor/portfolio", label: "Portfolio", icon: PieChart },
    { href: "/investor/cash", label: "Cash balance", icon: Wallet },
    { href: "/investor/withdraw", label: "Withdraw", icon: Banknote },
    { href: "/investor/transactions", label: "Transactions", icon: Receipt },
    { href: "/investor/documents", label: "Documents", icon: FileText },
    { href: "/investor/notifications", label: "Notifications", icon: Bell },
    { href: "/investor/bank-details", label: "Bank Details / Verification", icon: Landmark },
    { href: "/investor/profile", label: "Profile", icon: UserCog },
    { href: "/investor/support", label: "Help & support", icon: HelpCircle },
];

/** Section headings for the investor sidebar; every investor nav item appears in exactly one group. */
export const INVESTOR_NAV_GROUPS: { title: string; hrefs: string[] }[] = [
  { title: "Overview", hrefs: ["/investor/dashboard"] },
  { title: "Invest", hrefs: ["/projects", "/investor/watchlist", "/investor/portfolio"] },
  { title: "Money", hrefs: ["/investor/cash", "/investor/withdraw", "/investor/transactions"] },
  { title: "Account", hrefs: ["/investor/documents", "/investor/notifications", "/investor/bank-details", "/investor/profile", "/investor/support"] },
];
