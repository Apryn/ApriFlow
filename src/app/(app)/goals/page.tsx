import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { GoalManagerForm } from "@/components/goals/goal-manager-form";
import type { Goal } from "@/types/database.types";

export default async function GoalsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching goals list:", error);
  }

  return (
    <>
      <PageHeader
        title="Target Keuangan (Goals)"
        subtitle="Pantau progres pencapaian tabungan dan impian Anda."
      />

      <div className="mt-4">
        <GoalManagerForm initialGoals={(goals ?? []) as Goal[]} />
      </div>
    </>
  );
}
