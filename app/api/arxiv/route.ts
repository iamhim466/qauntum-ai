import { NextResponse } from "next/server";
import { searchArxiv } from "@/lib/arxiv";

// ── GET Handler ────────────────────────────────────────────────────
// GET /api/arxiv?q=quantum+entanglement&max=5
// Used by the frontend search component for manual paper searches.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const maxResults = parseInt(searchParams.get("max") ?? "5", 10);
    const start = parseInt(searchParams.get("start") ?? "0", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required." },
        { status: 400 }
      );
    }

    const clampedMax = Math.min(Math.max(maxResults, 1), 20);
    const result = await searchArxiv(query.trim(), clampedMax, start);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "arXiv search failed";
    console.error("[/api/arxiv] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
