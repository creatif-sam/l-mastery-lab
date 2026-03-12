"use client";

import { useState, useRef } from "react";
import {
  Heart, ThumbsUp, MessageCircle, Send, Image, X,
  Trophy, Star, Loader2, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

// â”€ Types â”€
type OrgMember = { id: string; full_name: string; avatar_url?: string; role?: string };

type Post = {
  id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  loves_count: number;
  comments_count: number;
  created_at: string;
  author: { id: string; full_name: string; role: string; community_points: number; avatar_url?: string };
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id?: string | null;
  author: { id: string; full_name: string; avatar_url?: string };
  replies: Comment[];
};

type Reaction = { post_id: string; type: string };
type LeaderEntry = { id: string; full_name: string; community_points: number; role: string; avatar_url?: string };

// â”€ UserAvatar â”€

function UserAvatar({
  user, size = "md",
}: {
  user: { full_name?: string; avatar_url?: string; role?: string };
  size?: "sm" | "md";
}) {
  const initials = user.full_name ? user.full_name[0].toUpperCase() : "?";
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const bg = user.role === "admin" ? "bg-red-500" : user.role === "tutor" ? "bg-blue-500" : "bg-violet-600";
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name ?? ""}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-white dark:border-slate-700`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center text-white font-black ${bg} border-2 border-white dark:border-slate-700`}>
      {initials}
    </div>
  );
}

// â”€ MentionInput â”€

