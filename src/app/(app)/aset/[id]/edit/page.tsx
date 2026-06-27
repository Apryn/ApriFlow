import { notFound, redirect } from "next/navigation";
import { AssetForm } from "@/components/assets/asset-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getAssetById } from "@/lib/db/assets";
import { getUser } from "@/lib/supabase/server";

interface EditAssetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const asset = await getAssetById(user.id, id);

  if (!asset) notFound();

  return (
    <>
      <PageHeader title="Edit Aset" subtitle="Perbarui detail aset." />
      <Card>
        <AssetForm asset={asset} />
      </Card>
    </>
  );
}
