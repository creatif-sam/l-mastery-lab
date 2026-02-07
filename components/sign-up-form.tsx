"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added for movement
import { cn } from "@/lib/utils";

export function SignUpForm() {
  const [formData, setFormData] = useState({
    fullName: "", birthCountry: "", residenceCountry: "",
    email: "", password: "", repeat: "",
    orgId: "solo", targetLanguage: "french" as const
  });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Added for movement feedback
  const [error, setError] = useState<string | null>(null); // Added for messages
  const router = useRouter();

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await createClient().from('organizations').select('id, name, logo_url');
      if (data) setOrganizations(data);
    };
    fetchOrgs();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    if (formData.password !== formData.repeat) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.fullName,
          country_birth: formData.birthCountry,
          country_residence: formData.residenceCountry,
          organization_id: formData.orgId === "solo" ? null : formData.orgId,
          target_language: formData.targetLanguage,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else {
      // "Movement": Move to success page
      router.push("/auth/sign-up-success");
    }
  };

  const getLogoUrl = (path: string) => 
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${path}`;

  return (
    <div className="w-full space-y-8">
      <header className="space-y-1">
        <h1 className="text-4xl font-black text-[#003366] tracking-tight text-left">Sign Up</h1>
        <p className="text-zinc-400 text-sm font-medium text-left">Let's start with some facts about you</p>
      </header>

      <form onSubmit={handleSignUp} className="space-y-6">
        {/* ROW 1: NAMES */}
        <div className="grid grid-cols-2 gap-4">
          <AcademicInput label="FULL NAME" placeholder="First Name" value={formData.fullName} onChange={(v: string) => setFormData({...formData, fullName: v})} />
          <AcademicInput label="EMAIL ADDRESS" placeholder="Email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
        </div>

        {/* ROW 2: COUNTRIES */}
        <div className="grid grid-cols-2 gap-4">
           <AcademicInput label="COUNTRY OF BIRTH" placeholder="Morocco" value={formData.birthCountry} onChange={(v: string) => setFormData({...formData, birthCountry: v})} />
           <AcademicInput label="COUNTRY OF RESIDENCE" placeholder="France" value={formData.residenceCountry} onChange={(v: string) => setFormData({...formData, residenceCountry: v})} />
        </div>

        {/* ROW 3: ORG */}
        <div className="space-y-1.5 group">
          <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 block text-left">Organization</label>
          <div className="flex items-center gap-3 border border-zinc-300 rounded-xl px-4 py-3 bg-zinc-50 focus-within:border-violet-600 transition-all">
             {formData.orgId !== "solo" && (
               <div className="w-5 h-5 shrink-0 rounded overflow-hidden border border-zinc-200 bg-white relative">
                  <Image 
                    src={getLogoUrl(organizations.find(o => o.id === formData.orgId)?.logo_url || '')} 
                    alt="" 
                    fill 
                    className="object-cover" 
                  />
               </div>
             )}
             <select 
              className="w-full bg-transparent outline-none text-xs font-bold text-[#003366] appearance-none"
              value={formData.orgId}
              onChange={(e) => setFormData({...formData, orgId: e.target.value})}
             >
               <option value="solo">Solo Scholar</option>
               {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
             </select>
          </div>
        </div>

        {/* ROW 4: LANGUAGES */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 block text-left">Learning Path</label>
          <div className="grid grid-cols-3 gap-2">
            {['french', 'english', 'both'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setFormData({...formData, targetLanguage: lang as any})}
                className={cn(
                  "py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all border uppercase",
                  formData.targetLanguage === lang 
                    ? "bg-violet-600 border-violet-600 text-white shadow-lg" 
                    : "bg-white border-zinc-200 text-zinc-400 hover:border-violet-200"
                )}
              >
                {lang === 'both' ? 'Both Fr * En' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 5: PASSWORDS */}
        <div className="grid grid-cols-2 gap-4">
          <AcademicInput label="PASSWORD" type="password" placeholder="••••••••" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
          <AcademicInput label="REPEAT" type="password" placeholder="••••••••" value={formData.repeat} onChange={(v: string) => setFormData({...formData, repeat: v})} />
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <p className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full py-5 bg-[#003366] text-white rounded-xl font-black tracking-[0.2em] transition-all text-xs hover:bg-violet-700 shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "ENROLLING..." : "CREATE MASTER PROFILE"}
        </button>

        <div className="text-center">
          <Link href="/login" className="text-[10px] font-black tracking-widest text-zinc-400 hover:text-violet-600 uppercase">
            Member? <span className="text-violet-600 underline underline-offset-4">Login</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

function AcademicInput({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div className="flex flex-col space-y-1.5 group">
      <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 text-left">{label}</label>
      <input 
        type={type}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
        className="border border-zinc-300 bg-zinc-50 rounded-xl px-4 py-3 focus:border-violet-600 outline-none transition-all text-xs font-bold text-[#003366] placeholder:text-zinc-300"
        placeholder={placeholder}
      />
    </div>
  );
}