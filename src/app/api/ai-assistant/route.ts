import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message || typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Fetch user's organisations
    const { data: orgs } = await supabase
      .from("cb_organisations")
      .select("id, name, industry, country, reporting_year")
      .eq("owner_id", user.id);

    // Fetch emission totals by scope
    let emissionContext = "No emission data recorded yet.";
    if (orgs && orgs.length > 0) {
      const orgIds = orgs.map((o) => o.id);
      const { data: emissions } = await supabase
        .from("cb_emissions")
        .select("scope, amount_tco2e, category, description, activity_date")
        .in("organisation_id", orgIds)
        .order("activity_date", { ascending: false })
        .limit(100);

      if (emissions && emissions.length > 0) {
        const totals = { scope1: 0, scope2: 0, scope3: 0 };
        const categories: Record<string, number> = {};
        emissions.forEach((e) => {
          if (e.scope === "scope1") totals.scope1 += e.amount_tco2e || 0;
          else if (e.scope === "scope2") totals.scope2 += e.amount_tco2e || 0;
          else if (e.scope === "scope3") totals.scope3 += e.amount_tco2e || 0;
          categories[e.category] = (categories[e.category] || 0) + (e.amount_tco2e || 0);
        });
        const grand = totals.scope1 + totals.scope2 + totals.scope3;
        const topCategories = Object.entries(categories)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([k, v]) => `${k}: ${v.toFixed(3)} tCO₂e`)
          .join("; ");
        emissionContext = `Total: ${grand.toFixed(3)} tCO₂e (Scope 1: ${totals.scope1.toFixed(3)}, Scope 2: ${totals.scope2.toFixed(3)}, Scope 3: ${totals.scope3.toFixed(3)}). Top categories: ${topCategories || "none"}.`;
      }
    }

    // Fetch active climate targets
    let targetContext = "No climate targets set.";
    if (orgs && orgs.length > 0) {
      const { data: targets } = await supabase
        .from("cb_climate_targets")
        .select("name, target_type, baseline_year, target_year, reduction_pct")
        .in("organisation_id", orgs.map((o) => o.id))
        .limit(5);
      if (targets && targets.length > 0) {
        targetContext = targets
          .map((t) => `${t.name} (${t.target_type}, ${t.reduction_pct}% reduction by ${t.target_year} from ${t.baseline_year} baseline)`)
          .join("; ");
      }
    }

    const orgContext = orgs && orgs.length > 0
      ? orgs.map((o) => `${o.name} (${o.industry}, ${o.country}, reporting year ${o.reporting_year})`).join("; ")
      : "No organisations set up yet.";

    const systemPrompt = `You are the ClimateBooks AI Climate Assistant — a specialist in corporate greenhouse gas accounting, decarbonisation strategy, and sustainability reporting.

You are speaking with an authenticated ClimateBooks user. You have access to their actual account data:

ORGANISATIONS: ${orgContext}

EMISSION DATA: ${emissionContext}

CLIMATE TARGETS: ${targetContext}

RULES YOU MUST FOLLOW:
- Base all answers on the user's actual data shown above, combined with recognised climate accounting methodology.
- Never invent emission factors. Use only recognised sources: DESNZ UK, EPA US, IEA, GHG Protocol, IPCC AR6.
- Never claim that a business has achieved net zero or carbon neutrality simply because it has set a target.
- Clearly distinguish between verified activity data, estimates and assumptions.
- Do not grant or confirm paid access, subscription status or tier — that is handled separately.
- If you do not have enough data to give a precise answer, say so clearly and explain what data is needed.
- Use recognised methodologies: GHG Protocol Corporate Standard for Scope 1/2/3, CDP questionnaire framework, CSRD/ESRS, ISSB IFRS S2, SBTi for target setting, ISO 14064.
- Write in professional, plain English. No emojis. Use tCO₂e consistently.
- If asked about emission factors, give the value and cite the source and year.

You are grounded in the user's real data above. Be specific and helpful.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply });

  } catch (err: unknown) {
    console.error("AI assistant error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
