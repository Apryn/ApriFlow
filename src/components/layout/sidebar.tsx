"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  ArrowLeftRight,
  Wallet,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/tambah", label: "Tambah Cepat", icon: PlusCircle },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/aset", label: "Aset", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
      <div className="px-4 py-6">
        <Link href="/" className="block">
          <span className="text-xl font-bold text-teal-600">ApriFlow</span>
          <p className="mt-0.5 text-xs text-gray-500">Cash flow pribadi</p>
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
