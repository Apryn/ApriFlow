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
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black bg-rose-500/10 text-rose-400 shadow-nb-sm">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-zinc-100">
            Terjadi Kesalahan
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Ada kendala sementara saat memproses halaman ini. Silakan coba segarkan kembali.
          </p>
        </div>

        <Button
          onClick={() => reset()}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </Card>
    </div>
  );
}
