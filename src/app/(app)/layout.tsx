import { AppShell } from "@/components/layout/app-shell";
import { VisibilityProvider } from "@/components/providers/visibility-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <VisibilityProvider>
      <AppShell>{children}</AppShell>
    </VisibilityProvider>
  );
}

