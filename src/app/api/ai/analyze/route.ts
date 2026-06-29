import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { AIIntelligenceService } from "@/services/ai-engine/ai-intelligence-service";
import { getCurrentMonthRange } from "@/lib/utils/date";

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const { year: curYear, month: curMonth } = getCurrentMonthRange();
    
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const scope = searchParams.get("scope") || "all";

    const year = yearParam ? parseInt(yearParam, 10) : curYear;
    const month = monthParam ? parseInt(monthParam, 10) : curMonth;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Parameter tahun atau bulan tidak valid." },
        { status: 400 }
      );
    }

    // 3. Execute analysis
    const aiService = new AIIntelligenceService();
    const result = await aiService.runAnalysis(user.id, year, month, scope);

    // 4. Return result
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error running financial analysis route:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal saat memproses data." },
      { status: 500 }
    );
  }
}
