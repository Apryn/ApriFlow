import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid("Pilih kategori"),
  amount: z.number().int().positive("Nominal harus lebih dari 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  payment_method: z.enum([
    "cash",
    "qris",
    "transfer",
    "debit_card",
    "credit_card",
    "ewallet",
    "other",
  ]),
  merchant: z.string().max(200).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const assetSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi").max(100),
  type: z.enum(["bank", "cash", "gold", "investment", "other"]),
  value: z.number().int().min(0, "Nilai tidak boleh negatif"),
  is_liquid: z.boolean(),
  note: z.string().max(500).optional().nullable(),
});

export type AssetFormData = z.infer<typeof assetSchema>;
