"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils/currency";

interface VisibilityContextType {
  isVisible: boolean;
  toggleVisibility: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("apriflow_balance_visible");
    if (stored !== null) {
      setIsVisible(stored === "true");
    }
    setMounted(true);
  }, []);

  const toggleVisibility = () => {
    setIsVisible((prev) => {
      const next = !prev;
      localStorage.setItem("apriflow_balance_visible", String(next));
      return next;
    });
  };

  return (
    <VisibilityContext.Provider value={{ isVisible: mounted ? isVisible : true, toggleVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error("useVisibility must be used within a VisibilityProvider");
  }

  const mask = (amount: number, formattedVal?: string) => {
    if (context.isVisible) {
      return formattedVal ?? formatRupiah(amount);
    }
    return amount < 0 ? "-Rp ••••••" : "Rp ••••••";
  };

  return {
    isVisible: context.isVisible,
    toggleVisibility: context.toggleVisibility,
    mask,
  };
}
