import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black bg-amber-500/10 text-amber-400 shadow-nb-sm">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-zinc-100">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Halaman yang Anda cari mungkin telah dipindahkan atau tautan tidak valid.
          </p>
        </div>

        <Link href="/" className="block">
          <Button className="w-full">
            <Home className="h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
