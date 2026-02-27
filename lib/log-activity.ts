/**
 * logActivity
 * ─────────────────────────────────────────────────────────────────
 * Client-side helper — fire-and-forget call to POST /api/log.
 * Import this wherever you want to record a user action.
 *
 * Usage:
 *   import { logActivity } from "@/lib/log-activity";
 *
 *   // Simple
 *   logActivity("quiz_submitted");
 *
 *   // With context
 *   logActivity("lesson_completed", {
 *     entity_type:  "lesson",
 *     entity_id:    lesson.id,
 *     entity_label: lesson.title,
 *     metadata:     { score: 95 },
 *   });
 */

type LogOptions = {
  entity_type?:  string;
  entity_id?:    string;
  entity_label?: string;
  metadata?:     Record<string, unknown>;
};

export async function logActivity(action: string, options?: LogOptions): Promise<void> {
  try {
    await fetch("/api/log", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...options }),
    });
  } catch {
    // Silently ignore — logging must never break the UX
  }
}

// ── Predefined action constants (avoid magic strings) ─────────────────────────
export const LOG_ACTIONS = {
  // Auth
  LOGIN:                   "login",
  LOGOUT:                  "logout",
  SIGN_UP:                 "sign_up",
  PASSWORD_RESET:          "password_reset",

  // Lessons
  LESSON_STARTED:          "lesson_started",
  LESSON_COMPLETED:        "lesson_completed",

  // Quiz
  QUIZ_STARTED:            "quiz_started",
  QUIZ_SUBMITTED:          "quiz_submitted",

  // Community
  POST_CREATED:            "community_post_created",
  POST_DELETED:            "community_post_deleted",
  POST_REACTED:            "community_post_reacted",

  // Blog
  BLOG_POST_CREATED:       "blog_post_created",
  BLOG_POST_PUBLISHED:     "blog_post_published",

  // Messaging
  MESSAGE_SENT:            "message_sent",

  // Profile
  PROFILE_UPDATED:         "profile_updated",
  SETTINGS_CHANGED:        "settings_changed",

  // Admin actions
  USER_ROLE_CHANGED:       "admin_user_role_changed",
  NOTIFICATION_SENT:       "admin_notification_sent",
  MAIL_CAMPAIGN_SENT:      "admin_mail_campaign_sent",
} as const;
