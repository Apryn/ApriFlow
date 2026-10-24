"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Sparkles, Wallet, ShieldCheck, ArrowRight } from "lucide-react";

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

  const steps = [
    {
      icon: Sparkles,
      title: "Selamat Datang di ApriFlow",
      desc: "Kelola cash flow harian dengan cepat dan akurat. Gunakan AI chat atau input cepat untuk mencatat transaksi dalam hitungan detik.",
    },
    {
      icon: Wallet,
      title: "1. Daftarkan Aset Valid",
      desc: "Catat rekening bank, uang tunai, dan tabungan Anda di menu Aset agar kalkulasi sisa kas selalu akurat.",
    },
    {
      icon: ShieldCheck,
      title: "2. Limit & Tagihan Rutin",
      desc: "Pantau pengeluaran wajib bulanan dan atur limit anggaran per kategori agar kondisi finansial tetap sehat.",
    },
  ];

  const currentStep = steps[step - 1];
  const Icon = currentStep?.icon || Sparkles;

  return (
    <Modal
      open={isOpen}
      onClose={handleFinish}
      title={`Panduan Singkat (${step}/${steps.length})`}
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Lewati
          </button>
          <Button
            size="sm"
            onClick={() => {
              if (step < steps.length) setStep((s) => s + 1);
              else handleFinish();
            }}
          >
            {step < steps.length ? (
              <>
                Lanjut
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : (
              "Mulai Sekarang"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-zinc-800 text-teal-400 shadow-nb-sm">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-100">{currentStep.title}</h3>
        <p className="text-xs leading-relaxed text-zinc-400">{currentStep.desc}</p>
      </div>
    </Modal>
  );
}
