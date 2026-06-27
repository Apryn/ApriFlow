import type { PaymentMethod } from "@/types/database.types";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "qris", label: "QRIS" },
  { value: "transfer", label: "Transfer" },
  { value: "debit_card", label: "Kartu Debit" },
  { value: "credit_card", label: "Kartu Kredit" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "other", label: "Lainnya" },
];

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}
