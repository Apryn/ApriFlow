import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/db/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetManagerForm } from "@/components/budgets/budget-manager-form";

export default async function BudgetsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const categories = await getCategories(user.id, "expense");

  const supabase = await createClient();
  const { data: budgets, error } = await supabase
    .from("budgets")
    .select("id, category_id, amount, period, category:categories(name)")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching budgets list:", error);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Limit Anggaran"
        subtitle="Kelola batas maksimal pengeluaran bulanan per kategori."
      />

      <BudgetManagerForm
        categories={categories}
        initialBudgets={budgets ?? []}
      />
    </div>
  );
}
