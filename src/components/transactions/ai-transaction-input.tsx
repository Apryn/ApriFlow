"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ParsedTransactionPreview } from "./parsed-transaction-preview";
import { 
  Send, Sparkles, User, AlertCircle, Image, FileText, 
  AlertTriangle, TrendingUp, CheckCircle, ShieldAlert, Trash2, X
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/currency";

interface Message {
  id: string;
  sender: "user" | "ai";
  text?: string;
  parsedTransactionId?: string;
  simulation?: any;
  error?: string;
  loading?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  sender: "ai",
  text: "Halo! Saya adalah AI Financial Copilot Anda. Ketik apa saja transaksi harian Anda, atau gunakan menu di bawah untuk mengunggah struk & mengimpor mutasi bank.\n\nAnda juga bisa menanyakan analisis keuangan Anda, atau mencoba simulasi keputusan seperti:\n• 'bagaimana jika aku resign bulan depan?'\n• 'boleh tidak beli motor ADV 160 tunai/kredit?'",
};

export function AITransactionInput() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [isImportingMutation, setIsImportingMutation] = useState(false);
  const [mutationText, setMutationText] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("apriflow_chat_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([WELCOME_MESSAGE]);
      }
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("apriflow_chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isImportingMutation]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || pending) return;

    const userText = input.trim();
    setInput("");
    setPending(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: userText },
      { id: aiMsgId, sender: "ai", loading: true },
    ]);

    const historyPayload = messages
      .filter((m) => !m.loading && !m.error && m.text && m.id !== "welcome")
      .map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text || "" }],
      }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText,
          history: historyPayload
        }),
      });

      const res = await response.json();

      if (!response.ok || res.error) {
        throw new Error(res.error || "Gagal memproses pesan.");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                id: aiMsgId,
                sender: "ai" as const,
                text: res.text,
                parsedTransactionId: res.parsedTransactionId,
                simulation: res.simulation,
              }
            : msg
        )
      );
    } catch {
      const friendlyError = "Kecerdasan AI sedang mencapai batas penggunaan sementara. Silakan coba lagi sekitar 1 menit lagi, ya.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                id: aiMsgId,
                sender: "ai" as const,
                error: friendlyError,
              }
            : msg
        )
      );
    } finally {
      setPending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPending(true);
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: `[Unggah Foto Struk: ${file.name}]` },
      { id: aiMsgId, sender: "ai", loading: true },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        body: formData,
      });

      const res = await response.json();

      if (!response.ok || res.error) {
        throw new Error(res.error || "Gagal memproses struk belanja.");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                id: aiMsgId,
                sender: "ai" as const,
                text: "Saya telah memindai struk belanja Anda menggunakan AI. Berikut draf transaksi yang berhasil diekstrak:",
                parsedTransactionId: res.transactionId,
              }
            : msg
        )
      );
    } catch {
      const friendlyError = "Fitur Scan Struk sedang sibuk atau batas penggunaan tercapai. Silakan coba lagi sebentar lagi.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { id: aiMsgId, sender: "ai" as const, error: friendlyError }
            : msg
        )
      );
    } finally {
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutationText.trim() || pending) return;

    const textToParse = mutationText.trim();
    setMutationText("");
    setIsImportingMutation(false);
    setPending(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: `[Impor Mutasi Bank: ${textToParse.slice(0, 30)}...]` },
      { id: aiMsgId, sender: "ai", loading: true },
    ]);

    try {
      const response = await fetch("/api/ai/bank-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      });

      const res = await response.json();

      if (!response.ok || res.error) {
        throw new Error(res.error || "Gagal memproses mutasi bank.");
      }

      const count = res.count || 0;
      const txs = res.transactions || [];

      if (count === 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { id: aiMsgId, sender: "ai" as const, text: "Tidak ada transaksi yang terdeteksi pada teks mutasi tersebut." }
              : msg
          )
        );
      } else {
        setMessages((prev) => {
          const next: Message[] = prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  id: aiMsgId,
                  sender: "ai" as const,
                  text: `Berhasil mengimpor ${count} draf transaksi dari mutasi bank Anda. Silakan tinjau satu per satu di bawah ini:`,
                }
              : msg
          );

          txs.forEach((tx: any, idx: number) => {
            next.push({
              id: `ai-tx-${tx.id}-${idx}`,
              sender: "ai" as const,
              parsedTransactionId: tx.id,
            });
          });

          return next;
        });
      }
    } catch {
      const friendlyError = "Fitur Impor Mutasi sedang sibuk atau batas penggunaan tercapai. Silakan coba lagi sebentar lagi.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { id: aiMsgId, sender: "ai" as const, error: friendlyError }
            : msg
        )
      );
    } finally {
      setPending(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat chat ini?")) {
      localStorage.removeItem("apriflow_chat_messages");
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const getDecisionTypeLabel = (type: string) => {
    switch (type) {
      case "resign": return "Simulasi Resign Kerja";
      case "purchase": return "Simulasi Beli Aset Besar";
      case "goal_roadmap": return "Simulasi Target Tabungan";
      default: return "Simulasi Keputusan Keuangan";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-280px)] md:h-[70vh] md:max-h-[700px] border-2 border-black bg-surface rounded-2xl shadow-nb overflow-hidden relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg text-xs font-bold border-2 border-black ${
                  isUser
                    ? "bg-teal-400 text-black shadow-nb-sm"
                    : "bg-zinc-800 text-teal-400"
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-teal-400" />}
              </div>

              <div className="space-y-2 flex-1">
                {msg.text && (
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm border-2 border-black ${
                      isUser
                        ? "bg-teal-400 text-black font-semibold rounded-tr-none whitespace-pre-line shadow-nb-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-tl-none leading-relaxed"
                    }`}
                  >
                    {isUser ? msg.text : formatMessageText(msg.text)}
                  </div>
                )}

                {msg.loading && (
                  <div className="rounded-2xl px-3.5 py-2 bg-zinc-800 text-zinc-400 border-2 border-black rounded-tl-none inline-block">
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {msg.error && (
                  <div className="rounded-xl px-3.5 py-2 bg-rose-500/10 text-rose-300 rounded-tl-none flex items-center gap-2 border border-rose-500/30 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{msg.error}</span>
                  </div>
                )}

                {msg.parsedTransactionId && (
                  <div className="mt-2 text-left">
                    <ParsedTransactionPreview
                      transactionId={msg.parsedTransactionId}
                      onActionComplete={(action, details) => {
                        setMessages((prev) =>
                          prev.map((m) => {
                            if (m.id === msg.id) {
                              let text = "Transaksi berhasil disimpan!";
                              if (action === "confirm" || action === "update") {
                                const flowStr = details?.type === "income" ? "Pemasukan" : "Pengeluaran";
                                text = `Transaksi ${flowStr} sebesar ${formatRupiah(details?.amount || 0)} berhasil disimpan ke Kategori ${details?.categoryName || "Lain-lain"}.`;
                              } else if (action === "ignore") {
                                text = "Draft transaksi diabaikan.";
                              }
                              return {
                                id: m.id,
                                sender: m.sender,
                                text,
                              };
                            }
                            return m;
                          })
                        );
                      }}
                    />
                  </div>
                )}

                {msg.simulation && (
                  <div className="mt-2 border-2 border-black bg-surface rounded-2xl p-4 shadow-nb space-y-3 text-left max-w-lg">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
                        <TrendingUp className="h-4 w-4 text-teal-400" />
                        {getDecisionTypeLabel(msg.simulation.decisionType)}
                      </div>
                      <Badge variant={msg.simulation.riskLevel === "low" ? "success" : "warning"}>
                        Risiko {msg.simulation.riskLevel}
                      </Badge>
                    </div>

                    <div className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold border ${msg.simulation.isViable ? "bg-teal-400/10 text-teal-300 border-teal-400/30" : "bg-rose-500/10 text-rose-300 border-rose-500/30"}`}>
                      {msg.simulation.isViable ? (
                        <>
                          <CheckCircle className="h-4 w-4 shrink-0 text-teal-400" />
                          <span>Keputusan tergolong LAYAK berdasarkan cadangan dana Anda.</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                          <span>Keputusan tergolong BERISIKO atau saldo tidak mencukupi.</span>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 text-center bg-surface-2 border border-zinc-800 rounded-xl p-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Skor Sehat</span>
                        <span className="text-sm font-bold text-teal-400 block">{msg.simulation.simulatedMetrics.healthScore}/100</span>
                      </div>
                      <div className="space-y-0.5 border-x border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Kas Bersih</span>
                        <span className="tabular text-xs font-bold text-zinc-200 block truncate">{formatRupiah(msg.simulation.simulatedMetrics.netCashFlow)}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Ketahanan</span>
                        <span className="text-xs font-bold text-teal-400 block">{msg.simulation.simulatedMetrics.emergencyFundMonths.toFixed(1)} bln</span>
                      </div>
                    </div>

                    {msg.simulation.warnings.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Peringatan:
                        </span>
                        <ul className="text-xs text-zinc-400 space-y-0.5 list-disc pl-4">
                          {msg.simulation.warnings.map((w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.simulation.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-teal-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Rekomendasi:
                        </span>
                        <ul className="text-xs text-zinc-400 space-y-0.5 list-disc pl-4">
                          {msg.simulation.recommendations.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isImportingMutation && (
        <div className="absolute inset-x-0 bottom-0 bg-surface border-t-2 border-black p-4 z-10 shadow-nb-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-400" />
              Impor Mutasi Rekening Bank
            </span>
            <button 
              onClick={() => setIsImportingMutation(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleMutationSubmit} className="space-y-2.5">
            <textarea
              value={mutationText}
              onChange={(e) => setMutationText(e.target.value)}
              placeholder="Paste teks mutasi bank di sini... (Contoh: 29/06 TRANSFER DR Rp 50.000 Kopi Kenangan)"
              rows={4}
              required
              className="w-full text-xs p-2.5 bg-surface-2 border-2 border-zinc-800 text-zinc-100 rounded-xl focus:border-teal-400 focus:outline-none placeholder:text-zinc-600"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={pending || !mutationText.trim()}
            >
              Urai Mutasi & Impor
            </Button>
          </form>
        </div>
      )}

      <div className="border-t-2 border-black bg-surface p-3 space-y-2">
        {!isImportingMutation && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={pending}
              >
                <Image className="h-3.5 w-3.5" />
                Scan Struk
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsImportingMutation(true)}
                disabled={pending}
              >
                <FileText className="h-3.5 w-3.5" />
                Impor Mutasi
              </Button>
            </div>
            
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="text-xs text-zinc-500 hover:text-rose-400 font-semibold flex items-center gap-1 cursor-pointer"
                title="Hapus riwayat chat"
              >
                <Trash2 className="h-3 w-3" />
                Hapus
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik transaksi, tanya info keuangan, atau simulasi..."
            disabled={pending || isImportingMutation}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={pending || !input.trim() || isImportingMutation}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function formatMessageText(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseBoldText(headingMatch[2]);
      
      if (level === 1) return <h1 key={idx} className="text-base font-bold my-1 text-zinc-100">{content}</h1>;
      if (level === 2) return <h2 key={idx} className="text-sm font-bold my-1 text-zinc-100">{content}</h2>;
      return <h3 key={idx} className="text-xs font-bold my-0.5 text-zinc-100">{content}</h3>;
    }
    
    const bulletMatch = line.match(/^[\*\-]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <li key={idx} className="ml-4 list-disc text-xs my-0.5 leading-relaxed text-zinc-200">
          {parseBoldText(bulletMatch[1])}
        </li>
      );
    }
    
    return (
      <p key={idx} className="text-xs my-0.5 leading-relaxed text-zinc-200">
        {parseBoldText(line)}
      </p>
    );
  });
}

function parseBoldText(inputText: string) {
  const parts = inputText.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-zinc-100">{part}</strong>;
    }
    return part;
  });
}
