"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Loader2, RotateCcw, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PartnerButtonProps {
  receiverId: string;
  initialPendingId?: string | null;
  isGroupFull: boolean; // New prop to prevent over-recruiting
}

export function PartnerButton({ receiverId, initialPendingId, isGroupFull }: PartnerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(initialPendingId || null);
  const supabase = createClient();
  const router = useRouter();

  async function handleAction() {
    // Prevent action if group is full and we are trying to add more
    if (isGroupFull && !pendingId) {
      toast.error("Formation is at maximum capacity (4/4)");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (pendingId) {
      // WITHDRAW LOGIC
      await supabase.from("partner_requests").delete().eq("id", pendingId);
      setPendingId(null);
      toast.info("Request withdrawn");
    } else {
      // PARTNER UP LOGIC
      const { data, error } = await supabase
        .from("partner_requests")
        .insert({ sender_id: user.id, receiver_id: receiverId, status: "pending" })
        .select()
        .single();
      
      if (error) {
        toast.error("Could not send request.");
      } else if (data) {
        setPendingId(data.id);
        toast.success("Invitation dispatched");
      }
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleAction}
      disabled={loading || (isGroupFull && !pendingId)}
      className={cn(
        "w-full py-2.5 border-2 transition-all rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
        pendingId 
          ? "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white" 
          : isGroupFull 
            ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed dark:border-white/5 dark:bg-white/5"
            : "border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isGroupFull && !pendingId ? (
        <>
          <Ban className="w-3.5 h-3.5" />
          Formation Full
        </>
      ) : pendingId ? (
        <>
          <RotateCcw className="w-3.5 h-3.5" />
          Withdraw Request
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          Partner Up
        </>
      )}
    </button>
  );
}