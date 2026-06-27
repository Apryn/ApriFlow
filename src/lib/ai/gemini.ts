import { todayISO } from "@/lib/utils/date";

export interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  category_name: string;
  payment_method: "cash" | "qris" | "transfer" | "debit_card" | "credit_card" | "ewallet" | "other";
  merchant: string | null;
  date: string;
  note: string | null;
  confidence: number;
}

/**
 * Parses natural language input using Google Gemini API or a rule-based fallback.
 */
export async function parseTransactionWithAI(
  input: string,
  categories: { name: string; type: "income" | "expense" }[]
): Promise<ParsedTransaction> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in env. Using rule-based fallback parser.");
    return parseTransactionFallback(input, categories);
  }

  const today = todayISO();
  const categoryNamesList = categories.map((c) => `${c.name} (${c.type})`).join(", ");

  const prompt = `
Anda adalah asisten keuangan AI yang bertugas mengekstrak detail transaksi keuangan dari teks bahasa natural.
Hari ini adalah tanggal: ${today}.

DAFTAR KATEGORI YANG TERSEDIA:
[${categoryNamesList}]

INFORMASI PENTING:
1. Ekstrak nominal uang (amount). Jika ada singkatan seperti "rb" artinya ribu, "jt" artinya juta.
2. Tentukan jenis transaksi ("income" untuk pemasukan, "expense" untuk pengeluaran).
3. Cari kategori yang paling cocok dari daftar kategori di atas. Jika tidak ada yang cocok, gunakan kategori "Lain-lain" sesuai jenis transaksinya.
4. Tentukan metode pembayaran yang sesuai ("cash", "qris", "transfer", "debit_card", "credit_card", "ewallet", "other"). Default adalah "other".
5. Ekstrak merchant (nama toko/tempat) jika disebutkan.
6. Tentukan tanggal transaksi dalam format YYYY-MM-DD. Gunakan referensi hari ini (${today}) untuk menghitung tanggal relatif seperti "hari ini", "kemarin", "lusa", "2 hari lalu", dll.
7. Buat catatan (note) singkat berisi deskripsi atau detail tambahan jika ada.
8. Berikan nilai tingkat keyakinan (confidence) dari 0.0 sampai 1.0.

Teks input dari user: "${input}"
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  enum: ["income", "expense"],
                },
                amount: {
                  type: "INTEGER",
                },
                category_name: {
                  type: "STRING",
                  description: "Harus sedekat mungkin dengan nama dari daftar kategori yang tersedia",
                },
                payment_method: {
                  type: "STRING",
                  enum: ["cash", "qris", "transfer", "debit_card", "credit_card", "ewallet", "other"],
                },
                merchant: {
                  type: "STRING",
                  nullable: true,
                },
                date: {
                  type: "STRING",
                  description: "Format YYYY-MM-DD",
                },
                note: {
                  type: "STRING",
                  nullable: true,
                },
                confidence: {
                  type: "NUMBER",
                },
              },
              required: ["type", "amount", "category_name", "payment_method", "date", "confidence"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.statusText} - ${errorText}`);
    }

    const resJson = await response.json();
    const textResult = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("No text response received from Gemini.");
    }

    const parsed = JSON.parse(textResult) as ParsedTransaction;
    return parsed;
  } catch (error) {
    console.error("Failed to parse transaction with Gemini, falling back:", error);
    return parseTransactionFallback(input, categories);
  }
}

/**
 * Basic regex-based rule parser fallback when Gemini is unavailable.
 */
