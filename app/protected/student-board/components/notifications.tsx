"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Check, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function NotificationCenter() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'partner_requests' 
      }, () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('partner_requests')
      .select('*, sender:profiles!sender_id(full_name, avatar_url)')
      .eq('receiver_id', user?.id)
      .eq('status', 'pending');
    
    if (data) setRequests(data);
  }

  async function handleResponse(requestId: string, status: 'accepted' | 'declined') {
    await supabase
      .from('partner_requests')
      .update({ status })
      .eq('id', requestId);
    
    // Note: In a full implementation, 'accepted' would trigger a Database Function 
    // to link the two users into a group.
    setRequests(prev => prev.filter(r => r.id !== requestId));
    router.refresh();
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg relative transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {requests.length > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invitations</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 font-medium italic">No pending requests</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-50 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
                      {req.sender.full_name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {req.sender.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400">wants to partner up</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => handleResponse(req.id, 'accepted')}
                      className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleResponse(req.id, 'declined')}
                      className="px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}