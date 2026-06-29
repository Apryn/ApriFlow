import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { PromptRegistryService } from "@/services/ai-engine/prompt-registry.service";
import { getCategories } from "@/lib/db/transactions";
import { createClient } from "@/lib/supabase/server";
import { ocrRateLimiter } from "@/lib/rate-limiter";
import { logAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 });
    }

    // 2. Rate Limiting Check
    const rateLimit = ocrRateLimiter.isAllowed(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan unggah. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.` },
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

    // 3. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "File struk tidak ditemukan." }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // 4. Load prompts & categories
    const promptRegistry = new PromptRegistryService();
    const rawPrompt = await promptRegistry.getPrompt("ai-ocr-extractor");
    const userCategories = await getCategories(user.id);
    const categoryNamesList = userCategories.map((c) => `${c.name} (${c.type})`).join(", ");

    const todayStr = new Date().toISOString().split("T")[0];
    const ocrPrompt = rawPrompt
      .replace("{today}", todayStr)
      + `\n\nDAFTAR KATEGORI USER YANG TERSEDIA:\n[${categoryNamesList}]`;

    // 5. Call Multimodal Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: ocrPrompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Multimodal API Error: ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    const resultJsonText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultJsonText) {
      throw new Error("Gagal membaca respon dari Gemini vision.");
    }

    const parsedOCR = JSON.parse(resultJsonText);

    // 6. Match category
    const parsedCatName = parsedOCR.category_name || "Lain-lain";
    let matchedCategory = userCategories.find(
      (c) => c.name.toLowerCase() === parsedCatName.toLowerCase() && c.type === "expense"
    );

    if (!matchedCategory) {
      matchedCategory = userCategories.find(
        (c) => c.type === "expense" && c.name.toLowerCase().includes(parsedCatName.toLowerCase())
      );
    }

    if (!matchedCategory) {
      matchedCategory = userCategories.find((c) => c.name === "Lain-lain" && c.type === "expense");
    }

    // 7. Save as Pending review transaction in database
    const supabase = await createClient();
    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "expense",
        category_id: matchedCategory?.id ?? null,
        amount: parsedOCR.amount || 0,
        date: parsedOCR.date || todayStr,
        payment_method: parsedOCR.payment_method || "other",
        merchant: parsedOCR.merchant || null,
        note: `Dipindai otomatis melalui OCR struk.`,
        source: "receipt_scan",
        status: "pending_review",
        ai_confidence: 0.9,
        ai_raw_payload: parsedOCR,
      })
      .select("*, category:categories(id, name, expense_kind)")
      .single();

    if (insertError) {
      throw insertError;
    }

    // Log receipt ocr extraction analytic event
    await logAnalyticsEvent(user.id, "ocr_receipt_scan", {
      transactionId: transaction.id,
      amount: parsedOCR.amount,
      categoryName: matchedCategory?.name,
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      transaction,
    });

  } catch (err: any) {
    console.error("Error in AI OCR Route Handler:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengekstrak struk belanja." },
      { status: 500 }
    );
  }
}
