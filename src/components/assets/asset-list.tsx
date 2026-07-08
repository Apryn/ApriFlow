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
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Asset } from "@/types/database.types";
import { Pencil, Trash2, Wallet } from "lucide-react";

interface AssetListProps {
  assets: Asset[];
  totalAssets: number;
}

export function AssetList({ assets, totalAssets }: AssetListProps) {
  const router = useRouter();
  const { mask } = useVisibility();
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
      <Card className="bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_0px_#a855f7]">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total aset valid</p>
        <p className="mt-1 text-2xl font-black text-purple-400">{mask(totalAssets)}</p>
      </Card>

      <div className="space-y-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="p-4 border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-zinc-100">{asset.name}</p>
                  {asset.is_liquid && <Badge variant="info">Likuid</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 font-bold uppercase tracking-wider">{getAssetTypeLabel(asset.type)}</p>
                {asset.note && <p className="mt-1 text-xs text-zinc-500">{asset.note}</p>}
              </div>
              <div className="text-right">
                <p className="font-extrabold text-zinc-100">{mask(asset.value)}</p>
                <div className="mt-2 flex justify-end gap-1">
                  <Link href={`/aset/${asset.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-transparent hover:border-zinc-700 text-zinc-500 hover:text-zinc-300" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 border border-transparent hover:border-red-500/30 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Hapus"
                    disabled={isPending && deletingId === asset.id}
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
