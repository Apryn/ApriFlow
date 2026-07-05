"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createAsset, updateAsset, type ActionState } from "@/actions/asset.actions";
import { ASSET_TYPES } from "@/lib/constants/asset-types";
import { formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import type { Asset } from "@/types/database.types";

interface AssetFormProps {
  asset?: Asset;
}

const initialState: ActionState = {};

export function AssetForm({ asset }: AssetFormProps) {
  const router = useRouter();
  const isEdit = !!asset;

  const boundAction = isEdit ? updateAsset.bind(null, asset.id) : createAsset;
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [valueDisplay, setValueDisplay] = useState(
    asset ? formatRupiahInput(asset.value) : ""
  );

  useEffect(() => {
    if (state.success) {
      router.push("/aset");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl bg-zinc-950 px-4 py-3 text-sm text-red-400 border-2 border-red-500/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">{state.error}</div>
      )}

      <div>
        <Label htmlFor="name">Nama aset</Label>
        <Input
          id="name"
          name="name"
          placeholder="Contoh: Bank Jago, Tabungan Emas"
          defaultValue={asset?.name ?? ""}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Jenis aset</Label>
        <Select id="type" name="type" defaultValue={asset?.type ?? "bank"}>
          {ASSET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="value">Nilai saat ini</Label>
        <Input
          id="value"
          inputMode="numeric"
          placeholder="Rp 0"
          value={valueDisplay}
          onChange={(e) => setValueDisplay(formatRupiahInput(parseRupiahInput(e.target.value)))}
          required
        />
        <input type="hidden" name="value" value={parseRupiahInput(valueDisplay)} />
      </div>

      <div>
        <Label htmlFor="is_liquid">Aset likuid?</Label>
        <Select
          id="is_liquid"
          name="is_liquid"
          defaultValue={asset?.is_liquid ? "true" : "false"}
        >
          <option value="true">Ya — bisa dicairkan cepat</option>
          <option value="false">Tidak</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Contoh: rekening utama harian"
          defaultValue={asset?.note ?? ""}
        />
      </div>

      <Button type="submit" size="lg" className="w-full shadow-[3px_3px_0px_0px_#000]" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Menyimpan...
          </>
        ) : isEdit ? (
          "Simpan Perubahan"
        ) : (
          "Tambah Aset"
        )}
      </Button>
    </form>
  );
}
