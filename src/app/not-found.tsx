import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-black bg-zinc-900 p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border-2 border-amber-400 text-amber-400 shadow-[3px_3px_0px_0px_#000]">
          <AlertTriangle className="h-8 w-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-wide">
            404
          </h1>
          <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed pt-2">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau alamat URL yang Anda masukkan salah.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button className="w-full bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] font-black h-11 rounded-xl flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
