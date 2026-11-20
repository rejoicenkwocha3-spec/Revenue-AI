import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  status: "ok" | "error";
  error?: string;
}

async function fetchPage(url: string): Promise<CrawlResult> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SearchSprout Indexer/1.0 (+https://searchsprout.ai/bot)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { url, title: "", content: "", status: "error", error: `HTTP ${res.status}` };

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : url;

    // Strip HTML to get text content
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    // Keep first 5000 chars
    if (text.length > 5000) text = text.substring(0, 5000);

    return { url, title, content: text, status: "ok" };
  } catch (err: unknown) {
    return { url, title: "", content: "", status: "error", error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchSitemap(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const xml = await res.text();
    const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
    return [...matches].map((m) => m[1].trim()).filter((u) => u.startsWith("http")).slice(0, 200);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sourceId, url, type, indexId } = await req.json();

    if (!url || !sourceId) return NextResponse.json({ error: "url and sourceId are required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Mark source as indexing
    await supabase.from("data_sources").update({ status: "indexing" }).eq("id", sourceId);

    let urls: string[] = [];

    if (type === "sitemap") {
      urls = await fetchSitemap(url);
    } else {
      urls = [url];
    }

    if (urls.length === 0) {
      await supabase.from("data_sources").update({ status: "error" }).eq("id", sourceId);
      return NextResponse.json({ error: "No URLs found to crawl" }, { status: 400 });
    }

    // Crawl each URL (up to 50 for safety)
    const results: CrawlResult[] = [];
    for (const pageUrl of urls.slice(0, 50)) {
      const result = await fetchPage(pageUrl);
      results.push(result);
      // Small delay to be polite
      await new Promise((r) => setTimeout(r, 300));
    }

    const successful = results.filter((r) => r.status === "ok");

    // Index into search_indexes if indexId provided
    if (indexId && successful.length > 0) {
      const rows = successful.map((r) => ({
        search_index_id: indexId,
        title: r.title,
        content: r.content,
        url: r.url,
        source_type: type || "url",
        metadata: { crawled_at: new Date().toISOString() },
      }));

      await supabase.from("indexed_records").insert(rows);

      const { count } = await supabase.from("indexed_records").select("*", { count: "exact", head: true }).eq("search_index_id", indexId);
      await supabase.from("search_indexes").update({ record_count: count || 0 }).eq("id", indexId);
    }

    // Update data source
    await supabase.from("data_sources").update({
      status: "indexed",
      record_count: successful.length,
      updated_at: new Date().toISOString(),
    }).eq("id", sourceId);

    return NextResponse.json({
      crawled: urls.length,
      indexed: successful.length,
      errors: results.filter((r) => r.status === "error").length,
      sourceId,
    });
  } catch (err) {
    console.error("Crawl error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
