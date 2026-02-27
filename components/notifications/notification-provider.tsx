"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Global notification listener using Supabase Realtime.
 * Renders toast notifications for the current user whenever a new
 * notification is inserted into the `notifications` table.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new as any;
            const toastFn =
              n.type === "success" ? toast.success :
              n.type === "warning" ? toast.warning :
              n.type === "error" ? toast.error :
              toast;

            toastFn(n.title, {
              description: n.message,
              action: n.link ? { label: "View", onClick: () => window.location.href = n.link } : undefined,
              duration: 5000,
            });
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return <>{children}</>;
}
