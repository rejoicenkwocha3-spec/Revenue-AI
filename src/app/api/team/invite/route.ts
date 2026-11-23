import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();
    if (!email || !role) return NextResponse.json({ error: "email and role are required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organisation_id) {
      return NextResponse.json({ error: "You must belong to an organisation to invite members." }, { status: 400 });
    }

    // Check for existing pending invite
    const { data: existing } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("organisation_id", profile.organisation_id)
      .eq("email", email)
      .eq("accepted", false)
      .single();

    if (existing) {
      return NextResponse.json({ error: "An invitation has already been sent to this email address." }, { status: 409 });
    }

    const { error: inviteErr } = await supabase.from("team_invitations").insert({
      organisation_id: profile.organisation_id,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
      role,
    });

    if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
