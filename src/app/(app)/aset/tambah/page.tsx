import { AssetForm } from "@/components/assets/asset-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function TambahAsetPage() {
  return (
    <>
      <PageHeader title="Tambah Aset" subtitle="Catat aset valid yang kamu miliki." />
      <Card>
        <AssetForm />
      </Card>
    </>
  );
}
