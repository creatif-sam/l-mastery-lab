import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// GET – public read of all site config keys
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_config").select("config_key, config_value");
  if (error) return NextResponse.json({}, { status: 500 });

  const config: Record<string, string | null> = {};
  (data ?? []).forEach((row: any) => { config[row.config_key] = row.config_value; });
  return NextResponse.json(config);
}

// PATCH – admin-only update of a config key
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, value } = await req.json();
  if (!key || typeof key !== "string")
    return NextResponse.json({ error: "Missing key" }, { status: 400 });

  // Use service role to bypass RLS (admin already verified above)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin
    .from("site_config")
    .upsert({ config_key: key, config_value: value ?? null, updated_at: new Date().toISOString() }, { onConflict: "config_key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
