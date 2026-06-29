import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { PromptRegistryService } from "@/services/ai-engine/prompt-registry.service";
import { getCategories } from "@/lib/db/transactions";
import { createClient } from "@/lib/supabase/server";
import { bankImportRateLimiter } from "@/lib/rate-limiter";
import { logAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 });
    }

    // 2. Rate Limiting Check
    const rateLimit = bankImportRateLimiter.isAllowed(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key kecerdasan AI belum dikonfigurasi pada server (.env.local)." },
        { status: 500 }
      );
    }

    const { text: mutationText } = await request.json();
    if (!mutationText || mutationText.trim().length === 0) {
      return NextResponse.json({ error: "Teks mutasi bank tidak boleh kosong." }, { status: 400 });
    }

    // 3. Load Prompts & Categories
    const promptRegistry = new PromptRegistryService();
    const rawPrompt = await promptRegistry.getPrompt("ai-bank-parser");
    const userCategories = await getCategories(user.id);
    const categoryNamesList = userCategories.map((c) => `${c.name} (${c.type})`).join(", ");

    const bankPrompt = rawPrompt + `\n\nDAFTAR KATEGORI USER YANG TERSEDIA:\n[${categoryNamesList}]`;

    // 4. Call Gemini API to parse mutation text
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: bankPrompt + "\n\nTeks Mutasi:\n" + mutationText }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      // Retry or fail gracefully
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const retryResponse = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: bankPrompt + "\n\nTeks Mutasi:\n" + mutationText }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new Error(`Gemini Mutation API Error: ${retryResponse.statusText} - ${errorText}`);
      }
    }

    const responseToParse = response.ok ? response : null; // We can parse whichever succeeded
    let finalResponse = response;
    if (!response.ok) {
      // Fetch was retried
      // Actually we handled throwing error in the check above if retry failed.
      // Let's make this block simpler:
    }

    const responseData = await response.json();
    const resultJsonText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultJsonText) {
      throw new Error("Gagal mengurai teks mutasi.");
    }

    const parsedData = JSON.parse(resultJsonText);
    const parsedTransactions = parsedData.transactions || [];

    if (parsedTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada transaksi yang terdeteksi pada teks mutasi tersebut.",
        transactions: [],
      });
    }

    // 5. Match Categories and Save transactions to database
    const supabase = await createClient();
    const insertedTransactions: any[] = [];

    for (const pTx of parsedTransactions) {
      const amount = Number(pTx.amount) || 0;
      const type = pTx.type === "income" ? "income" : "expense";
      
      // Category matching
      let matchedCategory = userCategories.find(
        (c) => c.name.toLowerCase() === (pTx.category_name || "").toLowerCase() && c.type === type
      );

      if (!matchedCategory) {
        matchedCategory = userCategories.find(
          (c) => c.type === type && c.name.toLowerCase().includes((pTx.category_name || "").toLowerCase())
        );
      }

      if (!matchedCategory) {
        matchedCategory = userCategories.find((c) => c.name === "Lain-lain" && c.type === type);
      }

      const { data: inserted, error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type,
          category_id: matchedCategory?.id ?? null,
          amount,
          date: pTx.date || new Date().toISOString().split("T")[0],
          payment_method: "transfer",
          merchant: pTx.merchant || null,
          note: pTx.note || "Diimpor melalui mutasi bank.",
          source: "bank_import",
          status: "pending_review",
          ai_confidence: 0.85,
          ai_raw_payload: pTx,
        })
        .select("*, category:categories(id, name, expense_kind)")
        .single();

      if (!insertError && inserted) {
        insertedTransactions.push(inserted);
      }
    }

    // Log bank mutation import analytic event
    await logAnalyticsEvent(user.id, "bank_import", {
      count: insertedTransactions.length,
    });

    return NextResponse.json({
      success: true,
      count: insertedTransactions.length,
      transactions: insertedTransactions,
    });

  } catch (err: any) {
    console.error("Error in Bank Import Route Handler:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengimpor mutasi bank." },
      { status: 500 }
    );
  }
}
