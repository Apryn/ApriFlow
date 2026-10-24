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
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Asset } from "@/types/database.types";
import { Pencil, Trash2, Wallet, Plus } from "lucide-react";

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
        description="Catat aset valid yang Anda miliki seperti saldo bank, uang tunai, atau emas."
        action={
          <Link href="/aset/tambah">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Tambah Aset
            </Button>
          </Link>
        }
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
      <Card className="p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Aset Valid</p>
        <p className="tabular mt-1 text-2xl font-bold text-zinc-50">{mask(totalAssets)}</p>
      </Card>

      <div className="space-y-2.5">
        {assets.map((asset) => (
          <Card key={asset.id} className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-zinc-100">{asset.name}</p>
                  {asset.is_liquid && <Badge variant="info">Likuid</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 font-medium">{getAssetTypeLabel(asset.type)}</p>
                {asset.note && <p className="mt-1 text-xs text-zinc-400">{asset.note}</p>}
              </div>
              <div className="text-right">
                <p className="tabular font-bold text-sm text-zinc-100">{mask(asset.value)}</p>
                <div className="mt-1.5 flex justify-end gap-1">
                  <Link href={`/aset/${asset.id}/edit`}>
                    <Button variant="ghost" size="icon" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-500 hover:text-rose-400"
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
