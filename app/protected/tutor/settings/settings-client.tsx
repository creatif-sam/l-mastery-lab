"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Mail, Shield, Building2, Camera, Loader2, Save, Calendar } from "lucide-react";
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

export function TutorSettingsClient({
  profile,
  orgName,
}: {
  profile: Profile;
  orgName: string | null;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(profile.avatar_url ?? "");

  const initials = fullName ? fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "T";

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar + Name hero */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
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

      {/* Profile form */}
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
          <p className="text-[11px] text-slate-400 mt-1">You can paste a URL or click the camera icon on your avatar to upload a file.</p>
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

      {/* Read-only info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield size={16} className="text-blue-500" /> Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: "Email", value: profile.email },
            { icon: Shield, label: "Role", value: profile.role, className: "capitalize" },
            { icon: Building2, label: "Organisation", value: orgName ?? "Not assigned" },
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
        </div>
      </div>
    </div>
  );
}