function MentionInput({
  value, onChange, onSubmit, orgMembers, placeholder, rows = 1, className, autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  orgMembers: OrgMember[];
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}) {
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers =
    mentionStart >= 0
      ? orgMembers.filter((m) => m.full_name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
      : [];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart ?? val.length;
    onChange(val);
    const textBefore = val.slice(0, pos);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx >= 0) {
      const afterAt = textBefore.slice(atIdx + 1);
      if (!afterAt.includes("\n")) {
        setMentionStart(atIdx);
        setMentionQuery(afterAt);
        return;
      }
    }
    setMentionStart(-1);
    setMentionQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && mentionStart >= 0) {
      setMentionStart(-1);
      setMentionQuery("");
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && filteredMembers.length === 0 && rows === 1) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const selectMember = (member: OrgMember) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    onChange(`${before}@${member.full_name} ${after.trimStart()}`);
    setMentionStart(-1);
    setMentionQuery("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />
      {filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 bg-violet-50 dark:bg-violet-500/10">
            <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Mention someone</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectMember(member); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-left transition-colors"
              >
                <UserAvatar user={member} size="sm" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{member.full_name}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">{member.role ?? "student"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€ TextWithMentions â”€

function TextWithMentions({ text, orgMembers }: { text: string; orgMembers: OrgMember[] }) {
  if (!text) return null;
  if (!orgMembers.length || !text.includes("@")) return <span className="whitespace-pre-wrap">{text}</span>;
  try {
    const escapedNames = orgMembers
      .map((m) => m.full_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(@(?:${escapedNames.join("|")}))`, "g");
    const parts = text.split(pattern);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const isMention = part.startsWith("@") && orgMembers.some((m) => `@${m.full_name}` === part);
          return isMention
            ? <span key={i} className="font-semibold text-violet-600 dark:text-violet-400">{part}</span>
            : <span key={i}>{part}</span>;
        })}
      </span>
    );
  } catch {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }
}

// â”€ Mention helpers â”€

function extractMentions(text: string, orgMembers: OrgMember[], excludeId: string): OrgMember[] {
  return orgMembers.filter((m) => m.id !== excludeId && text.includes(`@${m.full_name}`));
}

async function notifyMentions(text: string, orgMembers: OrgMember[], authorId: string, authorName: string) {
  const mentioned = extractMentions(text, orgMembers, authorId);
  if (!mentioned.length) return;
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_ids: mentioned.map((m) => m.id),
        title: `${authorName} mentioned you`,
        message: `${authorName} mentioned you in the community â€” tap to view.`,
        type: "mention",
        link: "/protected/student-board/community",
      }),
    });
  } catch { /* non-critical */ }
}

// â”€ CommentItem â”€

function CommentItem({
  comment, postId, currentUser, orgMembers,
  replyingToId, replyText, onToggleReply, onReplyTextChange, onSubmitReply,
}: {
  comment: Comment;
  postId: string;
  currentUser: any;
  orgMembers: OrgMember[];
  replyingToId: string | null;
  replyText: string;
  onToggleReply: (commentId: string) => void;
  onReplyTextChange: (commentId: string, text: string) => void;
  onSubmitReply: (commentId: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const isReplying = replyingToId === comment.id;
  const replyCount = comment.replies?.length ?? 0;

  return (
    <div className="flex gap-2.5">
      <UserAvatar user={comment.author ?? {}} size="sm" />
      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-slate-100 dark:border-white/5">
          <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{comment.author?.full_name}</p>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            <TextWithMentions text={comment.content} orgMembers={orgMembers} />
          </p>
        </div>
        {/* Inline actions */}
        <div className="flex items-center gap-4 mt-1.5 ml-1">
          <span className="text-[10px] text-slate-400">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          <button
            onClick={() => onToggleReply(comment.id)}
            className={`text-[11px] font-bold transition-colors ${isReplying ? "text-violet-600" : "text-slate-400 hover:text-violet-500"}`}
          >
            {isReplying ? "Cancel" : "Reply"}
          </button>
          {replyCount > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="text-[11px] font-bold text-violet-500 hover:text-violet-600 transition-colors flex items-center gap-1"
            >
              {showReplies ? (
                <><ChevronUp size={10} /> Hide {replyCount} repl{replyCount !== 1 ? "ies" : "y"}</>
              ) : (
                <><ChevronDown size={10} /> View {replyCount} repl{replyCount !== 1 ? "ies" : "y"}</>
              )}
            </button>
          )}
        </div>

        {/* Inline reply input */}
        {isReplying && (
          <div className="flex gap-2 mt-2.5">
            <UserAvatar user={currentUser} size="sm" />
            <div className="relative flex-1">
              <MentionInput
                value={replyText}
                onChange={(v) => onReplyTextChange(comment.id, v)}
                onSubmit={() => onSubmitReply(comment.id)}
                orgMembers={orgMembers}
                placeholder={`Reply to ${comment.author?.full_name}â€¦ (@ to mention)`}
                rows={1}
                autoFocus
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-11 py-2.5 text-xs outline-none focus:border-violet-400 dark:focus:border-violet-500 text-slate-700 dark:text-slate-200 resize-none transition-colors"
              />
              <button
                disabled={!replyText?.trim()}
                onClick={() => onSubmitReply(comment.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Send size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && replyCount > 0 && (
          <div className="mt-3 space-y-2.5 pl-3 border-l-2 border-violet-200 dark:border-violet-500/20 ml-1">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <UserAvatar user={reply.author ?? {}} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-slate-100 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{reply.author?.full_name}</p>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      <TextWithMentions text={reply.content} orgMembers={orgMembers} />
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€ CommunityClient (main export) â”€

export function CommunityClient({
  currentUser,
  initialPosts,
  myReactions,
  leaderboard,
  orgMembers = [],
}: {
  currentUser: any;
  initialPosts: any[];
  myReactions: Reaction[];
  leaderboard: LeaderEntry[];
  orgMembers?: OrgMember[];
}) {
  const supabase = createClient();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [reactions, setReactions] = useState<Reaction[]>(myReactions);
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string[]>([]);
  const [myPoints, setMyPoints] = useState<number>(currentUser?.community_points ?? 0);
  // Reply state
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // â”€ Image upload â”€

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const path = `community/${currentUser.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("community-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Image upload failed. Ensure the 'community-images' bucket exists.");
      setUploadingImage(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("community-images").getPublicUrl(path);
    setImageUrl(publicUrl);
    setShowImagePreview(true);
    toast.success("Image uploaded!");
    setUploadingImage(false);
  };

  // â”€ Create post â”€

  const handlePost = async () => {
    if (!newPost.trim()) { toast.error("Write something first"); return; }
    setPosting(true);
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        author_id: currentUser.id,
        organization_id: currentUser.organization_id ?? null,
        content: newPost.trim(),
        image_url: imageUrl.trim() || null,
      })
      .select(`id, content, image_url, likes_count, loves_count, comments_count, created_at,
        author:profiles!community_posts_author_id_fkey(id, full_name, role, community_points, avatar_url)`)
      .single();
    if (error) { toast.error("Failed to post"); setPosting(false); return; }
    const postedContent = newPost.trim();
    setPosts((prev) => [data as any, ...prev]);
    setMyPoints((p) => p + 1);
    setNewPost(""); setImageUrl(""); setShowImagePreview(false);
    toast.success("+1 point earned for posting! ðŸŽ‰");
    setPosting(false);
    notifyMentions(postedContent, orgMembers, currentUser.id, currentUser.full_name);
  };

  // â”€ Reactions â”€

  const handleReaction = async (postId: string, type: "like" | "love") => {
    const existing = reactions.find((r) => r.post_id === postId && r.type === type);
    if (existing) {
      const { error } = await supabase.from("community_reactions").delete()
        .eq("post_id", postId).eq("user_id", currentUser.id).eq("type", type);
      if (error) { toast.error("Failed to remove reaction"); return; }
      setReactions((prev) => prev.filter((r) => !(r.post_id === postId && r.type === type)));
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p,
            likes_count: type === "like" ? Math.max(0, p.likes_count - 1) : p.likes_count,
            loves_count: type === "love" ? Math.max(0, p.loves_count - 1) : p.loves_count }
        : p));
    } else {
      const { error } = await supabase.from("community_reactions").insert({ post_id: postId, user_id: currentUser.id, type });
      if (error) {
        if (error.code === "23505") { toast("Already reacted!"); } else { toast.error("Failed to add reaction"); }
        return;
      }
      setReactions((prev) => [...prev, { post_id: postId, type }]);
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p,
            likes_count: type === "like" ? p.likes_count + 1 : p.likes_count,
            loves_count: type === "love" ? p.loves_count + 1 : p.loves_count }
        : p));
      toast.success("+0.1 pts");
    }
  };

  // â”€ Toggle & load comments â”€

  const toggleComments = async (postId: string) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments((prev) => prev.filter((id) => id !== postId));
      return;
    }
    setExpandedComments((prev) => [...prev, postId]);
    if (!postComments[postId]) {
      setLoadingComments((prev) => [...prev, postId]);
      const { data } = await supabase
        .from("community_comments")
        .select(`id, content, created_at, parent_comment_id,
          author:profiles!community_comments_author_id_fkey(id, full_name, avatar_url)`)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      const all = (data ?? []) as any[];
      const topLevel = all.filter((c) => !c.parent_comment_id);
      const replies = all.filter((c) => c.parent_comment_id);
      const threaded: Comment[] = topLevel.map((c) => ({
        ...c,
        replies: replies.filter((r) => r.parent_comment_id === c.id),
      }));
      setPostComments((prev) => ({ ...prev, [postId]: threaded }));
      setLoadingComments((prev) => prev.filter((id) => id !== postId));
    }
  };

  // â”€ Post comment 

  const handleComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, author_id: currentUser.id, content: text, parent_comment_id: null })
      .select(`id, content, created_at, author:profiles!community_comments_author_id_fkey(id, full_name, avatar_url)`)
      .single();
    if (error) { toast.error("Couldn't post comment: " + error.message); return; }
    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), { ...(data as any), replies: [] }],
    }));
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    setMyPoints((p) => p + 0.5);
    toast.success("+0.5 pts for commenting!");
    notifyMentions(text, orgMembers, currentUser.id, currentUser.full_name);
  };

  // â”€ Post reply â”€

  const handleReply = async (postId: string, parentCommentId: string) => {
    const text = replyTexts[parentCommentId]?.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, author_id: currentUser.id, content: text, parent_comment_id: parentCommentId })
      .select(`id, content, created_at, author:profiles!community_comments_author_id_fkey(id, full_name, avatar_url)`)
      .single();
    if (error) { toast.error("Couldn't post reply: " + error.message); return; }
    setPostComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map((c) =>
        c.id === parentCommentId
          ? { ...c, replies: [...(c.replies ?? []), { ...(data as any), replies: [] }] }
          : c
      ),
    }));
    setReplyTexts((prev) => ({ ...prev, [parentCommentId]: "" }));
    setReplyingTo((prev) => ({ ...prev, [postId]: null }));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    toast.success("Reply posted!");
    notifyMentions(text, orgMembers, currentUser.id, currentUser.full_name);
  };

  // â”€ Delete post â”€

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) { toast.error("Couldn't delete"); return; }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted");
  };

  const hasReacted = (postId: string, type: string) =>
    reactions.some((r) => r.post_id === postId && r.type === type);
  const roleColor = (role: string) =>
    role === "admin" ? "text-red-500" : role === "tutor" ? "text-blue-500" : "text-violet-500";
  const roleBg = (role: string) =>
    role === "admin" ? "bg-red-500/10" : role === "tutor" ? "bg-blue-500/10" : "bg-violet-500/10";

  // â”€ Render â”€

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* MAIN FEED */}
      <div className="lg:col-span-2 space-y-4">

        {/* Post Composer */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4">
          <div className="flex gap-3">
            <UserAvatar user={currentUser ?? {}} size="md" />
            <div className="flex-1">
              <MentionInput
                value={newPost}
                onChange={setNewPost}
                orgMembers={orgMembers}
                placeholder="Share something with your community¦ (use @ to mention someone)"
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-violet-400 dark:focus:border-violet-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-colors"
              />
              {showImagePreview && imageUrl && (
                <div className="mt-2 relative">
                  <img src={imageUrl} alt="preview" className="rounded-xl max-h-48 w-full object-cover border border-slate-200 dark:border-white/10" />
                  <button
                    onClick={() => { setShowImagePreview(false); setImageUrl(""); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-500 transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                    {uploadingImage ? "Uploadingâ€¦" : "Photo"}
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{newPost.length}/500</span>
                  <button
                    onClick={handlePost}
                    disabled={posting || !newPost.trim()}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Post (+1 pt)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-16 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No posts yet. Be the first!</p>
          </div>
        )}

        {/* Posts */}
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">

            {/* Post Header */}
            <div className="flex items-start justify-between p-4 pb-3">
              <div className="flex items-start gap-3">
                <UserAvatar user={post.author ?? {}} size="md" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{post.author?.full_name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${roleBg(post.author?.role)} ${roleColor(post.author?.role)}`}>
                      {post.author?.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "just now"}
                    {" Â· "}
                    <span className="text-amber-500 font-semibold">{post.author?.community_points?.toFixed(1)} pts</span>
                  </p>
                </div>
              </div>
              {(post.author?.id === currentUser?.id || currentUser?.role === "admin") && (
                <button onClick={() => handleDeletePost(post.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <TextWithMentions text={post.content} orgMembers={orgMembers} />
              </p>
            </div>

            {/* Image */}
            {post.image_url && (
              <div className="px-4 pb-3">
                <img src={post.image_url} alt="post" className="w-full rounded-xl max-h-80 object-cover border border-slate-100 dark:border-white/5" />
              </div>
            )}

            {/* Reaction summary bar â€“ LinkedIn style */}
            {(post.likes_count > 0 || post.loves_count > 0 || post.comments_count > 0) && (
              <div className="px-4 pb-2 flex items-center gap-1.5">
                {post.likes_count > 0 && (
                  <span className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <ThumbsUp size={9} className="text-white fill-white" />
                  </span>
                )}
                {post.loves_count > 0 && (
                  <span className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                    <Heart size={9} className="text-white fill-white" />
                  </span>
                )}
                {(post.likes_count + post.loves_count) > 0 && (
                  <span className="text-xs text-slate-400">{post.likes_count + post.loves_count}</span>
                )}
                {post.comments_count > 0 && (
                  <span className="text-xs text-slate-400 ml-auto">
                    {post.comments_count} comment{post.comments_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons â€“ LinkedIn 3-column grid */}
            <div className="border-t border-slate-100 dark:border-white/5 px-2 py-1 grid grid-cols-3 gap-1">
              <button
                onClick={() => handleReaction(post.id, "like")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  hasReacted(post.id, "like")
                    ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-500"
                }`}
              >
                <ThumbsUp size={14} className={hasReacted(post.id, "like") ? "fill-blue-500" : ""} />
                Like
              </button>
              <button
                onClick={() => handleReaction(post.id, "love")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  hasReacted(post.id, "love")
                    ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-rose-500"
                }`}
              >
                <Heart size={14} className={hasReacted(post.id, "love") ? "fill-rose-500" : ""} />
                Love
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  expandedComments.includes(post.id)
                    ? "text-violet-500 bg-violet-50 dark:bg-violet-500/10"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-violet-500"
                }`}
              >
                <MessageCircle size={14} />
                Comment{post.comments_count > 0 ? ` (${post.comments_count})` : ""}
              </button>
            </div>

            {/* Comments section */}
            {expandedComments.includes(post.id) && (
              <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-800/20 px-4 py-4 space-y-4">
                {loadingComments.includes(post.id) ? (
                  <div className="flex justify-center py-3">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    {/* Comment input at top */}
                    <div className="flex gap-2.5">
                      <UserAvatar user={currentUser ?? {}} size="sm" />
                      <div className="relative flex-1">
                        <MentionInput
                          value={commentTexts[post.id] ?? ""}
                          onChange={(v) => setCommentTexts((prev) => ({ ...prev, [post.id]: v }))}
                          onSubmit={() => handleComment(post.id)}
                          orgMembers={orgMembers}
                          placeholder="Add a comment… (@ to mention)"
                          rows={1}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-12 py-2.5 text-xs outline-none focus:border-violet-400 dark:focus:border-violet-500 text-slate-700 dark:text-slate-200 resize-none transition-colors"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={!commentTexts[post.id]?.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <Send size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Comments list */}
                    {(postComments[post.id] ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-1">
                        No comments yet  be the first!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(postComments[post.id] ?? []).map((comment) => (
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={post.id}
                            currentUser={currentUser}
                            orgMembers={orgMembers}
                            replyingToId={replyingTo[post.id] ?? null}
                            replyText={replyTexts[comment.id] ?? ""}
                            onToggleReply={(commentId) =>
                              setReplyingTo((prev) => ({
                                ...prev,
                                [post.id]: prev[post.id] === commentId ? null : commentId,
                              }))
                            }
                            onReplyTextChange={(commentId, text) =>
                              setReplyTexts((prev) => ({ ...prev, [commentId]: text }))
                            }
                            onSubmitReply={(commentId) => handleReply(post.id, commentId)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-4">
        {/* My Points card */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-yellow-300" />
            <h3 className="text-xs font-black uppercase tracking-widest text-violet-200">My Points</h3>
          </div>
          <p className="text-4xl font-black">{myPoints.toFixed(1)}</p>
          <p className="text-xs text-violet-200 mt-1">Community score</p>
          <div className="mt-4 space-y-1.5 border-t border-white/20 pt-3">
            {[
              { action: "Post", pts: "+1.0" },
              { action: "Comment / Reply", pts: "+0.5" },
              { action: "Like / Love", pts: "+0.1" },
            ].map((r) => (
              <div key={r.action} className="flex items-center justify-between text-xs">
                <span className="text-violet-200">{r.action}</span>
                <span className="font-black text-yellow-300">{r.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-white/5">
            <Trophy size={14} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Top Community</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {leaderboard.map((member, idx) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 px-4 py-3 ${member.id === currentUser?.id ? "bg-violet-50 dark:bg-violet-500/5" : ""}`}
              >
                <span className={`text-xs font-black w-5 text-center ${
                  idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-slate-400"
                }`}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </span>
                <UserAvatar user={member} size="sm" />
                <p className={`text-xs font-semibold flex-1 truncate ${
                  member.id === currentUser?.id ? "text-violet-600" : "text-slate-700 dark:text-slate-300"
                }`}>
                  {member.id === currentUser?.id ? "You" : member.full_name}
                </p>
                <span className="text-xs font-black text-amber-500">{member.community_points?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-500/20">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">💡 Tip</p>
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
            Use <strong>@Name</strong> in posts or comments to mention a teammate. They&apos;ll receive an instant notification!
          </p>
        </div>
      </div>
    </div>
  );
}
