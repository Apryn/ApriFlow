import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b-2 border-black bg-zinc-900/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] backdrop-blur-md md:hidden">
          <span className="text-lg font-black tracking-tight text-teal-400">ApriFlow</span>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 md:py-6 pb-24 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
