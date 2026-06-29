import { createClient } from "@/lib/supabase/server";

/**
 * Logs a product analytic or audit event to the database.
 */
export async function logAnalyticsEvent(
  userId: string | null,
  eventName: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      metadata,
    });

    if (error) {
      console.error(`[Analytics Log Failure] Event "${eventName}":`, error.message);
    }
  } catch (err) {
    console.error(`[Analytics Error] Event "${eventName}":`, err);
  }
}
