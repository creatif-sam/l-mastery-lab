"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"; // Added Eye icons

export function SignUpForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    birthCountry: "",
    residenceCountry: "",
    email: "",
    password: "",
    repeat: "",
    orgId: "solo",
    targetLanguage: "french" as const
  });

  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [validFields, setValidFields] = useState({
    fullName: false,
    email: false,
    birthCountry: false,
    residenceCountry: false,
    password: false,
    repeat: false
  });

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await createClient()
        .from('organizations')
        .select('id, name, logo_url');
      if (data) setOrganizations(data);
    };
    fetchOrgs();
  }, []);

  useEffect(() => {
    setValidFields({
      fullName: formData.fullName.trim().length >= 3,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      birthCountry: formData.birthCountry.trim().length >= 2,
      residenceCountry: formData.residenceCountry.trim().length >= 2,
      password: formData.password.length >= 8,
      repeat: formData.repeat === formData.password && formData.repeat.length >= 8
    });
  }, [formData]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!Object.values(validFields).every(Boolean)) {
      setError("Please ensure all fields are correctly filled.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
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
      router.push("/auth/sign-up-success");
    }
  };

  const getLogoUrl = (path: string) => 
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${path}`;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 space-y-8 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tight italic">
          Sign Up<span className="text-violet-600">.</span>
        </h1>
        <p className="text-zinc-400 text-sm font-medium">Start your mastery journey with some facts about you.</p>
      </header>

      <form onSubmit={handleSignUp} className="space-y-6">
        {/* ROW 1: Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AcademicInput 
            label="Full Name" 
            placeholder="e.g. Samuel Bright" 
            value={formData.fullName} 
            isValid={validFields.fullName}
            onChange={(v: string) => setFormData({...formData, fullName: v})} 
          />
          <AcademicInput 
            label="Email Address" 
            placeholder="email@example.com" 
            value={formData.email} 
            isValid={validFields.email}
            onChange={(v: string) => setFormData({...formData, email: v})} 
          />
        </div>

        {/* ROW 2: Origins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AcademicInput 
            label="Country of Birth" 
            placeholder="Ghana,Nigeria..." 
            value={formData.birthCountry} 
            isValid={validFields.birthCountry}
            onChange={(v: string) => setFormData({...formData, birthCountry: v})} 
          />
          <AcademicInput 
            label="Country of Residence" 
            placeholder="Morocco,France,Belgium..." 
            value={formData.residenceCountry} 
            isValid={validFields.residenceCountry}
            onChange={(v: string) => setFormData({...formData, residenceCountry: v})} 
          />
        </div>

        {/* ROW 3: Organization Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 block">Organization</label>
          <div className="flex items-center gap-3 border border-zinc-300 rounded-xl px-4 py-3.5 bg-zinc-50 focus-within:border-violet-600 focus-within:bg-white transition-all shadow-sm">
             {formData.orgId !== "solo" && (
               <div className="w-5 h-5 shrink-0 rounded overflow-hidden border border-zinc-200 bg-white relative">
                  <Image 
                    src={getLogoUrl(organizations.find(o => o.id === formData.orgId)?.logo_url || '')} 
                    alt="Logo" fill className="object-cover" 
                  />
               </div>
             )}
             <select 
              className="w-full bg-transparent outline-none text-xs font-bold text-[#003366] appearance-none cursor-pointer"
              value={formData.orgId}
              onChange={(e) => setFormData({...formData, orgId: e.target.value})}
             >
               <option value="solo">Solo Scholar</option>
               {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
             </select>
          </div>
        </div>

        {/* ROW 4: Learning Path */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 block">Learning Path</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {['french', 'english', 'both'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setFormData({...formData, targetLanguage: lang as any})}
                className={cn(
                  "py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border uppercase",
                  formData.targetLanguage === lang 
                    ? "bg-violet-600 border-violet-600 text-white shadow-lg" 
                    : "bg-white border-zinc-200 text-zinc-400 hover:border-violet-200"
                )}
              >
                {lang === 'both' ? 'Both Fr • En' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 5: Security with Visibility Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AcademicInput 
            label="Password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Min. 8 characters" 
            value={formData.password} 
            isValid={validFields.password}
            showToggle
            isToggled={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            onChange={(v: string) => setFormData({...formData, password: v})} 
          />
          <AcademicInput 
            label="Repeat Password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Confirm password" 
            value={formData.repeat} 
            isValid={validFields.repeat}
            showToggle
            isToggled={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            onChange={(v: string) => setFormData({...formData, repeat: v})} 
          />
        </div>

        {error && (
          <div className="text-[10px] font-bold text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full py-5 bg-[#003366] text-white rounded-xl font-black tracking-[0.2em] transition-all text-xs hover:bg-violet-700 shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "ENROLLING..." : "CREATE MASTER PROFILE"}
        </button>

        <div className="text-center pt-2">
          <Link href="/auth/login" className="text-[10px] font-black tracking-widest text-zinc-400 hover:text-violet-600 uppercase transition-colors">
            Member? <span className="text-violet-600 underline underline-offset-8 decoration-2">Login</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

// Reusable Input Component with Validation State & Visibility Toggle
function AcademicInput({ 
  label, value, onChange, placeholder, isValid, type = "text", 
  showToggle, isToggled, onToggle 
}: any) {
  return (
    <div className="flex flex-col space-y-1.5 group relative">
      <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 text-left opacity-70 group-focus-within:opacity-100 transition-opacity">
        {label}
      </label>
      <div className="relative">
        <input 
          type={type}
          value={value}
          required
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full border bg-zinc-50 rounded-xl px-4 py-3.5 pr-12 outline-none transition-all text-xs font-bold text-[#003366] placeholder:text-zinc-300 shadow-sm",
            isValid 
              ? "border-emerald-500 bg-emerald-50/20" 
              : "border-zinc-300 focus:border-violet-600 focus:bg-white"
          )}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showToggle && (
            <button 
              type="button"
              onClick={onToggle}
              className="p-1 hover:bg-zinc-200 rounded-md transition-colors text-zinc-400 hover:text-violet-600"
            >
              {isToggled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {isValid && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in" />
          )}
        </div>
      </div>
    </div>
  );
}