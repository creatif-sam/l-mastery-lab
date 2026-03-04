"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut, Save, Loader2, ArrowLeft, Camera, MapPin, Home, Building2, BookOpen, AlertCircle } from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
};

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({ 
    id: "", 
    full_name: "", 
    email: "", 
    avatar_url: "",
    organization_id: null as string | null,
    country_birth: "",
    country_residence: "",
    target_language: null as string | null
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, organization_id, country_birth, country_residence, target_language")
          .eq("id", user.id)
          .single();
        setProfile({ 
          id: user.id,
          full_name: data?.full_name || "", 
          email: user.email || "",
          avatar_url: data?.avatar_url || "",
          organization_id: data?.organization_id || null,
          country_birth: data?.country_birth || "",
          country_residence: data?.country_residence || "",
          target_language: data?.target_language || null
        });
      }
      setLoading(false);
    }

    async function getOrganizations() {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .order("name");
      if (data) setOrganizations(data);
    }

    getProfile();
    getOrganizations();
  }, []);

  // --- 📸 AVATAR UPLOAD LOGIC ---
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update State & DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar uploaded successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error("Error uploading avatar: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: profile.full_name,
        organization_id: profile.organization_id,
        country_birth: profile.country_birth,
        country_residence: profile.country_residence,
        target_language: profile.target_language
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
      router.refresh();
    }
    setUpdating(false);
  };

  // Calculate profile completion percentage (excluding organization_id)
  const calculateCompletion = () => {
    // Don't count organization_id for completion - it's optional for OAuth users
    const fields = [
      profile.full_name,
      profile.avatar_url,
      profile.country_birth,
      profile.country_residence,
      profile.target_language
    ];
    // Check for both empty strings and null/undefined
    const completed = fields.filter(field => {
      if (field === null || field === undefined) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      return true;
    }).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercent = calculateCompletion();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-2xl mx-auto space-y-8 pb-20">
            
            <Link 
              href="/protected/student-board" 
              className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-violet-600 transition-colors uppercase tracking-widest"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Profile Settings</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage your identity within the Mastery Lab.</p>
              </div>

              {/* 📸 AVATAR UPLOAD UI */}
              <div className="relative group self-start">
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-violet-500/10 shadow-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-violet-700 transition-colors border-2 border-white dark:border-slate-900">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Profile Completion Progress */}
            <div className={`rounded-2xl border p-6 ${
              completionPercent >= 80 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-amber-500/5 border-amber-500/20"
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  completionPercent >= 80 ? "text-emerald-600" : "text-amber-600"
                }`} />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Profile Completion: {completionPercent}%
                  </h3>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        completionPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  {completionPercent < 80 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Complete your profile to 80% to unlock all functionalities and access your organization features.
                    </p>
                  )}
                  {completionPercent >= 80 && (
                    <p className="text-xs text-emerald-600">
                      ✓ Your profile is complete! You have full access to all features.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 md:p-8 shadow-sm space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email (Account ID)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={profile.email} disabled className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Language</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <select
                      value={profile.target_language || ""}
                      onChange={(e) => setProfile({...profile, target_language: e.target.value || null})}
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="">Select your target language</option>
                      <option value="french">🇫🇷 French</option>
                      <option value="english">🇬🇧 English</option>
                      <option value="both">🌐 Both (French & English)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Organization</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <select
                      value={profile.organization_id || "solo"}
                      onChange={(e) => setProfile({...profile, organization_id: e.target.value === "solo" ? null : e.target.value})}
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="solo">🎓 Learning Solo (No organization)</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Country of Birth</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profile.country_birth}
                      onChange={(e) => setProfile({...profile, country_birth: e.target.value})}
                      placeholder="e.g. Ghana, Nigeria, Senegal..."
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Country of Residence</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profile.country_residence}
                      onChange={(e) => setProfile({...profile, country_residence: e.target.value})}
                      placeholder="e.g. France, Belgium, Morocco..."
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={updating}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-xl shadow-xl shadow-violet-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest text-xs"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Profile Info
              </button>
            </form>

            <div className="bg-red-500/5 rounded-2xl border border-red-500/10 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                <Shield className="w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Account Security</h3>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/20 text-red-500 font-bold py-4 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Logout of Mastery Lab
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}