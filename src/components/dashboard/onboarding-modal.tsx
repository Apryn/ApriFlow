"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, HelpCircle, Check, ArrowRight, UserCheck } from "lucide-react";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const done = localStorage.getItem("apriflow_onboarding_done");
    if (!done) {
      setIsOpen(true);
    }
  }, []);

  const handleFinish = () => {
    localStorage.setItem("apriflow_onboarding_done", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="max-w-md w-full border-2 border-black bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6 relative overflow-hidden">
        {/* Step indicator */}
        <div className="absolute top-4 right-4 text-[10px] font-black text-teal-400 bg-zinc-950 border border-black shadow-[1px_1px_0px_0px_#000] px-2 py-0.5 rounded uppercase tracking-widest">
          Langkah {step} dari 4
        </div>

        {/* Content steps */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border-2 border-teal-400 text-teal-400 shadow-[2px_2px_0px_0px_#000]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-zinc-100 uppercase tracking-wide">
                Selamat Datang di ApriFlow!
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ApriFlow adalah asisten pencatatan arus kas pribadi bertenaga AI dengan tema desain Neo-Brutalisme yang dinamis. Yuk pelajari beberapa fitur utama kami dalam 1 menit!
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border-2 border-purple-400 text-purple-400 shadow-[2px_2px_0px_0px_#000]">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-zinc-100 uppercase tracking-wide">
                1. Daftarkan Aset Valid
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Catat saldo awal uang tunai, bank, atau emas Anda di menu <strong className="text-purple-400">Aset</strong>. Aset yang akurat membantu kalkulasi sisa kas bersih dan keputusan finansial Anda.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border-2 border-rose-400 text-rose-400 shadow-[2px_2px_0px_0px_#000]">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-zinc-100 uppercase tracking-wide">
                2. AI Financial Copilot
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cukup ketik secara alami di menu <strong className="text-rose-400">Tanya AI (Chat)</strong> untuk mencatat pengeluaran Anda, memindai struk belanja, impor mutasi bank, atau menanyakan simulasi finansial keputusan Anda.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border-2 border-teal-400 text-teal-400 shadow-[2px_2px_0px_0px_#000]">
              <Check className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-zinc-100 uppercase tracking-wide">
                3. Monitor & Limit Anggaran
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pantau kesehatan arus kas bulanan melalui grafik visual dan atur batas pengeluaran kategori di menu <strong className="text-teal-400">Limit Anggaran</strong> agar keuangan Anda tetap sehat!
              </p>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex justify-between items-center pt-3 border-t-2 border-black">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Kembali
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              Lewati
            </button>
          )}

          {step < 4 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black h-9 text-xs"
            >
              Lanjut
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black h-9 text-xs"
            >
              Mulai Sekarang!
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
