import type { PaymentMethod, TransactionType } from "@/types/database.types";

export interface ParsedTransactionRow {
  date: string; // YYYY-MM-DD
  rawTimestamp?: string | null;
  amount: number;
  type: TransactionType;
  categoryName: string;
  subcategory?: string | null;
  note: string | null;
  merchant?: string | null;
  paymentMethod: PaymentMethod;
  currency?: string;
  originalRowIndex: number;
}

export interface ParseResult {
  items: ParsedTransactionRow[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errors: { row: number; reason: string }[];
  categories: { name: string; type: TransactionType; count: number }[];
  totalIncome: number;
  totalExpense: number;
}

/**
 * Split a CSV line respecting quoted strings with commas and escaped quotes.
 */
export function splitCsvLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Detect the delimiter used in CSV (comma, semicolon, or tab).
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ";";
  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  return ",";
}

/**
 * Normalize date strings (supports "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD", "DD/MM/YYYY", etc.)
 */
export function parseDate(dateStr: string): { date: string; rawTimestamp: string | null } {
  const clean = dateStr.trim();
  if (!clean) {
    const today = new Date().toISOString().slice(0, 10);
    return { date: today, rawTimestamp: null };
  }

  // Check format: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, "0");
    const day = isoMatch[3].padStart(2, "0");
    const date = `${year}-${month}-${day}`;

    if (isoMatch[4] !== undefined) {
      const hh = isoMatch[4].padStart(2, "0");
      const mm = (isoMatch[5] || "00").padStart(2, "0");
      const ss = (isoMatch[6] || "00").padStart(2, "0");
      return { date, rawTimestamp: `${date}T${hh}:${mm}:${ss}.000Z` };
    }
    return { date, rawTimestamp: `${date}T12:00:00.000Z` };
  }

  // Check format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    const date = `${year}-${month}-${day}`;

    if (dmyMatch[4] !== undefined) {
      const hh = dmyMatch[4].padStart(2, "0");
      const mm = (dmyMatch[5] || "00").padStart(2, "0");
      const ss = (dmyMatch[6] || "00").padStart(2, "0");
      return { date, rawTimestamp: `${date}T${hh}:${mm}:${ss}.000Z` };
    }
    return { date, rawTimestamp: `${date}T12:00:00.000Z` };
  }

  // Fallback to JS Date
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return {
      date: parsed.toISOString().slice(0, 10),
      rawTimestamp: parsed.toISOString(),
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  return { date: today, rawTimestamp: null };
}

/**
 * Clean amount string into rounded integer (positive).
 * Supports standard formats: "12000.0", "12,000.00", "2700000"
 * And Indonesian formats: "Rp 12.000", "Rp 1.500.000,00"
 */
export function parseAmount(val: string): { amount: number; isNegative: boolean } {
  if (!val) return { amount: 0, isNegative: false };
  const clean = val.trim().replace(/^Rp\.?/i, "").trim();
  const isNegative = clean.startsWith("-") || (clean.includes("(") && clean.includes(")"));

  let numStr = clean.replace(/[^0-9.,]/g, "");

  if (numStr.includes(".") && numStr.includes(",")) {
    // Both exist: check which one is last
    const lastDot = numStr.lastIndexOf(".");
    const lastComma = numStr.lastIndexOf(",");
    if (lastDot > lastComma) {
      // 1,234,567.89 -> dot is decimal, comma is thousands
      numStr = numStr.replace(/,/g, "");
    } else {
      // 1.234.567,89 -> comma is decimal, dot is thousands
      numStr = numStr.replace(/\./g, "").replace(",", ".");
    }
  } else if (numStr.includes(".")) {
    // Only dot exists.
    // In ID currency, dots with exactly 3 digits (e.g. 12.000 or 1.000.000) are thousands separators!
    // But if dot has 1 or 2 digits (e.g. 12000.0 or 12.5 or 12.50), it is a decimal separator.
    const parts = numStr.split(".");
    const lastPart = parts[parts.length - 1];

    if (parts.length > 2) {
      // Multiple dots: e.g. 1.000.000 -> thousands separator
      numStr = numStr.replace(/\./g, "");
    } else if (parts.length === 2) {
      if (lastPart.length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        // e.g. "12.000" or "100.000" or "5.000" -> thousands separator!
        numStr = numStr.replace(/\./g, "");
      } else {
        // e.g. "12000.0" or "12.50" or "12000.5" -> decimal separator
        // keep dot as is
      }
    }
  } else if (numStr.includes(",")) {
    // Only comma exists.
    const parts = numStr.split(",");
    const lastPart = parts[parts.length - 1];
    if (parts.length > 2) {
      // Multiple commas: e.g. 1,000,000 -> thousands separator
      numStr = numStr.replace(/,/g, "");
    } else if (parts.length === 2) {
      if (lastPart.length === 1 || lastPart.length === 2) {
        // e.g. "12000,50" -> decimal separator
        numStr = numStr.replace(",", ".");
      } else {
        // e.g. "12,000" -> thousands separator
        numStr = numStr.replace(/,/g, "");
      }
    }
  }

  const num = Math.abs(parseFloat(numStr) || 0);
  return { amount: Math.round(num), isNegative };
}

