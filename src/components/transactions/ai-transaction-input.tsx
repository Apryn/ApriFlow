"use client";

import { useState, useRef, useEffect } from "react";
import { parseTransactionAction } from "@/actions/transaction.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParsedTransactionPreview } from "./parsed-transaction-preview";
import { Send, Sparkles, User, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text?: string;
  parsedTransactionId?: string;
  error?: string;
  loading?: boolean;
}

export function AITransactionInput() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Halo! Saya adalah asisten keuangan AI Anda. Ketik apa saja transaksi Anda hari ini, misalnya:\n\n• 'beli kopi 35rb di warkop bayar qris'\n• 'gaji masuk 3 juta hari ini'\n• 'beli bensin 30 ribu cash'\n\nSaya akan mengubahnya menjadi draf transaksi pending secara otomatis!",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      const res = await parseTransactionAction(userText);

      if (res.error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  id: aiMsgId,
                  sender: "ai",
                  error: res.error,
                }
              : msg
          )
        );
      } else if (res.transactionId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  id: aiMsgId,
                  sender: "ai",
                  text: "Saya telah membuat draf transaksi dari teks Anda. Silakan tinjau di bawah ini:",
                  parsedTransactionId: res.transactionId,
                }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                id: aiMsgId,
                sender: "ai",
                error: errorMessage,
              }
            : msg
        )
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px] border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Chat Messages */}
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
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold ${
                  isUser
                    ? "bg-teal-600 text-white"
                    : "bg-teal-50 text-teal-600 border border-teal-100"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-teal-600" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    isUser
                      ? "bg-teal-600 text-white font-medium rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {msg.loading ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:0.4s]" />
                    </div>
                  ) : msg.error ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{msg.error}</span>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Parsed Transaction Preview Card */}
                {msg.parsedTransactionId && (
                  <div className="mt-2 text-left">
                    <ParsedTransactionPreview
                      transactionId={msg.parsedTransactionId}
                      onActionComplete={() => {
                        // Mark transaction preview as resolved or remove/update text
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id
                              ? { ...m, text: "Transaksi telah diproses!" }
                              : m
                          )
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="border-t border-gray-100 bg-gray-50/50 p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik transaksi Anda... (cth: makan siang 45rb cash)"
          disabled={pending}
          className="flex-1 rounded-xl bg-white border border-gray-200 focus:border-teal-500 py-2.5"
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending || !input.trim()}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2.5 h-auto flex items-center justify-center shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
