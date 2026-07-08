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
          .eq("user_id", userId as string)
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
    { href: "/ai-chat", label: "Tanya AI", icon: Sparkles },
    { href: "/review", label: "Review", icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : undefined },
    { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
    { href: "/settings", label: "Menu", icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-black bg-zinc-900/95 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors relative",
                isActive ? "text-teal-400 font-extrabold" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[3]")} />
                {badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-400 px-1 text-[9px] font-extrabold text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                    {badge}
                  </span>
                )}
              </div>
              <span className="font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
