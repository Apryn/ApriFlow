export default function Loading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-lg bg-zinc-800" />
        <div className="h-4 w-48 rounded-lg bg-zinc-800/60" />
      </div>

      <div className="h-10 w-full rounded-xl bg-zinc-850" />

      <div className="h-36 rounded-2xl bg-zinc-900 border-2 border-black" />

      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 rounded-2xl bg-zinc-900 border-2 border-black" />
        <div className="h-32 rounded-2xl bg-zinc-900 border-2 border-black" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-zinc-800" />
        <div className="h-40 rounded-2xl bg-zinc-900 border-2 border-black" />
      </div>
    </div>
  );
}
