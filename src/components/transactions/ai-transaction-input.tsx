"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParsedTransactionPreview } from "./parsed-transaction-preview";
import { 
  Send, Sparkles, User, AlertCircle, Image, FileText, 
  AlertTriangle, TrendingUp, CheckCircle, ShieldAlert, Trash2
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

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("apriflow_chat_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([WELCOME_MESSAGE]);
      }
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
  }, []);

  // Save chat history to localStorage when messages change
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

    // Add User Message & AI Loading state
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: userText },
      { id: aiMsgId, sender: "ai", loading: true },
    ]);

    // Build chat history context (excluding welcome and loading messages)
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
    } catch (err: unknown) {
      console.error("AI Chat Error:", err);
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
    } catch (err: unknown) {
      console.error("AI OCR Error:", err);
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
    } catch (err: unknown) {
      console.error("AI Bank Import Error:", err);
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

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case "critical": return "bg-red-500 text-black";
      case "high": return "bg-rose-400 text-black";
      case "medium": return "bg-amber-400 text-black";
      default: return "bg-teal-400 text-black";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "critical": return "Kritis";
      case "high": return "Tinggi";
      case "medium": return "Sedang";
      default: return "Rendah / Aman";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-315px)] md:h-[70vh] md:max-h-[700px] border-2 border-black bg-zinc-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
      {/* Hidden file input for OCR scan */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-2xl text-xs font-bold border-2 border-black ${
                  isUser
                    ? "bg-teal-400 text-black shadow-[1px_1px_0px_0px_#000]"
                    : "bg-zinc-800 text-teal-400 border-zinc-700"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-teal-400" />}
              </div>

              {/* Message Content */}
              <div className="space-y-2 flex-1">
                {/* Chat bubble text */}
                {msg.text && (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
                      isUser
                        ? "bg-teal-400 text-black font-bold rounded-tr-none whitespace-pre-line"
                        : "bg-zinc-800 text-zinc-100 rounded-tl-none leading-relaxed"
                    }`}
                  >
                    {isUser ? msg.text : formatMessageText(msg.text)}
                  </div>
                )}

                {/* Loading state bubble */}
                {msg.loading && (
                  <div className="rounded-2xl px-4 py-2.5 bg-zinc-800 text-zinc-400 border-2 border-black shadow-[2px_2px_0px_0px_#000] rounded-tl-none inline-block">
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {/* Error bubble */}
                {msg.error && (
                  <div className="rounded-2xl px-4 py-2.5 bg-zinc-950 text-red-400 rounded-tl-none flex items-center gap-2 border-2 border-red-500/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-bold">{msg.error}</span>
                  </div>
                )}

                {/* Parsed Transaction Card Preview */}
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

                {/* Decision Center Card Preview */}
                {msg.simulation && (
                  <div className="mt-3 border-2 border-black bg-zinc-950 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4 text-left max-w-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                        <TrendingUp className="h-4 w-4 text-teal-400" />
                        {getDecisionTypeLabel(msg.simulation.decisionType)}
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border border-black font-extrabold uppercase tracking-wider ${getRiskBadgeStyles(msg.simulation.riskLevel)} shadow-[1px_1px_0px_0px_#000]`}>
                        Risiko {getRiskLabel(msg.simulation.riskLevel)}
                      </span>
                    </div>

                    {/* Proyeksi Viability Banner */}
                    <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${msg.simulation.isViable ? "bg-teal-400 text-black" : "bg-rose-500 text-black"}`}>
                      {msg.simulation.isViable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-black shrink-0" />
                          <span>Keputusan tergolong LAYAK berdasarkan cadangan dana Anda saat ini.</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 text-black shrink-0" />
                          <span>Keputusan tergolong BERISIKO TINGGI atau saldo kas tidak mencukupi.</span>
                        </>
                      )}
                    </div>

                    {/* Metrik Sekarang vs Simulasi */}
                    <div className="grid grid-cols-3 gap-2 py-1 text-center bg-zinc-900 border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Skor Sehat</span>
                        <span className="text-xs text-zinc-500 block line-through">{msg.simulation.currentMetrics.healthScore}/100</span>
                        <span className="text-sm font-black text-teal-400 block">{msg.simulation.simulatedMetrics.healthScore}/100</span>
                      </div>
                      <div className="space-y-1 border-x border-black">
                        <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Kas Bersih</span>
                        <span className="text-[10px] text-zinc-500 block line-through">{formatRupiah(msg.simulation.currentMetrics.netCashFlow)}</span>
                        <span className="text-xs font-black text-zinc-100 block">{formatRupiah(msg.simulation.simulatedMetrics.netCashFlow)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Ketahanan</span>
                        <span className="text-xs text-zinc-500 block line-through">{msg.simulation.currentMetrics.emergencyFundMonths.toFixed(1)} bln</span>
                        <span className="text-sm font-black text-teal-400 block">{msg.simulation.simulatedMetrics.emergencyFundMonths.toFixed(1)} bln</span>
                      </div>
                    </div>

                    {/* Warnings List */}
                    {msg.simulation.warnings.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Peringatan Risiko:
                        </span>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                          {msg.simulation.warnings.map((w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations List */}
                    {msg.simulation.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Saran Langkah Taktis:
                        </span>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
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

      {/* Inline Bank Mutation Parser Form */}
      {isImportingMutation && (
        <div className="absolute inset-x-0 bottom-0 bg-zinc-900 border-t-2 border-black p-4 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.3)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-400" />
              Impor Mutasi Rekening Bank
            </span>
            <button 
              onClick={() => setIsImportingMutation(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Batal
            </button>
          </div>
          <form onSubmit={handleMutationSubmit} className="space-y-2.5">
            <textarea
              value={mutationText}
              onChange={(e) => setMutationText(e.target.value)}
              placeholder="Paste teks mutasi bank di sini... (Contoh: 29/06 TRANSFER DR Rp 50.000 Kopi Kenangan)"
              rows={4}
              required
              className="w-full text-xs p-2.5 bg-zinc-950 border-2 border-black text-zinc-100 rounded-xl focus:border-teal-400 focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] placeholder:text-zinc-600 transition-all"
            />
            <Button 
              type="submit" 
              className="w-full bg-teal-400 hover:bg-teal-300 text-black border-2 border-black text-xs py-2.5 h-auto rounded-xl shadow-[2px_2px_0px_0px_#000]"
              disabled={pending || !mutationText.trim()}
            >
              Urai Mutasi & Impor
            </Button>
          </form>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="border-t-2 border-black bg-zinc-900 p-3 space-y-2.5">
        {/* Quick Menu */}
        {!isImportingMutation && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={pending}
                className="bg-zinc-800 border-2 border-black text-zinc-100 hover:bg-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 h-auto shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                <Image className="h-3.5 w-3.5 text-teal-400" />
                Scan Struk Belanja
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsImportingMutation(true)}
                disabled={pending}
                className="bg-zinc-800 border-2 border-black text-zinc-100 hover:bg-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 h-auto shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                <FileText className="h-3.5 w-3.5 text-teal-400" />
                Impor Mutasi Bank
              </Button>
            </div>
            
            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="text-[10px] text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 pr-1.5"
                title="Hapus riwayat chat"
              >
                <Trash2 className="h-3 w-3" />
                Hapus Chat
              </button>
            )}
          </div>
        )}

        {/* Input Bar Form */}
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik transaksi, tanya info keuangan, atau buat simulasi..."
            disabled={pending || isImportingMutation}
            className="flex-1 rounded-xl bg-zinc-950 border-2 border-black focus:border-teal-400 py-2.5 text-sm text-zinc-100 focus:shadow-[2px_2px_0px_0px_#000] placeholder:text-zinc-600 transition-all"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending || !input.trim() || isImportingMutation}
            className="bg-teal-400 hover:bg-teal-300 text-black border-2 border-black rounded-xl px-4 py-2.5 h-auto flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
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
    // 1. Heading check (###)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseBoldText(headingMatch[2]);
      
      if (level === 1) return <h1 key={idx} className="text-base font-extrabold my-2 text-gray-900">{content}</h1>;
      if (level === 2) return <h2 key={idx} className="text-sm font-bold my-1.5 text-gray-900">{content}</h2>;
      return <h3 key={idx} className="text-xs font-bold my-1 text-gray-900">{content}</h3>;
    }
    
    // 2. Bullet list check (* or -)
    const bulletMatch = line.match(/^[\*\-]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <li key={idx} className="ml-4 list-disc text-xs my-0.5 leading-relaxed text-gray-700">
          {parseBoldText(bulletMatch[1])}
        </li>
      );
    }
    
    // 3. Normal paragraph
    return (
      <p key={idx} className="text-xs my-0.5 leading-relaxed text-gray-700">
        {parseBoldText(line)}
      </p>
    );
  });
}

function parseBoldText(inputText: string) {
  const parts = inputText.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-gray-950">{part}</strong>;
    }
    return part;
  });
}
