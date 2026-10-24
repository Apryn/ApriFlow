import { AppShell } from "@/components/layout/app-shell";
import { VisibilityProvider } from "@/components/providers/visibility-provider";
import { PendingCountProvider } from "@/components/providers/pending-count-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <VisibilityProvider>
      <PendingCountProvider>
        <AppShell>{children}</AppShell>
      </PendingCountProvider>
    </VisibilityProvider>
  );
}
