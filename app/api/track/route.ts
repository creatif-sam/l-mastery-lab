import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("page_views").insert({
      path: path || "/",
      referrer: request.headers.get("referer") || null,
      user_agent: request.headers.get("user-agent") || null,
      user_id: user?.id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
