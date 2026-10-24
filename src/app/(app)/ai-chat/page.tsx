import { PageHeader } from "@/components/layout/page-header";
import { AITransactionInput } from "@/components/transactions/ai-transaction-input";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AIChatPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tanya AI & Catat Cepat"
        subtitle="Ketik bahasa sehari-hari, scan struk belanja, atau tanyakan simulasi keputusan finansial."
      />
      <AITransactionInput />
    </div>
  );
}
