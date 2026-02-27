"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageSquare, Search, ArrowLeft, Loader2, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; full_name: string; role: string; avatar_url?: string };
  receiver?: { id: string; full_name: string; role: string; avatar_url?: string };
};

type Conversation = {
  partner: { id: string; full_name: string; role: string; avatar_url?: string };
  lastMessage: Message;
  unreadCount: number;
};

type AdminUser = { id: string; full_name: string; role: string; avatar_url?: string };

function Avatar({ user, size = "md" }: { user: { full_name?: string; avatar_url?: string; role?: string }; size?: "sm" | "md" | "lg" }) {
  const initials = user.full_name ? user.full_name[0].toUpperCase() : "?";
  const sizeClasses = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const bg = user.role === "admin" ? "bg-gradient-to-br from-indigo-500 to-purple-600" :
             user.role === "tutor" ? "bg-gradient-to-br from-emerald-500 to-teal-600" :
             "bg-gradient-to-br from-violet-500 to-purple-600";

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name ?? "user"}
        className={cn("rounded-full object-cover flex-shrink-0", sizeClasses[size])}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-black flex-shrink-0 shadow", bg, sizeClasses[size])}>
      {initials}
    </div>
  );
}

export function MessagingClient({
  currentUser,
  isAdmin = false,
}: {
  currentUser: { id: string; full_name: string; role: string; avatar_url?: string };
  isAdmin?: boolean;
}) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<AdminUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Load admins for non-admin users to start a conversation with
  useEffect(() => {
    if (!isAdmin) {
      supabase.from("profiles").select("id, full_name, role, avatar_url").eq("role", "admin").then(({ data }) => {
        setAdmins(data ?? []);
        // Auto-select first admin if exists
        if (data && data.length > 0 && !selectedPartner) {
          setSelectedPartner(data[0]);
        }
      });
    }
  }, [isAdmin]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    if (isAdmin) {
      // Admin: load all conversations grouped by partner
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, is_read, created_at, sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, full_name, role, avatar_url)")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false });

      if (msgs) {
        const convMap = new Map<string, Conversation>();
        msgs.forEach((msg: any) => {
          const partner = msg.sender_id === currentUser.id ? msg.receiver : msg.sender;
          if (!partner || partner.id === currentUser.id) return;
          if (!convMap.has(partner.id)) {
            convMap.set(partner.id, {
              partner,
              lastMessage: msg,
              unreadCount: 0,
            });
          }
          if (!msg.is_read && msg.receiver_id === currentUser.id) {
            const c = convMap.get(partner.id)!;
            convMap.set(partner.id, { ...c, unreadCount: c.unreadCount + 1 });
          }
        });
        setConversations(Array.from(convMap.values()));
      }
    } else {
      // Non-admin: load conversations with admins
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, is_read, created_at, sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, full_name, role, avatar_url)")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false });

      if (msgs) {
        const convMap = new Map<string, Conversation>();
        msgs.forEach((msg: any) => {
          const partner = msg.sender_id === currentUser.id ? msg.receiver : msg.sender;
          if (!partner || partner.id === currentUser.id) return;
          if (!convMap.has(partner.id)) {
            convMap.set(partner.id, {
              partner,
              lastMessage: msg,
              unreadCount: 0,
            });
          }
          if (!msg.is_read && msg.receiver_id === currentUser.id) {
            const c = convMap.get(partner.id)!;
            convMap.set(partner.id, { ...c, unreadCount: c.unreadCount + 1 });
          }
        });
        setConversations(Array.from(convMap.values()));
      }
    }
    setLoading(false);
  }, [currentUser.id, isAdmin, supabase]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedPartner) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, is_read, created_at")
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedPartner.id}),and(sender_id.eq.${selectedPartner.id},receiver_id.eq.${currentUser.id})`)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);

      // Mark as read
      await supabase.from("messages")
        .update({ is_read: true })
        .eq("receiver_id", currentUser.id)
        .eq("sender_id", selectedPartner.id)
        .eq("is_read", false);
    };
    fetchMessages();
  }, [selectedPartner, currentUser.id, supabase]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("messaging-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const msg = payload.new as Message;
        const isRelevant =
          (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id);
        if (!isRelevant) return;

        if (selectedPartner && (
          (msg.sender_id === selectedPartner.id && msg.receiver_id === currentUser.id) ||
          (msg.sender_id === currentUser.id && msg.receiver_id === selectedPartner.id)
        )) {
          setMessages((prev) => [...prev, msg]);
          if (msg.receiver_id === currentUser.id) {
            await supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
          }
        } else {
          loadConversations();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedPartner, currentUser.id, supabase, loadConversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedPartner.id,
      content: newMessage.trim(),
      is_read: false,
    });
    if (error) { toast.error("Failed to send message"); setSending(false); return; }
    setNewMessage("");
    setSending(false);
    loadConversations();
  };

  const filteredConversations = conversations.filter((c) =>
    c.partner.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) =>
    role === "admin" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" :
    role === "tutor" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300";

  return (
    <div className="flex h-full bg-[#F9FAFB] dark:bg-[#0B0F1A] overflow-hidden">
      {/* Sidebar – Conversations */}
      <aside className={cn(
        "w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col flex-shrink-0",
        selectedPartner ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-slate-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 dark:text-white text-lg">Messages</h2>
            <button
              onClick={() => { setShowNewChat(true); }}
              className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
            >
              + New
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Non-admin: show admins to start chats */}
        {!isAdmin && admins.length > 0 && conversations.length === 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Start a Conversation</p>
            {admins.map((admin) => (
              <button key={admin.id} onClick={() => setSelectedPartner(admin)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <Avatar user={admin} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{admin.full_name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${roleBadge(admin.role)}`}>{admin.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">No conversations yet</p>
            <p className="text-xs text-slate-400">
              {isAdmin ? "Users will appear here when they message you." : "Send a message to the platform admin using '+ New'."}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.partner.id}
                onClick={() => setSelectedPartner(conv.partner)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left",
                  selectedPartner?.id === conv.partner.id && "bg-violet-50 dark:bg-violet-500/10 border-l-4 border-l-violet-600"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar user={conv.partner} size="md" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{conv.partner.full_name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ml-1 ${roleBadge(conv.partner.role)}`}>{conv.partner.role}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{conv.lastMessage.content}</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">
                    {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* New Chat Modal – admin sees all users, others see only admins */}
        {showNewChat && (
          <NewChatModal
            currentUserId={currentUser.id}
            filterRole={isAdmin ? undefined : "admin"}
            onSelect={(partner) => { setSelectedPartner(partner); setShowNewChat(false); }}
            onClose={() => setShowNewChat(false)}
          />
        )}
      </aside>

      {/* Chat Area */}
      <section className={cn(
        "flex-1 flex flex-col",
        !selectedPartner ? "hidden md:flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0B0F1A]" : "flex"
      )}>
        {!selectedPartner ? (
          <div className="text-center space-y-3 p-8">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-violet-500" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Select a conversation to start chatting</p>
            <p className="text-xs text-slate-400">
              {isAdmin ? "Choose a user from the left panel." : "Click '+ New' to message the platform admin."}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 flex-shrink-0">
              <button
                className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setSelectedPartner(null)}
              >
                <ArrowLeft size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
              <Avatar user={selectedPartner} size="md" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{selectedPartner.full_name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge(selectedPartner.role)}`}>{selectedPartner.role}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={cn("flex gap-2 max-w-[80%]", isMine ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    {!isMine && <Avatar user={selectedPartner} size="sm" />}
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      isMine
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/10 rounded-bl-sm"
                    )}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <div className={cn("flex items-center gap-1 mt-1 text-[10px]", isMine ? "text-violet-200 justify-end" : "text-slate-400")}>
                        <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                        {isMine && <CheckCheck size={11} className={msg.is_read ? "text-violet-200" : "text-violet-400"} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 flex-shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${selectedPartner.full_name}...`}
                  rows={1}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm resize-none outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 max-h-32"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-violet-600 hover:bg-violet-700 rounded-2xl flex items-center justify-center text-white transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Admin-Only: New Chat modal to pick any user
function NewChatModal({ currentUserId, filterRole, onSelect, onClose }: {
  currentUserId: string;
  filterRole?: string;
  onSelect: (user: AdminUser) => void;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from("profiles")
      .select("id, full_name, role, avatar_url")
      .neq("id", currentUserId)
      .order("full_name");
    if (filterRole) query = query.eq("role", filterRole) as any;
    query.then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white">New Conversation</h3>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : filtered.map((u) => (
            <button key={u.id} onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-white/5">
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0",
                u.role === "admin" ? "bg-gradient-to-br from-indigo-500 to-purple-600" :
                u.role === "tutor" ? "bg-gradient-to-br from-emerald-500 to-teal-600" :
                "bg-gradient-to-br from-violet-500 to-purple-600"
              )}>
                {u.avatar_url ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" /> : u.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{u.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{u.role}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-slate-100 dark:border-white/10">
          <button onClick={onClose} className="w-full py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