/**
 * Map account name to PaymentMethod enum.
 */
export function mapPaymentMethod(account: string): PaymentMethod {
  const norm = account.toLowerCase().trim();
  if (!norm) return "cash";

  if (norm.includes("cash") || norm.includes("tunai") || norm.includes("dompet")) {
    return "cash";
  }
  if (norm.includes("qris")) {
    return "qris";
  }
  if (
    norm.includes("gopay") ||
    norm.includes("ovo") ||
    norm.includes("dana") ||
    norm.includes("shopeepay") ||
    norm.includes("linkaja") ||
    norm.includes("ewallet") ||
    norm.includes("e-wallet")
  ) {
    return "ewallet";
  }
  if (norm.includes("credit") || norm.includes("kredit") || norm.includes("cc")) {
    return "credit_card";
  }
  if (norm.includes("card") || norm.includes("kartu") || norm.includes("debit")) {
    return "debit_card";
  }
  if (
    norm.includes("bank") ||
    norm.includes("transfer") ||
    norm.includes("bca") ||
    norm.includes("mandiri") ||
    norm.includes("bri") ||
    norm.includes("bni") ||
    norm.includes("bsi") ||
    norm.includes("jago") ||
    norm.includes("seabank")
  ) {
    return "transfer";
  }

  return "other";
}

/**
 * Parse full CSV content.
 */
