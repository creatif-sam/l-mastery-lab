import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Guard against unauthorized cron calls
function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("cron_secret");
  return secret === process.env.CRON_SECRET;
}

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─ Build a 14-day HTML bar chart from daily attempt data ─────
function buildBarChart(daily: { day: string; attempts: number; xp: number }[]): string {
  // Normalize bar heights (max height = 48px)
  const maxXp = Math.max(...daily.map(d => d.xp), 1);

  const bars = daily.map(d => {
    const height = Math.max(Math.round((d.xp / maxXp) * 48), 2);
    const label  = new Date(d.day).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }).replace(",", "");
    const color  = d.xp > 0 ? "#4f46e5" : "#e2e8f0";
    return `
      <td align="center" valign="bottom" style="padding:0 2px;font-size:0;vertical-align:bottom">
        <div style="width:20px;background:${color};height:${height}px;border-radius:3px 3px 0 0;min-height:2px"></div>
        <div style="width:20px;font-size:8px;color:#94a3b8;text-align:center;padding-top:3px;white-space:nowrap;overflow:hidden">${label.split(" ")[0]}</div>
      </td>`;
  }).join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:8px 0">
      <tr style="vertical-align:bottom">${bars}</tr>
    </table>`;
}

// ─ Render the weekly progress email HTML ─────────────────────
function buildEmailHtml({
  name,
  currentWeekXp,
  prevWeekXp,
  currentWeekQuizzes,
  prevWeekQuizzes,
  totalXp,
  barChart,
  platformUrl,
}: {
  name: string;
  currentWeekXp: number;
  prevWeekXp: number;
  currentWeekQuizzes: number;
  prevWeekQuizzes: number;
  totalXp: number;
  barChart: string;
  platformUrl: string;
}): string {
  const xpDiff = currentWeekXp - prevWeekXp;
  const improved = xpDiff > 0;
  const same = Math.abs(xpDiff) < 5;

  const trendLabel = same ? "Steady" : improved ? `+${xpDiff} XP` : `${xpDiff} XP`;
  const trendColor = same ? "#64748b" : improved ? "#10b981" : "#ef4444";
  const trendIcon  = same ? "→" : improved ? "↑" : "↓";
  const trendBg    = same ? "#f8fafc" : improved ? "#f0fdf4" : "#fef2f2";
  const trendBorder = same ? "#e2e8f0" : improved ? "#bbf7d0" : "#fecaca";

  const motivation = same
    ? "Keep up the consistency — you're building a great learning habit!"
    : improved
    ? `Amazing progress this week! You earned ${xpDiff} more XP than last week. Keep that momentum going!`
    : `You earned ${Math.abs(xpDiff)} fewer XP than last week. A little practice each day goes a long way!`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Weekly Learning Progress — LML</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px;border-radius:16px 16px 0 0;text-align:center">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
              <span style="font-size:24px">📊</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff">Your Weekly Progress</h1>
            <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.75)">Language Mastery Lab — Weekly Digest</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none">

            <!-- Greeting -->
            <p style="margin:0 0 20px;font-size:16px;color:#1e293b">Hi <strong>${name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6">
              ${motivation}
            </p>

            <!-- Trend badge -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:${trendBg};border:1px solid ${trendBorder};border-radius:12px;padding:16px 20px">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="font-size:28px;font-weight:900;color:${trendColor}">${trendIcon} ${trendLabel}</span>
                        <p style="margin:2px 0 0;font-size:12px;color:#94a3b8">vs last week</p>
                      </td>
                      <td align="right" style="vertical-align:middle">
                        <span style="font-size:13px;color:#64748b">Total XP: <strong style="color:#4f46e5">${totalXp.toLocaleString()}</strong></span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Stats row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:separate;border-spacing:8px 0">
              <tr>
                ${[
                  { label: "XP this week", value: currentWeekXp.toString(), icon: "⚡" },
                  { label: "XP last week", value: prevWeekXp.toString(), icon: "📅" },
                  { label: "Quizzes done", value: currentWeekQuizzes.toString(), icon: "📝" },
                ].map(stat => `
                <td width="33%" style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;border:1px solid #e2e8f0">
                  <div style="font-size:20px;margin-bottom:4px">${stat.icon}</div>
                  <div style="font-size:20px;font-weight:900;color:#1e293b">${stat.value}</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:2px">${stat.label}</div>
                </td>`).join("")}
              </tr>
            </table>

            <!-- 14-day chart -->
            <div style="margin-bottom:24px">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#475569">📈 Last 14 Days Activity</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
                ${barChart}
                <p style="margin:4px 0 0;font-size:10px;color:#cbd5e1;text-align:right">XP earned per day</p>
              </div>
            </div>

            ${prevWeekQuizzes === 0 && currentWeekQuizzes === 0 ? `
            <!-- Nudge if no quizzes -->
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px">
              <p style="margin:0;font-size:13px;color:#92400e">
                💡 <strong>Tip:</strong> Complete a quiz each day to build your streak and earn XP points. Even 5 minutes counts!
              </p>
            </div>` : ""}

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:20px">
              <a href="${platformUrl}/protected/student-board"
                 style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none">
                Continue Learning →
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0">
            <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center">
              Language Mastery Lab · You're receiving this because you're enrolled as a student.<br>
              <a href="${platformUrl}/protected/student-board/settings" style="color:#a5b4fc;text-decoration:none">Manage email preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─ Main handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend      = new Resend(process.env.RESEND_API_KEY);
  const adminClient = getAdminClient();
  const platformUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lml.gen116.com";

  // Compute week boundaries
  const now          = new Date();
  const thisMonday   = new Date(now);
  thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // last Monday
  thisMonday.setHours(0, 0, 0, 0);
  const prevMonday   = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);

  const weekStart = thisMonday.toISOString().slice(0, 10);      // yyyy-mm-dd

  // Fetch all students
  const { data: students, error: studentsErr } = await adminClient
    .from("profiles")
    .select("id, full_name, xp")
    .eq("role", "student");

  if (studentsErr || !students?.length) {
    return NextResponse.json({ error: "No students found" }, { status: 500 });
  }

  // Fetch auth emails for all students
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map((authUsers ?? []).map((u: any) => [u.id, u.email as string]));

  // Check which students already got email this week
  const { data: sentThisWeek } = await adminClient
    .from("weekly_progress_emails")
    .select("user_id")
    .eq("week_start", weekStart);

  const alreadySentIds = new Set((sentThisWeek ?? []).map((r: any) => r.user_id));

  let sent = 0;
  const errors: string[] = [];

  for (const student of students) {
    if (alreadySentIds.has(student.id)) continue;

    const email = emailMap.get(student.id);
    if (!email) continue;

    // Fetch quiz attempts for this week and last week
    const [{ data: thisWeekAttempts }, { data: prevWeekAttempts }, { data: last14Days }] =
      await Promise.all([
        adminClient
          .from("quiz_attempts")
          .select("score")
          .eq("user_id", student.id)
          .gte("completed_at", thisMonday.toISOString()),
        adminClient
          .from("quiz_attempts")
          .select("score")
          .eq("user_id", student.id)
          .gte("completed_at", prevMonday.toISOString())
          .lt("completed_at", thisMonday.toISOString()),
        adminClient
          .from("quiz_attempts")
          .select("score, completed_at")
          .eq("user_id", student.id)
          .gte("completed_at", new Date(Date.now() - 14 * 86400000).toISOString())
          .order("completed_at", { ascending: true }),
      ]);

    const currentWeekXp     = (thisWeekAttempts ?? []).reduce((s: number, a: any) => s + (a.score ?? 0), 0);
    const prevWeekXp        = (prevWeekAttempts  ?? []).reduce((s: number, a: any) => s + (a.score ?? 0), 0);
    const currentWeekQuizzes = (thisWeekAttempts ?? []).length;
    const prevWeekQuizzes    = (prevWeekAttempts  ?? []).length;

    // Build daily XP map for last 14 days
    const dailyMap: Record<string, { attempts: number; xp: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyMap[d.toISOString().slice(0, 10)] = { attempts: 0, xp: 0 };
    }
    for (const attempt of (last14Days ?? [])) {
      const day = (attempt as any).completed_at?.slice(0, 10);
      if (day && dailyMap[day]) {
        dailyMap[day].attempts++;
        dailyMap[day].xp += (attempt as any).score ?? 0;
      }
    }
    const dailyArray = Object.entries(dailyMap).map(([day, d]) => ({ day, ...d }));
    const barChart   = buildBarChart(dailyArray);

    const html = buildEmailHtml({
      name: student.full_name ?? "Learner",
      currentWeekXp,
      prevWeekXp,
      currentWeekQuizzes,
      prevWeekQuizzes,
      totalXp: student.xp ?? 0,
      barChart,
      platformUrl,
    });

    const subject = currentWeekXp > prevWeekXp
      ? `🚀 You're improving! +${currentWeekXp - prevWeekXp} XP this week — LML`
      : currentWeekXp === prevWeekXp && currentWeekXp > 0
      ? "📊 Your weekly learning summary — LML"
      : "📊 Your weekly progress update — LML";

    const { error: sendErr } = await resend.emails.send({
      from: "LML Platform <learning@gen116.com>",
      to: [email],
      subject,
      html,
    });

    if (sendErr) {
      errors.push(`${student.id}: ${sendErr.message}`);
    } else {
      // Record send so we don't double-send
      await adminClient.from("weekly_progress_emails").insert({
        user_id: student.id,
        week_start: weekStart,
      });
      sent++;
    }

    // Throttle slightly to avoid rate limits
    await new Promise(r => setTimeout(r, 80));
  }

  return NextResponse.json({
    success: true,
    sent,
    skipped: alreadySentIds.size,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// GET for manual trigger / health check (still requires secret)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "Weekly progress email cron is ready", timestamp: new Date().toISOString() });
}
