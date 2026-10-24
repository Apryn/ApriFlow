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
    <div className="space-y-4">
      <PageHeader
        title="Catat Transaksi"
        subtitle="Catat pengeluaran atau pemasukan secara manual."
        backHref="/transaksi"
        backLabel="Daftar Transaksi"
      />
      <Card>
        <TransactionForm categories={categories} redirectTo="/transaksi" />
      </Card>
    </div>
  );
}
