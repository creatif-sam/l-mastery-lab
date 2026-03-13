import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/network/accept-group
 * Body: { requestId: string }
 *
 * - Verifies the authenticated user is the receiver of the request
 * - Updates request status to 'accepted'
 * - Assigns both sender and receiver the same group_id (creates one if needed)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

  // Verify the authenticated user is indeed the receiver
  const { data: request } = await supabase
    .from("partner_requests")
    .select("id, sender_id, receiver_id, status")
    .eq("id", requestId)
    .single();

  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.receiver_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (request.status !== "pending")
    return NextResponse.json({ error: "Request already processed" }, { status: 409 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Determine group_id: use sender's if they have one, else create new
  const { data: senderProfile } = await admin
    .from("profiles")
    .select("group_id")
    .eq("id", request.sender_id)
    .single();

  const { data: receiverProfile } = await admin
    .from("profiles")
    .select("group_id")
    .eq("id", user.id)
    .single();

  // Use existing group_id if either party already belongs to a group (prioritise sender)
  const groupId =
    senderProfile?.group_id ??
    receiverProfile?.group_id ??
    crypto.randomUUID();

  // Update both profiles to share the same group_id
  const [senderUpdate, receiverUpdate] = await Promise.all([
    admin.from("profiles").update({ group_id: groupId }).eq("id", request.sender_id),
    admin.from("profiles").update({ group_id: groupId }).eq("id", user.id),
  ]);

  if (senderUpdate.error || receiverUpdate.error) {
    return NextResponse.json({ error: "Failed to update group membership" }, { status: 500 });
  }

  // Mark request as accepted
  await admin
    .from("partner_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  return NextResponse.json({ success: true, groupId });
}
