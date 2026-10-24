import { PageHeader } from "@/components/layout/page-header";
import { PendingTransactionList } from "@/components/transactions/pending-transaction-list";
import { getCategories } from "@/lib/db/transactions";
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TransactionWithCategory } from "@/types/database.types";

export default async function ReviewPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [pendingRes, categories] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(id, name, expense_kind)")
      .eq("user_id", user.id)
      .eq("status", "pending_review")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getCategories(user.id),
  ]);

  if (pendingRes.error) {
    throw pendingRes.error;
  }

  const pendingTransactions = (pendingRes.data ?? []) as TransactionWithCategory[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Review Draf Transaksi"
        subtitle="Verifikasi, edit, atau setujui draf transaksi dari AI chat, scan struk, atau impor bank."
      />
      <PendingTransactionList
        initialTransactions={pendingTransactions}
        categories={categories}
      />
    </div>
  );
}
