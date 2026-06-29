import { createClient } from "@/lib/supabase/server";
import type { Asset } from "@/types/database.types";
import type { IAssetRepository } from "../interfaces/repositories.interface";

export class AssetRepository implements IAssetRepository {
  async getByUserId(userId: string): Promise<Asset[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId)
      .order("value", { ascending: false });

    if (error) {
      console.error("Error fetching assets in repository:", error);
      throw error;
    }

    return (data ?? []) as Asset[];
  }
}
