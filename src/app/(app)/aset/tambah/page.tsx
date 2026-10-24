import { AssetForm } from "@/components/assets/asset-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function TambahAsetPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Tambah Aset"
        subtitle="Catat rekening bank, uang tunai, atau simpanan Anda."
        backHref="/aset"
        backLabel="Daftar Aset"
      />
      <Card>
        <AssetForm />
      </Card>
    </div>
  );
}
