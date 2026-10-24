import Link from "next/link";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";
import { VisibilityToggle } from "./visibility-toggle";
import { Logo } from "./logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-zinc-50 md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-black bg-zinc-900/95 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+10px)] backdrop-blur-md md:hidden">
          <Link href="/" aria-label="Beranda">
            <Logo />
          </Link>
          <VisibilityToggle />
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
