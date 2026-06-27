import Link from "next/link";
import { AssetList } from "@/components/assets/asset-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getAssets, getTotalAssets } from "@/lib/db/assets";
import { getUser } from "@/lib/supabase/server";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AsetPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [assets, totalAssets] = await Promise.all([
    getAssets(user.id),
    getTotalAssets(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Aset Valid"
        subtitle="Hanya aset yang benar-benar kamu miliki."
        action={
          <Link href="/aset/tambah">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" />
              Tambah
            </Button>
          </Link>
        }
      />
      <AssetList assets={assets} totalAssets={totalAssets} />
    </>
  );
}
