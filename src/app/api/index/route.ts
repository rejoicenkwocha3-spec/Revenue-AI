import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/index — Add records to a search index
export async function POST(req: NextRequest) {
  try {
    const { indexId, records } = await req.json();

    if (!indexId) return NextResponse.json({ error: "indexId is required" }, { status: 400 });
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "records must be a non-empty array" }, { status: 400 });
    }
    if (records.length > 500) {
      return NextResponse.json({ error: "Maximum 500 records per request" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "") || req.headers.get("x-api-key");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify API key has write permissions
    if (apiKey && apiKey.startsWith("ss_")) {
      const { data: keyRecord } = await supabase.from("api_keys").select("user_id, permissions").eq("key_hash", apiKey).single();
      if (!keyRecord) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      if (!["write", "admin"].includes(keyRecord.permissions)) {
        return NextResponse.json({ error: "API key does not have write permissions" }, { status: 403 });
      }
    }

    // Verify index exists
    const { data: index } = await supabase.from("search_indexes").select("id, user_id").eq("id", indexId).single();
    if (!index) return NextResponse.json({ error: "Index not found" }, { status: 404 });

    // Insert records
    const rows = records.map((r: Record<string, unknown>) => ({
      search_index_id: indexId,
      title: String(r.title || ""),
      content: String(r.content || r.body || r.description || ""),
      url: r.url ? String(r.url) : null,
      source_type: String(r.source_type || "api"),
      metadata: r.metadata || {},
    }));

    const { data: inserted, error } = await supabase.from("indexed_records").insert(rows).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update record count
    const { count } = await supabase.from("indexed_records").select("*", { count: "exact", head: true }).eq("search_index_id", indexId);
    await supabase.from("search_indexes").update({ record_count: count || 0, updated_at: new Date().toISOString() }).eq("id", indexId);

    return NextResponse.json({ indexed: inserted?.length || 0, indexId, total: count || 0 });
  } catch (err) {
    console.error("Index error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/index?indexId=xxx&recordId=yyy
export async function DELETE(req: NextRequest) {
  const indexId = req.nextUrl.searchParams.get("indexId");
  const recordId = req.nextUrl.searchParams.get("recordId");

  if (!indexId) return NextResponse.json({ error: "indexId is required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (recordId) {
    await supabase.from("indexed_records").delete().eq("id", recordId).eq("search_index_id", indexId);
    return NextResponse.json({ deleted: 1 });
  }

  // Delete all records in index
  await supabase.from("indexed_records").delete().eq("search_index_id", indexId);
  await supabase.from("search_indexes").update({ record_count: 0 }).eq("id", indexId);
  return NextResponse.json({ cleared: true, indexId });
}
