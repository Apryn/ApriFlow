"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-black bg-zinc-900 p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border-2 border-rose-400 text-rose-400 shadow-[3px_3px_0px_0px_#000]">
          <ShieldAlert className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-wide">
            500
          </h1>
          <h2 className="text-sm font-black text-rose-400 uppercase tracking-widest">
            Terjadi Kesalahan Server
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed pt-2">
            Ada kendala teknis sementara di server saat memproses permintaan Anda. Coba segarkan halaman atau laporkan kendala jika berlanjut.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] font-black h-11 rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>
        </div>
      </Card>
    </div>
  );
}
