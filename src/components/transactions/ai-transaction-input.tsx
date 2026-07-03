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
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
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
    <div className="flex flex-col h-[calc(100dvh-315px)] md:h-[70vh] md:max-h-[700px] border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden relative">
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
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold ${
                  isUser
                    ? "bg-teal-600 text-white"
                    : "bg-teal-50 text-teal-600 border border-teal-100"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-teal-600" />}
              </div>

              {/* Message Content */}
              <div className="space-y-2 flex-1">
                {/* Chat bubble text */}
                {msg.text && (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isUser
                        ? "bg-teal-600 text-white font-medium rounded-tr-none whitespace-pre-line"
                        : "bg-gray-100 text-gray-800 rounded-tl-none leading-relaxed"
                    }`}
                  >
                    {isUser ? msg.text : formatMessageText(msg.text)}
                  </div>
                )}

                {/* Loading state bubble */}
                {msg.loading && (
                  <div className="rounded-2xl px-4 py-2.5 bg-gray-100 rounded-tl-none inline-block">
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {/* Error bubble */}
                {msg.error && (
                  <div className="rounded-2xl px-4 py-2.5 bg-red-50 text-red-700 rounded-tl-none flex items-center gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{msg.error}</span>
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
                  <div className="mt-3 border border-gray-200 bg-white rounded-2xl p-4 shadow-sm space-y-4 text-left max-w-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                        {getDecisionTypeLabel(msg.simulation.decisionType)}
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getRiskBadgeStyles(msg.simulation.riskLevel)}`}>
                        Risiko {getRiskLabel(msg.simulation.riskLevel)}
                      </span>
                    </div>

                    {/* Proyeksi Viability Banner */}
                    <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${msg.simulation.isViable ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-800 border border-red-100"}`}>
                      {msg.simulation.isViable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span>Keputusan tergolong LAYAK berdasarkan cadangan dana Anda saat ini.</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                          <span>Keputusan tergolong BERISIKO TINGGI atau saldo kas tidak mencukupi.</span>
                        </>
                      )}
                    </div>

                    {/* Metrik Sekarang vs Simulasi */}
                    <div className="grid grid-cols-3 gap-2 py-1 text-center bg-gray-50/50 rounded-xl p-2.5">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-medium block">Skor Sehat</span>
                        <span className="text-xs text-gray-400 block line-through">{msg.simulation.currentMetrics.healthScore}/100</span>
                        <span className="text-sm font-bold text-teal-600 block">{msg.simulation.simulatedMetrics.healthScore}/100</span>
                      </div>
                      <div className="space-y-1 border-x border-gray-100">
                        <span className="text-[10px] text-gray-400 font-medium block">Kas Bersih</span>
                        <span className="text-[10px] text-gray-400 block line-through">{formatRupiah(msg.simulation.currentMetrics.netCashFlow)}</span>
                        <span className="text-xs font-bold text-gray-900 block">{formatRupiah(msg.simulation.simulatedMetrics.netCashFlow)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-medium block">Ketahanan Kas</span>
                        <span className="text-xs text-gray-400 block line-through">{msg.simulation.currentMetrics.emergencyFundMonths.toFixed(1)} bln</span>
                        <span className="text-sm font-bold text-teal-600 block">{msg.simulation.simulatedMetrics.emergencyFundMonths.toFixed(1)} bln</span>
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
        <div className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-100 p-4 z-10 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-600" />
              Impor Mutasi Rekening Bank
            </span>
            <button 
              onClick={() => setIsImportingMutation(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Batal
            </button>
          </div>
          <form onSubmit={handleMutationSubmit} className="space-y-2">
            <textarea
              value={mutationText}
              onChange={(e) => setMutationText(e.target.value)}
              placeholder="Paste teks mutasi bank di sini... (Contoh: 29/06 TRANSFER DR Rp 50.000 Kopi Kenangan)"
              rows={4}
              required
              className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
            />
            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 h-auto rounded-xl"
              disabled={pending || !mutationText.trim()}
            >
              Urai Mutasi & Impor
            </Button>
          </form>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-2">
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
                className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 h-auto"
              >
                <Image className="h-3.5 w-3.5 text-teal-600" />
                Scan Struk Belanja
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsImportingMutation(true)}
                disabled={pending}
                className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 h-auto"
              >
                <FileText className="h-3.5 w-3.5 text-teal-600" />
                Impor Mutasi Bank
              </Button>
            </div>
            
            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 pr-1.5"
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
            className="flex-1 rounded-xl bg-white border border-gray-200 focus:border-teal-500 py-2.5 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending || !input.trim() || isImportingMutation}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2.5 h-auto flex items-center justify-center shrink-0"
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
