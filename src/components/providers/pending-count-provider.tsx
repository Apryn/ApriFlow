"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PendingCountContext = createContext(0);

/** Fetches the number of AI drafts waiting for review once per route change and shares it. */
export function PendingCountProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        const { count: c } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending_review")
          .is("deleted_at", null);

        if (!cancelled) setCount(c ?? 0);
      } catch (err) {
        console.error("Error fetching pending count:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, pathname]);

  return <PendingCountContext.Provider value={count}>{children}</PendingCountContext.Provider>;
}

export function usePendingCount() {
  return useContext(PendingCountContext);
}
