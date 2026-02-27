import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  if (id === "all") {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
  } else {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user_ids, title, message, type, link } = await req.json();

  if (!user_ids || !title || !message) {
    return NextResponse.json({ error: "user_ids, title, and message are required" }, { status: 400 });
  }

  const notifications = user_ids.map((uid: string) => ({
    user_id: uid,
    title,
    message,
    type: type || "info",
    link: link || null,
    is_read: false,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, count: notifications.length });
}
