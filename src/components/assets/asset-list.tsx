"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteAsset } from "@/actions/asset.actions";
import { getAssetTypeLabel } from "@/lib/constants/asset-types";
import { formatRupiah } from "@/lib/utils/currency";
import type { Asset } from "@/types/database.types";
import { Pencil, Trash2, Wallet } from "lucide-react";

interface AssetListProps {
  assets: Asset[];
  totalAssets: number;
}

export function AssetList({ assets, totalAssets }: AssetListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum ada aset"
        description="Catat aset valid yang benar-benar kamu miliki, seperti saldo bank atau emas."
      />
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus aset ini?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteAsset(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card className="bg-teal-50 ring-teal-100">
        <p className="text-sm text-teal-700">Total aset valid</p>
        <p className="mt-1 text-2xl font-bold text-teal-800">{formatRupiah(totalAssets)}</p>
      </Card>

      <div className="space-y-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{asset.name}</p>
                  {asset.is_liquid && <Badge variant="info">Likuid</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{getAssetTypeLabel(asset.type)}</p>
                {asset.note && <p className="mt-1 text-xs text-gray-400">{asset.note}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatRupiah(asset.value)}</p>
                <div className="mt-2 flex justify-end gap-1">
                  <Link href={`/aset/${asset.id}/edit`}>
                    <Button variant="ghost" size="sm" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus"
                    disabled={isPending && deletingId === asset.id}
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