function parseTransactionFallback(
  input: string,
  categories: { name: string; type: "income" | "expense" }[]
): ParsedTransaction {
  const normalized = input.toLowerCase();

  // 1. Determine Type
  let type: "income" | "expense" = "expense";
  if (
    normalized.includes("gaji") ||
    normalized.includes("cair") ||
    normalized.includes("masuk") ||
    normalized.includes("terima") ||
    normalized.includes("hadiah") ||
    normalized.includes("bonus")
  ) {
    type = "income";
  }

  // 2. Determine Amount
  let amount = 0;
  // Match patterns like "35rb", "35 ribu", "3 jt", "3 juta", "300.000", "300000"
  const amountMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt|k)?/i);
  if (amountMatch) {
    let base = parseFloat(amountMatch[1].replace(",", "."));
    const unit = amountMatch[2]?.toLowerCase();
    if (unit === "ribu" || unit === "rb" || unit === "k") {
      base *= 1000;
    } else if (unit === "juta" || unit === "jt") {
      base *= 1000000;
    }
    amount = Math.round(base);
  }

  // 3. Determine Payment Method
  let payment_method: ParsedTransaction["payment_method"] = "other";
  if (normalized.includes("qris") || normalized.includes("gopay") || normalized.includes("ovo") || normalized.includes("shopeepay") || normalized.includes("dana")) {
    payment_method = "qris";
  } else if (normalized.includes("cash") || normalized.includes("tunai") || normalized.includes("kontan")) {
    payment_method = "cash";
  } else if (normalized.includes("transfer") || normalized.includes("tf") || normalized.includes("m-banking") || normalized.includes("mbanking")) {
    payment_method = "transfer";
  } else if (normalized.includes("debit") || normalized.includes("atm")) {
    payment_method = "debit_card";
  } else if (normalized.includes("kartu kredit") || normalized.includes("credit card") || normalized.includes("cc")) {
    payment_method = "credit_card";
  } else if (normalized.includes("ewallet") || normalized.includes("e-wallet")) {
    payment_method = "ewallet";
  }

  // 4. Match Category
  let category_name = type === "income" ? "Lain-lain" : "Lain-lain";
  
  // Try to find matching category by checking keywords
  const matchedCat = categories.find((c) => {
    if (c.type !== type) return false;
    const catLower = c.name.toLowerCase();
    
    // Custom keyword match rules
    if (catLower.includes("kopi") || catLower.includes("warkop") || catLower.includes("cafe")) {
      return normalized.includes("kopi") || normalized.includes("warkop") || normalized.includes("ngopi") || normalized.includes("cafe");
    }
    if (catLower.includes("bensin") || catLower.includes("pertamax") || catLower.includes("shell") || catLower.includes("pertalite")) {
      return normalized.includes("bensin") || normalized.includes("bensin") || normalized.includes("pertamax") || normalized.includes("pertalite") || normalized.includes("bbm");
    }
    if (catLower.includes("makan pokok") || catLower.includes("nasi") || catLower.includes("warteg")) {
      return normalized.includes("makan") || normalized.includes("nasi") || normalized.includes("warteg") || normalized.includes("sarapan") || normalized.includes("malam");
    }
    if (catLower.includes("wifi") || catLower.includes("internet") || catLower.includes("indihome")) {
      return normalized.includes("wifi") || normalized.includes("internet") || normalized.includes("pulsa") || normalized.includes("kuota");
    }
    if (catLower.includes("belanja") || catLower.includes("online") || catLower.includes("tokopedia") || catLower.includes("shopee")) {
      return normalized.includes("belanja") || normalized.includes("online") || normalized.includes("tokped") || normalized.includes("shopee") || normalized.includes("lazada");
    }
    
    // Fallback: check if category name is found directly in input text
    return normalized.includes(catLower);
  });

  if (matchedCat) {
    category_name = matchedCat.name;
  }

  // 5. Merchant extraction (e.g. "di indomaret" -> "indomaret")
  let merchant: string | null = null;
  const merchantMatch = normalized.match(/(?:di|ke|dari)\s+([a-z0-9\s]+?)(?:\s+(?:bayar|pake|hari|tanggal|kemarin|pada|$))/i);
  if (merchantMatch) {
    merchant = merchantMatch[1].trim();
  }

  // 6. Date extraction
  let date = todayISO();
  if (normalized.includes("kemarin")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split("T")[0];
  } else if (normalized.includes("lusa")) {
    const lusa = new Date();
    lusa.setDate(lusa.getDate() + 2);
    date = lusa.toISOString().split("T")[0];
  }

  return {
    type,
    amount,
    category_name,
    payment_method,
    merchant,
    date,
    note: `Parsed from: "${input}"`,
    confidence: 0.5,
  };
}
