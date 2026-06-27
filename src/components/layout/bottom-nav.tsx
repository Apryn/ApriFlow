"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Home, Sparkles, ClipboardList, ArrowLeftRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BottomNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending_review")
          .is("deleted_at", null);

        setPendingCount(count ?? 0);
      } catch (err) {
        console.error("Error fetching pending count:", err);
      }
    }

    fetchPendingCount();

    const channel = supabase
      .channel("bottom-pending-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/ai-chat", label: "Tanya AI", icon: Sparkles },
    { href: "/review", label: "Review", icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : undefined },
    { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
    { href: "/settings", label: "Menu", icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors relative",
                isActive ? "text-teal-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                {badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-600 px-1 text-[9px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
