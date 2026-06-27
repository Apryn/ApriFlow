import { TransactionForm } from "@/components/transactions/transaction-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCategories } from "@/lib/db/transactions";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TambahPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const categories = await getCategories(user.id);

  return (
    <>
      <PageHeader
        title="Tambah Cepat"
        subtitle="Catat transaksi manual — langsung tersimpan."
      />
      <Card>
        <TransactionForm categories={categories} redirectTo="/transaksi" />
      </Card>
    </>
  );
}
