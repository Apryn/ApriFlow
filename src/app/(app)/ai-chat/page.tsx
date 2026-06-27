import { PageHeader } from "@/components/layout/page-header";
import { AITransactionInput } from "@/components/transactions/ai-transaction-input";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AIChatPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        title="AI Chat Pencatatan"
        subtitle="Tulis pengeluaran atau pemasukan secara natural menggunakan bahasa sehari-hari."
      />
      <AITransactionInput />
    </>
  );
}
