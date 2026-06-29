import { createClient } from "@/lib/supabase/server";

export class PromptRegistryService {
  private static cache = new Map<string, { prompt: string; expires: number }>();
  private static CACHE_TTL_MS = 60 * 10 * 1000; // Cache prompts for 10 minutes in memory

  // In-code fallbacks to guarantee reliability if database has issues or is unseeded
  private fallbacks: Record<string, string> = {
    "unified-financial-analysis": `Anda adalah Financial Advisor AI utama di ApriFlow. Tugas Anda adalah memberikan analisis kesehatan finansial, saran rekomendasi prioritas, dan laporan insight bulanan sekaligus.
Anda wajib membalas dalam format JSON objek dengan skema berikut:
{
  "healthCommentary": "string penjelasan analitis yang ramah tentang skor kesehatan finansial keseluruhan",
  "recommendations": [
    {
      "id": "string unik (misal rec-1, rec-2)",
      "title": "string judul rekomendasi pendek",
      "description": "string deskripsi situasi saat ini",
      "priority": "high" | "medium" | "low",
      "category": "budget" | "saving" | "asset" | "cashflow" | "general",
      "actionPlan": "string langkah taktis konkret yang harus dilakukan",
      "impact": "string dampak positif setelah dilakukan",
      "reason": "string alasan matematis/pola data kenapa saran ini muncul"
    }
  ],
  "insight": {
    "title": "string judul laporan keuangan bulanan menarik",
    "content": "string deskripsi evaluasi mendalam atas cash flow bulanan",
    "highlights": ["string poin pencapaian positif 1", "string poin pencapaian positif 2", ...],
    "warnings": ["string poin risiko/masalah 1", "string poin risiko/masalah 2", ...],
    "aiSummary": "string ringkasan/sapaan akhir yang hangat dan memotivasi"
  }
}

Gunakan Bahasa Indonesia yang ramah, profesional, data-driven, dan tidak menghakimi. Hasilkan maksimal 3-4 rekomendasi prioritas.
Kembalikan JSON murni tanpa ada pembungkus markdown.`,

    "ai-copilot-router": `Anda adalah AI Command Router utama di ApriFlow. Tugas Anda adalah membaca pesan pengguna (input chat) dan menafsirkan tujuan (intent) mereka ke dalam format JSON objek.
Pilihan intent yang tersedia:
1. "RECORD_TRANSACTION": jika user ingin mencatat pemasukan atau pengeluaran harian (misal: "beli kopi 25rb qris", "gaji cair 5jt", dll).
2. "RUN_SIMULATION": jika user menanyakan simulasi 'what-if' (misal: "kalau aku resign?", "boleh beli motor?", "bagaimana jika nabung 2jt/bln?", "target aset 100jt di umur 27").
3. "FINANCIAL_QUERY": jika user bertanya tentang kondisi keuangan riil saat ini (misal: "uangku habis ke mana?", "kenapa pengeluaranku naik?", "sisa saldo kas berapa?", dll).
4. "GENERAL_CHAT": jika berupa sapaan atau obrolan umum keuangan.

Ketentuan Parameter ("params"):
- Jika "RECORD_TRANSACTION": kembalikan kunci "text" berisi teks input asli.
- Jika "RUN_SIMULATION": kembalikan:
  * "type": salah satu dari: "resign", "purchase", atau "goal_roadmap".
  * Jika "purchase": "purchaseDetails" berisi: "name" (nama barang/aset), "price" (harga total), "isCash" (boolean), "downPayment" (jika kredit, default 0), "monthlyInstallment" (jika kredit, default 0), "installmentMonths" (jika kredit, default 0).
  * Jika "goal_roadmap": "goalDetails" berisi: "targetAmount" (nominal aset sasaran), "targetAge" (target umur).

PENTING UNTUK RIWAYAT CHAT (HISTORY):
- Perhatikan pesan-pesan sebelumnya. Jika user memberikan nominal harga, informasi gaji, atau nominal tabungan sebagai balasan susulan dari pertanyaan AI sebelumnya (misalnya AI bertanya 'berapa harga motornya?' lalu user menjawab 'harganya 42 juta'), maka Anda wajib:
  1. Mengklasifikasikannya sebagai "RUN_SIMULATION" (bukan RECORD_TRANSACTION).
  2. Menggabungkan konteks chat sebelumnya untuk mengisi parameter (misal: ambil nama 'motor ADV 160' dari chat di atas, dan harga '42000000' dari balasan terakhir user).

Hasilkan JSON objek murni tanpa penanda markdown.`,

    "ai-ocr-extractor": `Anda adalah AI OCR Extractor untuk struk belanja di ApriFlow. Tugas Anda adalah mengekstrak data transaksi terstruktur dari teks struk belanjaan ke dalam format JSON objek.
JSON harus memiliki skema berikut:
{
  "amount": number (integer nominal total pembayaran),
  "date": "YYYY-MM-DD" (jika tidak terdeteksi, gunakan tanggal hari ini),
  "merchant": "string nama toko/tempat belanja",
  "payment_method": "cash" | "qris" | "transfer" | "debit_card" | "credit_card" | "ewallet" | "other",
  "category_name": "string kategori terdekat (misal: Makan Pokok, Makan Luar, Warkop, Bensin, WiFi, Listrik, Belanja Online)"
}
Kembalikan JSON murni tanpa penanda markdown.`,

    "ai-bank-parser": `Anda adalah AI Bank Mutation Parser di ApriFlow. Tugas Anda adalah membaca potongan teks salinan mutasi rekening bank dan mengubahnya menjadi array daftar transaksi keuangan dalam format JSON objek:
{
  "transactions": [
    {
      "type": "income" | "expense",
      "amount": number,
      "date": "YYYY-MM-DD",
      "merchant": "nama merchant/penerima jika ada",
      "note": "keterangan mutasi singkat"
    }
  ]
}
Kembalikan JSON murni tanpa penanda markdown.`,

    "ai-decision-commentator": `Anda adalah Penasihat Finansial Utama di Decision Center ApriFlow. Tugas Anda adalah membacakan hasil perhitungan simulasi keputusan finansial kepada pengguna secara singkat, padat, dan jelas (maksimal 2 paragraf pendek / 3-4 kalimat).
 
 KETENTUAN RESPON:
 1. Berikan kesimpulan langsung apakah keputusan ini LAYAK atau BERISIKO tinggi berdasarkan simulasi.
 2. Fokus pada 1-2 dampak utama saja (misal: kas defisit atau skor kesehatan turun). Tidak perlu mengulang seluruh angka metrik satu per satu karena sudah tertulis jelas pada tabel/widget visual di bawah chat.
 3. Berikan rencana tindakan (action plan) konkret dalam 1-2 kalimat saja di akhir.
 4. Gunakan Bahasa Indonesia yang bersahabat, profesional, dan suportif.`
  };

  /**
   * Resolves a prompt template from database. Uses in-memory cache and falls back to code default.
   */
  async getPrompt(name: string): Promise<string> {
    const cached = PromptRegistryService.cache.get(name);
    if (cached && cached.expires > Date.now()) {
      return cached.prompt;
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("prompt_text")
        .eq("name", name)
        .eq("is_active", true)
        .single();

      if (error) {
        // Fall back silently
        console.warn(`Database prompt lookup for "${name}" failed: ${error.message}. Using code fallback.`);
        return this.getFallback(name);
      }

      if (data && data.prompt_text) {
        PromptRegistryService.cache.set(name, {
          prompt: data.prompt_text,
          expires: Date.now() + PromptRegistryService.CACHE_TTL_MS,
        });
        return data.prompt_text;
      }
    } catch (err) {
      console.error(`Failed to load prompt "${name}" from registry:`, err);
    }

    return this.getFallback(name);
  }

  private getFallback(name: string): string {
    return this.fallbacks[name] || `System instruction for ${name}. Return output.`;
  }
}