export function parseTransactionsCsv(csvText: string): ParseResult {
  const delimiter = detectDelimiter(csvText);
  const rawLines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (rawLines.length === 0) {
    return {
      items: [],
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      errors: [{ row: 0, reason: "File CSV kosong" }],
      categories: [],
      totalIncome: 0,
      totalExpense: 0,
    };
  }

  // Header parsing
  const headers = splitCsvLine(rawLines[0], delimiter).map((h) => h.trim().toLowerCase());

  // Find column indices
  let dateColIdx = -1;
  let accountColIdx = -1;
  let categoryColIdx = -1;
  let subcategoryColIdx = -1;
  let noteColIdx = -1;
  let typeColIdx = -1;
  let amountColIdx = -1;
  let tagColIdx = -1;
  let descColIdx = -1;
  let currencyColIdx = -1;
  let idrColIdx = -1;

  headers.forEach((h, idx) => {
    if (dateColIdx === -1 && /date|tanggal|waktu|time/.test(h)) {
      dateColIdx = idx;
    } else if (accountColIdx === -1 && /account|akun|rekening|metode|payment/.test(h)) {
      accountColIdx = idx;
    } else if (categoryColIdx === -1 && /category|kategori/.test(h)) {
      categoryColIdx = idx;
    } else if (subcategoryColIdx === -1 && /subcat|subkategori/.test(h)) {
      subcategoryColIdx = idx;
    } else if (noteColIdx === -1 && /note|catatan/.test(h)) {
      noteColIdx = idx;
    } else if (typeColIdx === -1 && /income\/expense|type|tipe|jenis|flow|in\/out/.test(h)) {
      typeColIdx = idx;
    } else if (amountColIdx === -1 && /amount|nominal|jumlah/.test(h)) {
      amountColIdx = idx;
    } else if (idrColIdx === -1 && /idr|rupiah/.test(h)) {
      idrColIdx = idx;
    } else if (tagColIdx === -1 && /tag|label/.test(h)) {
      tagColIdx = idx;
    } else if (descColIdx === -1 && /description|deskripsi|keterangan/.test(h)) {
      descColIdx = idx;
    } else if (currencyColIdx === -1 && /currency|mata uang/.test(h)) {
      currencyColIdx = idx;
    }
  });

  // If amount column wasn't explicitly named "Amount", try idrColIdx or amountColIdx
  if (amountColIdx === -1 && idrColIdx !== -1) {
    amountColIdx = idrColIdx;
  }

  // Fallbacks if header matching is imperfect
  if (dateColIdx === -1) dateColIdx = 0;
  if (categoryColIdx === -1) categoryColIdx = 2;
  if (noteColIdx === -1) noteColIdx = 4;
  if (amountColIdx === -1) amountColIdx = idrColIdx !== -1 ? idrColIdx : 5;

  const items: ParsedTransactionRow[] = [];
  const errors: { row: number; reason: string }[] = [];
  const categoryMap = new Map<string, { type: TransactionType; count: number }>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const cols = splitCsvLine(line, delimiter);
    const dateRaw = cols[dateColIdx] || "";
    const { date, rawTimestamp } = parseDate(dateRaw);

    const accountRaw = accountColIdx !== -1 ? cols[accountColIdx] || "Cash" : "Cash";
    const paymentMethod = mapPaymentMethod(accountRaw);

    const categoryRaw = (categoryColIdx !== -1 ? cols[categoryColIdx] : "")?.trim() || "Lain-lain";
    const subcategory = subcategoryColIdx !== -1 ? cols[subcategoryColIdx]?.trim() || null : null;
    const noteRaw = noteColIdx !== -1 ? cols[noteColIdx]?.trim() || "" : "";
    const descRaw = descColIdx !== -1 ? cols[descColIdx]?.trim() || "" : "";
    const tagRaw = tagColIdx !== -1 ? cols[tagColIdx]?.trim() || "" : "";

    // Determine Note and Merchant
    let finalNote = noteRaw;
    if (subcategory) {
      finalNote = finalNote ? `[${subcategory}] ${finalNote}` : subcategory;
    }
    if (descRaw && descRaw !== noteRaw) {
      finalNote = finalNote ? `${finalNote} - ${descRaw}` : descRaw;
    }
    if (tagRaw) {
      finalNote = finalNote ? `${finalNote} #${tagRaw}` : `#${tagRaw}`;
    }

    // Determine Amount
    const amountRawStr = (amountColIdx !== -1 ? cols[amountColIdx] : "") || (idrColIdx !== -1 ? cols[idrColIdx] : "") || "0";
    const { amount, isNegative } = parseAmount(amountRawStr);

    if (amount <= 0) {
      errors.push({ row: i + 1, reason: `Nominal tidak valid (${amountRawStr})` });
      continue;
    }

    // Determine Type (income vs expense)
    let type: TransactionType = "expense";
    if (typeColIdx !== -1) {
      const typeStr = (cols[typeColIdx] || "").toLowerCase().trim();
      if (typeStr.includes("income") || typeStr.includes("pemasukan") || typeStr.includes("kredit")) {
        type = "income";
      } else {
        type = "expense";
      }
    } else if (isNegative) {
      type = "expense";
    }

    if (type === "income") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }

    // Track category counts
    const catKey = `${categoryRaw}::${type}`;
    const existing = categoryMap.get(catKey);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(catKey, { type, count: 1 });
    }

    const currency = currencyColIdx !== -1 ? cols[currencyColIdx]?.trim() || "IDR" : "IDR";

    items.push({
      date,
      rawTimestamp,
      amount,
      type,
      categoryName: categoryRaw,
      subcategory,
      note: finalNote || categoryRaw,
      paymentMethod,
      currency,
      originalRowIndex: i + 1,
    });
  }

  const categories = Array.from(categoryMap.entries()).map(([key, val]) => {
    const [name] = key.split("::");
    return { name, type: val.type, count: val.count };
  });

  return {
    items,
    totalRows: rawLines.length - 1,
    validRows: items.length,
    skippedRows: errors.length,
    errors,
    categories,
    totalIncome,
    totalExpense,
  };
}
