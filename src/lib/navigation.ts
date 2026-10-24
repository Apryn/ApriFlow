import {
  ArrowLeftRight,
  ClipboardCheck,
  History,
  Home,
  Menu,
  PiggyBank,
  Settings,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional longer description for menu/list views. */
  description?: string;
  /** Show the pending-review counter on this item. */
  showPendingBadge?: boolean;
}

/** Core daily-use pages. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/ai-chat", label: "Tanya AI", icon: Sparkles },
  { href: "/review", label: "Review", icon: ClipboardCheck, showPendingBadge: true },
];

/** Planning & reports pages. */
export const PLANNING_NAV: NavItem[] = [
  { href: "/budgets", label: "Anggaran", icon: PiggyBank, description: "Batas pengeluaran per kategori" },
  { href: "/goals", label: "Target", icon: Target, description: "Tabungan & impian finansial" },
  { href: "/aset", label: "Aset", icon: Wallet, description: "Bank, tunai, investasi, emas" },
  { href: "/history", label: "Riwayat", icon: History, description: "Laporan & perbandingan bulanan" },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", label: "Pengaturan", icon: Settings };

/** Mobile bottom bar: 4 primary + Menu. */
export const MOBILE_NAV: NavItem[] = [
  ...PRIMARY_NAV,
  { href: "/settings", label: "Menu", icon: Menu },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
