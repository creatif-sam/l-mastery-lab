"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User, Mail, Shield, Building2, Camera, Loader2, Save, Calendar,
  Video, Link2, Trash2, Plus, Send, MessageSquare, Clock,
} from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
}

interface Meeting {
  id: string;
  title: string;
  platform: string;
  meeting_link: string;
  start_time: string;
}

export function TutorSettingsClient({
  profile,
  orgName,
  upcomingMeetings: initialMeetings,
}: {
  profile: Profile;
  orgName: string | null;
  upcomingMeetings: Meeting[];
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(profile.avatar_url ?? "");

  // ── Meeting state ──────────────────────────────────────────────────────────
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);

  // ── Contact Admin state ────────────────────────────────────────────────────
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const initials = fullName
    ? fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "T";

  const detectPlatform = (link: string): string => {
    if (link.includes("meet.google.com")) return "Google Meet";
    if (link.includes("zoom.us")) return "Zoom";
    if (link.includes("teams.microsoft.com")) return "Teams";
    return "Video Call";
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${profile.id}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Avatar upload failed. Make sure the 'uploads' bucket exists.");
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setLocalAvatar(publicUrl);
    toast.success("Avatar uploaded!");
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), avatar_url: avatarUrl || null })
      .eq("id", profile.id);
    if (error) { toast.error("Failed to save changes"); setSaving(false); return; }
    toast.success("Profile updated successfully!");
    setSaving(false);
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle.trim()) { toast.error("Please enter a meeting title"); return; }
    if (!meetingDate) { toast.error("Please select a date & time"); return; }
    if (!meetingLink.trim()) { toast.error("Please paste the meeting link"); return; }
    if (!profile.organization_id) { toast.error("You are not assigned to an organisation yet"); return; }

    setSavingMeeting(true);
    const platform = detectPlatform(meetingLink);
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        organization_id: profile.organization_id,
        title: meetingTitle.trim(),
        platform,
        meeting_link: meetingLink.trim(),
        start_time: new Date(meetingDate).toISOString(),
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) { toast.error("Failed to schedule meeting"); setSavingMeeting(false); return; }

    setMeetings((prev) =>
      [...prev, data as Meeting].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    );
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingLink("");
    toast.success(`Meeting scheduled for ${format(new Date(meetingDate), "dd MMM yyyy, p")}!`);
    setSavingMeeting(false);
  };

  const handleDeleteMeeting = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) { toast.error("Failed to remove meeting"); return; }
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    toast.success("Meeting removed");
  };

  const handleContactAdmin = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }
    setSendingContact(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.full_name,
          email: profile.email,
          category: "tutor-admin",
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error("Server error");
      toast.success("Message sent to admin!");
      setContactSubject("");
      setContactMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
    setSendingContact(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* ── HERO: Avatar + name ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {localAvatar ? (
              <img
                src={localAvatar}
                alt={fullName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-700 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl border-4 border-white dark:border-slate-700 shadow-lg">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center text-white shadow-md transition-colors disabled:opacity-50"
              title="Change avatar"
            >
              {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{profile.full_name}</h2>
            <span className="inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 capitalize">
              {profile.role}
            </span>
            {orgName && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Building2 size={11} /> {orgName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── PROFILE FORM ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-5">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User size={16} className="text-emerald-500" /> Profile Information
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Avatar URL</label>
          <input
            value={avatarUrl}
            onChange={(e) => { setAvatarUrl(e.target.value); setLocalAvatar(e.target.value); }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="https://... or upload via the camera icon"
          />
          <p className="text-[11px] text-slate-400 mt-1">Paste a URL or click the camera icon to upload a file.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* ── ACCOUNT DETAILS (read-only) ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield size={16} className="text-blue-500" /> Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: "Email", value: profile.email },
            { icon: Shield, label: "Role", value: profile.role, className: "capitalize" },
            { icon: Calendar, label: "Joined", value: format(new Date(profile.created_at), "dd MMM yyyy") },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <item.icon size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{item.label}</p>
                <p className={`text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5 ${item.className ?? ""}`}>{item.value}</p>
              </div>
            </div>
          ))}

          {/* Organisation – locked, cannot be changed */}
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-xl sm:col-span-2">
            <Building2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-500">Organisation</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                {orgName ?? "Not assigned"}
              </p>
              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
                Organisation assignment is managed by your admin and cannot be changed here.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 px-2 py-1 rounded-full flex-shrink-0">
              Locked
            </span>
          </div>
        </div>
      </div>

      {/* ── SCHEDULE A MEETING ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video size={16} className="text-violet-500" /> Schedule a Meeting
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Post a Google Meet or Zoom session. Students will see it highlighted on their monthly calendar.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Meeting Title</label>
            <input
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="e.g. Weekly French Review"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Link2 size={11} /> Meeting Link
              {meetingLink && (
                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600">
                  {detectPlatform(meetingLink)}
                </span>
              )}
            </label>
            <input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="https://meet.google.com/abc-def  or  https://zoom.us/j/123"
            />
            <p className="text-[11px] text-slate-400 mt-1">Platform (Google Meet / Zoom) is detected automatically from the link.</p>
          </div>

          <button
            onClick={handleScheduleMeeting}
            disabled={savingMeeting}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {savingMeeting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {savingMeeting ? "Scheduling…" : "Schedule Meeting"}
          </button>
        </div>

        {/* Upcoming meetings list */}
        {meetings.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Scheduled Sessions</p>
            <div className="space-y-2">
              {meetings.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 flex-shrink-0">
                    <Video size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <Clock size={10} />
                      <span>{format(new Date(m.start_time), "dd MMM yyyy, p")}</span>
                      <span className="font-bold text-violet-500">{m.platform}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMeeting(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                    title="Remove meeting"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTACT ADMIN ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-500" /> Contact Admin
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Have a question or issue? Send a message directly to your organisation admin.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Subject</label>
            <input
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              placeholder="e.g. Question about student roster"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Message</label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
              placeholder="Describe your question or issue in detail…"
            />
          </div>
          <button
            onClick={handleContactAdmin}
            disabled={sendingContact}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {sendingContact ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sendingContact ? "Sending…" : "Send to Admin"}
          </button>
        </div>
      </div>

    </div>
  );
}
