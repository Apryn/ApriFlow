export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-teal-50/50 via-gray-50 to-emerald-50/50 px-4 py-12 overflow-hidden">
      {/* Ambient Blurred Spots */}
      <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none select-none" />
      <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none select-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-100/10 blur-3xl pointer-events-none select-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 text-center select-none animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20 mb-3.5 transition-transform hover:scale-105 active:scale-95 duration-200">
            <span className="text-lg font-black tracking-tight">Af</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            ApriFlow
          </h1>
          <p className="mt-2 text-xs font-medium text-gray-400 max-w-[260px] leading-relaxed">
            Cash flow pribadi lebih jelas, otomatis, dan terkontrol.
          </p>
        </div>
        
        {children}
      </div>
    </div>
  );
}
