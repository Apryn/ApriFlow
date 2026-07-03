"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  PlusCircle,
  ArrowLeftRight,
  Wallet,
  Settings,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUserId() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) setUserId(user.id);
        }
      } catch (err) {
        console.error("Error getting user session:", err);
      }
    }
    getUserId();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    async function fetchPendingCount() {
      try {
        const { count } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending_review")
          .is("deleted_at", null);

        setPendingCount(count ?? 0);
      } catch (err) {
        console.error("Error fetching pending count:", err);
      }
    }

    fetchPendingCount();
  }, [supabase, pathname, userId]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/ai-chat", label: "Tanya AI (Chat)", icon: Sparkles },
    { href: "/review", label: "Review Draf", icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : undefined },
    { href: "/tambah", label: "Tambah Cepat", icon: PlusCircle },
    { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
    { href: "/aset", label: "Aset", icon: Wallet },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
      <div className="px-4 py-6">
        <Link href="/" className="block">
          <span className="text-xl font-bold text-teal-600">ApriFlow</span>
          <p className="mt-0.5 text-xs text-gray-500">Cash flow pribadi</p>
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
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
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge !== undefined && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white shrink-0">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
