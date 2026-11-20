import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { query, indexId, filters, limit = 10, page = 0 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Verify API key from Authorization header
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "") || req.headers.get("x-api-key");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (apiKey && apiKey.startsWith("ss_")) {
      const { data: keyRecord } = await supabase
        .from("api_keys")
        .select("id, user_id, permissions")
        .eq("key_hash", apiKey)
        .single();
      if (!keyRecord) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
      await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);
    }

    const start = Date.now();
    const sanitised = query.trim().toLowerCase();
    const terms = sanitised.split(/\s+/).filter(Boolean);

    // Build full-text search query
    const tsQuery = terms.map((t) => `${t}:*`).join(" & ");

    let dbQuery = supabase
      .from("indexed_records")
      .select("id, title, content, url, source_type, metadata, search_index_id, ts_rank", { count: "exact" })
      .textSearch("search_vector", tsQuery, { type: "websearch", config: "english" })
      .range(page * limit, page * limit + limit - 1);

    if (indexId) dbQuery = dbQuery.eq("search_index_id", indexId);

    const { data: records, count, error } = await dbQuery;

    if (error) {
      // Fallback: ilike search when FTS not available
      let fallback = supabase
        .from("indexed_records")
        .select("id, title, content, url, source_type, metadata, search_index_id")
        .or(terms.map((t) => `title.ilike.%${t}%,content.ilike.%${t}%`).join(","))
        .range(page * limit, page * limit + limit - 1);
      if (indexId) fallback = fallback.eq("search_index_id", indexId);
      const { data: fallbackData, count: fallbackCount } = await fallback;

      const elapsed = Date.now() - start;
      return NextResponse.json({
        query,
        hits: (fallbackData || []).map(formatRecord),
        total: fallbackCount || 0,
        page,
        processingTimeMs: elapsed,
      });
    }

    const elapsed = Date.now() - start;
    return NextResponse.json({
      query,
      hits: (records || []).map(formatRecord),
      total: count || 0,
      page,
      processingTimeMs: elapsed,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const indexId = req.nextUrl.searchParams.get("index") || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "0");

  const mockReq = new Request(req.url, {
    method: "POST",
    body: JSON.stringify({ query: q, indexId, limit, page }),
    headers: { "Content-Type": "application/json", ...Object.fromEntries(req.headers) },
  });

  return POST(new NextRequest(mockReq));
}

function formatRecord(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    snippet: typeof r.content === "string" ? r.content.substring(0, 200) + (r.content.length > 200 ? "..." : "") : "",
    url: r.url,
    source_type: r.source_type,
    metadata: r.metadata,
    indexId: r.search_index_id,
  };
}
