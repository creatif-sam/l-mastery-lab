import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { campaignId, subject, body, recipientType, customEmails } = await req.json();

    if (!subject || !body) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    // Build recipient list
    let emailList: { email: string; name: string }[] = [];

    if (recipientType === "custom") {
      const emails = (customEmails as string || "").split(",").map((e: string) => e.trim()).filter(Boolean);
      emailList = emails.map((email: string) => ({ email, name: email.split("@")[0] }));
    } else {
      let query = supabase.from("profiles").select("id, full_name");
      if (recipientType === "students") query = query.eq("role", "student") as any;
      else if (recipientType === "tutors") query = query.eq("role", "tutor") as any;

      const { data: profiles } = await query;

      if (profiles && profiles.length > 0) {
        // Get auth emails for these user IDs
        const userIds = profiles.map((p: any) => p.id);
        // We use admin client to get emails
        let authUsers: any[] | null = null;
        try {
          const { data } = await supabase.rpc("get_user_emails", { user_ids: userIds });
          authUsers = data;
        } catch {
          authUsers = null;
        }

        emailList = profiles.map((p: any, i: number) => ({
          email: authUsers?.[i]?.email || `user${i}@placeholder.com`,
          name: p.full_name,
        }));
      }
    }

    if (emailList.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Send emails via Resend (batch send, max 50 per batch)
    const batchSize = 50;
    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      for (const recipient of batch) {
        const personalizedBody = body
          .replace(/\{\{name\}\}/g, recipient.name)
          .replace(/\{\{email\}\}/g, recipient.email);

        const { error } = await resend.emails.send({
          from: "LML Platform <learning@gen116.com>",
          to: [recipient.email],
          subject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${personalizedBody}</div>`,
        });

        if (error) {
          errors.push(`${recipient.email}: ${error.message}`);
        } else {
          sentCount++;
        }
      }
    }

    // Mark campaign as sent
    if (campaignId) {
      await supabase
        .from("email_campaigns")
        .update({ status: "sent", recipients_count: sentCount, sent_at: new Date().toISOString() })
        .eq("id", campaignId);
    }

    return NextResponse.json({
      success: true,
      count: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Mail send error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
