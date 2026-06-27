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
 * Parses natural language input using OpenAI API (GPT-4o-mini) or a rule-based fallback.
 */
export async function parseTransactionWithOpenAI(
  input: string,
  categories: { name: string; type: "income" | "expense" }[]
): Promise<ParsedTransaction> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not defined in env. Using rule-based fallback parser.");
    return parseTransactionFallback(input, categories);
  }

  const today = todayISO();
  const categoryNamesList = categories.map((c) => `${c.name} (${c.type})`).join(", ");

  const systemInstructions = `
Anda adalah asisten keuangan AI yang bertugas mengekstrak detail transaksi keuangan dari teks bahasa natural ke dalam format JSON yang valid.
Hari ini adalah tanggal: ${today}.

DAFTAR KATEGORI YANG TERSEDIA:
[${categoryNamesList}]

Format JSON output harus memiliki kunci-kunci berikut dengan ketentuan:
1. "type": jenis transaksi ("income" untuk pemasukan, "expense" untuk pengeluaran).
2. "amount": nominal uang (integer). Ketahui bahwa singkatan seperti "rb"/"ribu" = ribu, "jt"/"juta" = juta, "k" = ribu.
3. "category_name": nama kategori yang PALING cocok dari daftar kategori di atas. Jika tidak ada yang cocok, gunakan kategori "Lain-lain" sesuai jenis transaksinya.
4. "payment_method": salah satu dari: "cash", "qris", "transfer", "debit_card", "credit_card", "ewallet", "other". Default: "other".
5. "merchant": nama toko/tempat/sumber jika disebutkan (string atau null).
6. "date": tanggal transaksi (format YYYY-MM-DD). Gunakan referensi hari ini (${today}) untuk menghitung tanggal relatif seperti "hari ini", "kemarin", "lusa", "2 hari lalu", dll.
7. "note": catatan singkat deskripsi tambahan (string atau null).
8. "confidence": tingkat keyakinan Anda terhadap ekstraksi ini (angka float dari 0.0 sampai 1.0).

Anda wajib menghasilkan JSON objek yang valid tanpa ada teks markdown di sekitarnya.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstructions },
          { role: "user", content: `Teks input dari user: "${input}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.statusText} - ${errorText}`);
    }

    const resJson = await response.json();
    const textResult = resJson?.choices?.[0]?.message?.content;
    if (!textResult) {
      throw new Error("No response received from OpenAI.");
    }

    const parsed = JSON.parse(textResult) as ParsedTransaction;
    return parsed;
  } catch (error) {
    console.error("Failed to parse transaction with OpenAI, falling back:", error);
    return parseTransactionFallback(input, categories);
  }
}

/**
 * Basic regex-based rule parser fallback when OpenAI is unavailable.
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
  let category_name = "Lain-lain";
  
  const matchedCat = categories.find((c) => {
    if (c.type !== type) return false;
    const catLower = c.name.toLowerCase();
    
    if (catLower.includes("kopi") || catLower.includes("warkop") || catLower.includes("cafe")) {
      return normalized.includes("kopi") || normalized.includes("warkop") || normalized.includes("ngopi") || normalized.includes("cafe");
    }
    if (catLower.includes("bensin") || catLower.includes("pertamax") || catLower.includes("shell") || catLower.includes("pertalite")) {
      return normalized.includes("bensin") || normalized.includes("pertamax") || normalized.includes("pertalite") || normalized.includes("bbm");
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
    
    return normalized.includes(catLower);
  });

  if (matchedCat) {
    category_name = matchedCat.name;
  }

  // 5. Merchant extraction
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
