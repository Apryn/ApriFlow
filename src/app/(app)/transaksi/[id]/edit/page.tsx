import { notFound, redirect } from "next/navigation";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCategories, getTransactionById } from "@/lib/db/transactions";
import { getUser } from "@/lib/supabase/server";

interface EditTransactionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [transaction, categories] = await Promise.all([
    getTransactionById(user.id, id),
    getCategories(user.id),
  ]);

  if (!transaction) notFound();

  return (
    <>
      <PageHeader title="Edit Transaksi" subtitle="Perbarui detail transaksi." />
      <Card>
        <TransactionForm
          categories={categories}
          transaction={transaction}
          redirectTo="/transaksi"
        />
      </Card>
    </>
  );
}
