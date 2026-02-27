import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/log
 * Body: {
 *   action:        string   (required)  – e.g. "lesson_completed"
 *   entity_type?:  string               – e.g. "lesson"
 *   entity_id?:    string               – id of the related record
 *   entity_label?: string               – human readable, e.g. lesson title
 *   metadata?:     object               – any extra context
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entity_type, entity_id, entity_label, metadata } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: "action is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    // Fetch name + role snapshot
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;

    await supabase.from("platform_logs").insert({
      user_id:      user.id,
      user_name:    profile?.full_name ?? user.email ?? "Unknown",
      user_role:    profile?.role ?? "unknown",
      action,
      entity_type:  entity_type  ?? null,
      entity_id:    entity_id    ?? null,
      entity_label: entity_label ?? null,
      metadata:     metadata     ?? {},
      ip_address:   ip,
      user_agent:   request.headers.get("user-agent") ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/log]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
