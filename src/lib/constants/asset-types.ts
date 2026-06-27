import type { AssetType } from "@/types/database.types";

export const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Tunai" },
  { value: "gold", label: "Emas" },
  { value: "investment", label: "Investasi" },
  { value: "other", label: "Lainnya" },
];

export function getAssetTypeLabel(type: AssetType): string {
  return ASSET_TYPES.find((t) => t.value === type)?.label ?? type;
}
