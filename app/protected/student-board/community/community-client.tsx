"use client";

import { useState, useRef } from "react";
import { Heart, ThumbsUp, MessageCircle, Send, Image, X, Trophy, Star, Loader2, Trash2, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

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

type Reaction = { post_id: string; type: string };
type LeaderEntry = { id: string; full_name: string; community_points: number; role: string; avatar_url?: string };

function UserAvatar({ user, size = "md" }: { user: { full_name?: string; avatar_url?: string; role?: string }; size?: "sm" | "md" }) {
  const initials = user.full_name ? user.full_name[0].toUpperCase() : "?";
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  const bg = user.role === "admin" ? "bg-red-500" : user.role === "tutor" ? "bg-blue-500" : "bg-violet-600";
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.full_name ?? ""} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return <div className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center text-white font-black ${bg}`}>{initials}</div>;
}

export function CommunityClient({
  currentUser,
  initialPosts,
  myReactions,
  leaderboard,
}: {
  currentUser: any;
  initialPosts: any[];
  myReactions: Reaction[];
  leaderboard: LeaderEntry[];
}) {
  const supabase = createClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [reactions, setReactions] = useState<Reaction[]>(myReactions);
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<string[]>([]);
  const [myPoints, setMyPoints] = useState<number>(currentUser?.community_points ?? 0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const path = `community/${currentUser.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("community-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed. Ensure the 'community-images' bucket exists in Supabase Storage.");
      setUploadingImage(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("community-images").getPublicUrl(path);
    setImageUrl(publicUrl);
    setShowImageInput(true);
    toast.success("Image uploaded!");
    setUploadingImage(false);
  };

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
      .select(`id, content, image_url, likes_count, loves_count, comments_count, created_at, author:profiles!community_posts_author_id_fkey(id, full_name, role, community_points, avatar_url)`)
      .single();

    if (error) { toast.error("Failed to post"); setPosting(false); return; }

    setPosts((prev) => [data as any, ...prev]);
    setMyPoints((p) => p + 1);
    setNewPost(""); setImageUrl(""); setShowImageInput(false);
    toast.success("+1 point earned for posting! 🎉");

    // Notify org members
    if (currentUser.organization_id) {
      const { data: orgMembers } = await supabase
        .from("profiles")
        .select("id")
        .eq("organization_id", currentUser.organization_id)
        .neq("id", currentUser.id);

      if (orgMembers && orgMembers.length > 0) {
        await supabase.from("notifications").insert(
          orgMembers.map((m: any) => ({
            user_id: m.id,
            title: `New post by ${currentUser.full_name}`,
            message: newPost.trim().substring(0, 80) + (newPost.length > 80 ? "..." : ""),
            type: "info",
            link: "/protected/student-board/community",
          }))
        );
      }
    }
    setPosting(false);
  };

  const handleReaction = async (postId: string, type: "like" | "love") => {
    const existing = reactions.find((r) => r.post_id === postId && r.type === type);
    if (existing) {
      // Remove reaction
      await supabase.from("community_reactions").delete()
        .eq("post_id", postId).eq("user_id", currentUser.id).eq("type", type);
      setReactions((prev) => prev.filter((r) => !(r.post_id === postId && r.type === type)));
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p, likes_count: type === "like" ? Math.max(0, p.likes_count - 1) : p.likes_count, loves_count: type === "love" ? Math.max(0, p.loves_count - 1) : p.loves_count }
        : p));
    } else {
      const { error } = await supabase.from("community_reactions").insert({ post_id: postId, user_id: currentUser.id, type });
      if (error) { if (error.code === "23505") { toast("Already reacted!"); } return; }
      setReactions((prev) => [...prev, { post_id: postId, type }]);
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p, likes_count: type === "like" ? p.likes_count + 1 : p.likes_count, loves_count: type === "love" ? p.loves_count + 1 : p.loves_count }
        : p));
      toast.success(`+0.1 pts`);
    }
  };

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
        .select("id, content, created_at, author:profiles!community_comments_author_id_fkey(id, full_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setPostComments((prev) => ({ ...prev, [postId]: data ?? [] }));
      setLoadingComments((prev) => prev.filter((id) => id !== postId));
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, author_id: currentUser.id, content: text })
      .select("id, content, created_at, author:profiles!community_comments_author_id_fkey(id, full_name)")
      .single();
    if (error) { toast.error("Couldn't post comment"); return; }
    setPostComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data as any] }));
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    setMyPoints((p) => p + 0.5);
    toast.success("+0.5 pts for commenting!");
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) { toast.error("Couldn't delete"); return; }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted");
  };

  const hasReacted = (postId: string, type: string) => reactions.some((r) => r.post_id === postId && r.type === type);

  const roleColor = (role: string) => role === "admin" ? "text-red-500" : role === "tutor" ? "text-blue-500" : "text-violet-500";
  const roleBg = (role: string) => role === "admin" ? "bg-red-500/10" : role === "tutor" ? "bg-blue-500/10" : "bg-violet-500/10";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* FEED */}
      <div className="lg:col-span-2 space-y-4">

        {/* Composer */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4">
          <div className="flex gap-3">
            <UserAvatar user={currentUser ?? {}} size="md" />
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share something with your organization..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
              {showImageInput && imageUrl && (
                <div className="mt-2 relative">
                  <img src={imageUrl} alt="preview" className="rounded-xl max-h-48 w-full object-cover border border-slate-200 dark:border-white/10" />
                  <button onClick={() => { setShowImageInput(false); setImageUrl(""); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
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
                    title="Upload image"
                  >
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                    {uploadingImage ? "Uploading..." : "Add Photo"}
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
                    Post (+1pt)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {posts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-16 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No posts yet. Be the first!</p>
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            {/* Post Header */}
            <div className="flex items-start justify-between p-4 pb-0">
              <div className="flex items-start gap-3">
                <UserAvatar user={post.author ?? {}} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{post.author?.full_name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${roleBg(post.author?.role)} ${roleColor(post.author?.role)}`}>
                      {post.author?.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "just now"}
                    {" · "}
                    <span className="text-amber-500 font-semibold">{post.author?.community_points?.toFixed(1)} pts</span>
                  </p>
                </div>
              </div>
              {(post.author?.id === currentUser?.id || currentUser?.role === "admin") && (
                <button onClick={() => handleDeletePost(post.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="px-4 py-3">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Image */}
            {post.image_url && (
              <div className="px-4 pb-3">
                <img src={post.image_url} alt="post" className="w-full rounded-xl max-h-80 object-cover border border-slate-100 dark:border-white/5" />
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-slate-100 dark:border-white/5 px-4 py-2.5 flex items-center gap-4">
              <button
                onClick={() => handleReaction(post.id, "like")}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${hasReacted(post.id, "like") ? "text-blue-500" : "text-slate-400 hover:text-blue-500"}`}
              >
                <ThumbsUp size={14} className={hasReacted(post.id, "like") ? "fill-blue-500" : ""} />
                {post.likes_count}
              </button>
              <button
                onClick={() => handleReaction(post.id, "love")}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${hasReacted(post.id, "love") ? "text-red-500" : "text-slate-400 hover:text-red-500"}`}
              >
                <Heart size={14} className={hasReacted(post.id, "love") ? "fill-red-500" : ""} />
                {post.loves_count}
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-violet-500 transition-colors"
              >
                <MessageCircle size={14} />
                {post.comments_count}
                {expandedComments.includes(post.id) ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            </div>

            {/* Comments */}
            {expandedComments.includes(post.id) && (
              <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 px-4 py-3 space-y-3">
                {loadingComments.includes(post.id) ? (
                  <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-slate-400" /></div>
                ) : (
                  <>
                    {(postComments[post.id] ?? []).map((c: any) => (
                      <div key={c.id} className="flex gap-2.5">
                        <UserAvatar user={c.author ?? {}} size="sm" />
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl px-3 py-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.author?.full_name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{c.content}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))}
                    {(postComments[post.id] ?? []).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-1">No comments yet</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={commentTexts[post.id] ?? ""}
                        onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                        placeholder="Write a comment... (+0.5 pts)"
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-slate-700 dark:text-slate-200"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-xl flex items-center justify-center text-white transition-colors"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SIDEBAR */}
      <div className="space-y-4">
        {/* My Points */}
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
              { action: "Comment", pts: "+0.5" },
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
              <div key={member.id} className={`flex items-center gap-3 px-4 py-3 ${member.id === currentUser?.id ? "bg-violet-50 dark:bg-violet-500/5" : ""}`}>
                <span className={`text-xs font-black w-5 text-center ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-slate-400"}`}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </span>
                <UserAvatar user={member} size="sm" />
                <p className={`text-xs font-semibold flex-1 truncate ${member.id === currentUser?.id ? "text-violet-600" : "text-slate-700 dark:text-slate-300"}`}>
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
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Post consistently to earn more points and climb the leaderboard. Everyone in your organization sees your posts!</p>
        </div>
      </div>
    </div>
  );
}
