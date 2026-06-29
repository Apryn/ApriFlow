import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { PromptRegistryService } from "@/services/ai-engine/prompt-registry.service";
import { DecisionSimulator } from "@/services/ai-engine/modules/decision-simulator";
import { AIIntelligenceService } from "@/services/ai-engine/ai-intelligence-service";
import { parseTransactionAction } from "@/actions/transaction.actions";
import { chatRateLimiter } from "@/lib/rate-limiter";
import { logAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 });
    }

    // 2. Rate Limiting Check
    const rateLimit = chatRateLimiter.isAllowed(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { message, history } = await request.json();
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    // Process and normalize history payload
    const rawHistory = Array.isArray(history) ? history.slice(-8) : [];
    const formattedHistory = getAlternatingHistory(rawHistory);

    // Resolve AI credentials
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key kecerdasan AI belum dikonfigurasi pada server (.env.local)." },
        { status: 500 }
      );
    }

    const promptRegistry = new PromptRegistryService();

    // 3. Intent Routing Call
    // To ensure strict JSON formatting without role validation crashes, we pass history context as flat text in systemInstruction
    const routerPrompt = await promptRegistry.getPrompt("ai-copilot-router");
    const historySummaryText = formattedHistory
      .map((h) => `${h.role === "user" ? "User" : "AI"}: ${h.parts[0].text}`)
      .join("\n");
      
    const routeResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: routerPrompt + (historySummaryText ? `\n\nRiwayat Percakapan Sebelumnya:\n${historySummaryText}` : "") }]
          },
          contents: [
            { role: "user", parts: [{ text: message }] }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!routeResponse.ok) {
      const errorText = await routeResponse.text();
      console.error("Gemini Intent Router Error response:", routeResponse.status, errorText);
      throw new Error(`Gagal mengklasifikasikan intensi chat: ${errorText}`);
    }
    const routeData = await routeResponse.json();
    const routeJsonText = routeData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedRoute = JSON.parse(routeJsonText);

    const intent = parsedRoute.intent;
    const params = parsedRoute.params || {};

    // Log general AI chat interaction
    await logAnalyticsEvent(user.id, "ai_chat_query", {
      intent,
      messageLength: message.length,
    });

    // 4. Dispatch based on Intent
    if (intent === "RECORD_TRANSACTION") {
      const textToParse = params.text || message;
      // Trigger NLT parse action which automatically saves to transactions as pending review
      const ocrRes = await parseTransactionAction(textToParse);
      
      if (ocrRes.error) {
        return NextResponse.json({
          intent: "GENERAL_CHAT",
          text: `Saya mencoba mencatat transaksi Anda ("${textToParse}"), namun gagal: ${ocrRes.error}. Silakan coba dengan format yang lebih jelas.`,
        });
      }

      await logAnalyticsEvent(user.id, "transaction_recorded_via_nlt", {
        parsedTransactionId: ocrRes.transactionId,
      });

      return NextResponse.json({
        intent: "RECORD_TRANSACTION",
        text: "Saya telah membuat draf transaksi untuk Anda. Silakan review pratinjau di bawah ini:",
        parsedTransactionId: ocrRes.transactionId,
      });
    }

    if (intent === "RUN_SIMULATION") {
      const simulator = new DecisionSimulator();
      let simResult: any = null;

      if (params.type === "resign") {
        simResult = await simulator.simulateResign(user.id);
      } else if (params.type === "purchase") {
        const details = params.purchaseDetails || {};
        const price = details.price || 0;
        
        if (price <= 0) {
          return NextResponse.json({
            intent: "GENERAL_CHAT",
            text: "Untuk menyimulasikan kelayakan pembelian barang/aset, mohon sertakan perkiraan harga barangnya, ya. Contoh: 'apakah aman beli motor ADV 160 seharga 35 juta?'",
          });
        }

        simResult = await simulator.simulatePurchase(
          user.id,
          details.name || "Aset Baru",
          price,
          details.isCash !== false,
          details.downPayment || 0,
          details.monthlyInstallment || 0,
          details.installmentMonths || 0
        );
      } else if (params.type === "goal_roadmap") {
        const details = params.goalDetails || {};
        const targetAmount = details.targetAmount || 0;

        if (targetAmount <= 0) {
          return NextResponse.json({
            intent: "GENERAL_CHAT",
            text: "Untuk menyimulasikan target tabungan, mohon sebutkan nominal target yang ingin dicapai. Contoh: 'target tabungan 100 juta di umur 27'.",
          });
        }

        simResult = await simulator.simulateGoalRoadmap(
          user.id,
          targetAmount,
          details.targetAge || 30
        );
      }

      if (!simResult) {
        return NextResponse.json({
          intent: "GENERAL_CHAT",
          text: "Saya tidak dapat menyimulasikan keputusan itu. Mohon berikan detail nominal atau jenis keputusannya.",
        });
      }

      // Log decision center simulation metrics
      await logAnalyticsEvent(user.id, "decision_simulation", {
        type: params.type,
        isViable: simResult.isViable,
        riskLevel: simResult.riskLevel,
      });

      // Generate friendly commentary for the simulation
      const commentPrompt = await promptRegistry.getPrompt("ai-decision-commentator");
      const commentResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: commentPrompt + `\n\nHasil Kalkulasi Simulasi:\n${JSON.stringify(simResult)}` }]
            },
            contents: [
              ...formattedHistory,
              { role: "user", parts: [{ text: message }] }
            ],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );

      let textCommentary = simResult.impactExplanation;
      if (commentResponse.ok) {
        const commentData = await commentResponse.json();
        textCommentary = commentData.candidates?.[0]?.content?.parts?.[0]?.text || textCommentary;
      }

      return NextResponse.json({
        intent: "RUN_SIMULATION",
        text: textCommentary,
        simulation: simResult,
      });
    }

    if (intent === "FINANCIAL_QUERY") {
      const aiService = new AIIntelligenceService();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const analysis = await aiService.runAnalysis(user.id, currentYear, currentMonth);

      const queryInstruction = `
Anda adalah analis finansial pribadi yang ramah di ApriFlow. Jawab pertanyaan pengguna mengenai kondisi keuangannya saat ini berdasarkan konteks data di bawah.

DATA RIIL KEUANGAN USER:
${JSON.stringify(analysis)}

KETENTUAN RESPON:
- Gunakan data angka riil yang relevan dari konteks di atas untuk menjawab.
- Jangan mengarang/berhalusinasi tentang angka yang tidak ada.
- Jawab secara ringkas, sopan, dan bersahabat dalam Bahasa Indonesia.
- Jangan gunakan markdown yang panjang, cukup buat poin-poin jika dibutuhkan.
`;

      const queryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: queryInstruction }]
            },
            contents: [
              ...formattedHistory,
              { role: "user", parts: [{ text: message }] }
            ],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );

      if (!queryResponse.ok) throw new Error("Gagal memanggil AI untuk menjawab pertanyaan.");
      const queryData = await queryResponse.json();
      const textAnswer = queryData.candidates?.[0]?.content?.parts?.[0]?.text;

      return NextResponse.json({
        intent: "FINANCIAL_QUERY",
        text: textAnswer,
      });
    }

    // Default: GENERAL_CHAT
    const chatInstruction = `
Anda adalah asisten konsultan keuangan di ApriFlow yang bersahabat, profesional, dan pintar. Jawab pesan sapaan atau umum berikut dengan sopan dalam Bahasa Indonesia.
Jika pengguna meminta saran yang membutuhkan perhitungan, arahkan mereka untuk bertanya secara spesifik tentang pengeluaran atau menyimulasikan keputusan finansial.
`;

    const chatResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: chatInstruction }]
          },
          contents: [
            ...formattedHistory,
            { role: "user", parts: [{ text: message }] }
          ],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!chatResponse.ok) throw new Error("Gagal memproses obrolan.");
    const chatData = await chatResponse.json();
    const chatText = chatData.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      intent: "GENERAL_CHAT",
      text: chatText,
    });

  } catch (err: any) {
    console.error("Error in Copilot Chat Route Handler:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal saat memproses pesan." },
      { status: 500 }
    );
  }
}

function getAlternatingHistory(history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  const result: typeof history = [];
  for (const msg of history) {
    if (result.length === 0) {
      result.push(JSON.parse(JSON.stringify(msg)));
    } else {
      const last = result[result.length - 1];
      if (last.role !== msg.role) {
        result.push(JSON.parse(JSON.stringify(msg)));
      } else {
        // Merge texts if consecutive matching roles to keep Gemini happy
        last.parts[0].text = (last.parts[0].text + "\n" + (msg.parts[0]?.text || "")).trim();
      }
    }
  }
  return result;
}
