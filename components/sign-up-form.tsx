"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Loader2, Eye, EyeOff,
  ArrowRight, ArrowLeft, User, MapPin, Home,
  Building2, BookOpen, Mail, Lock,
} from "lucide-react";

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "fullName",
    icon: "👋",
    question: "What's your name?",
    tip: "Your tutor and fellow learners will use your name to address you in sessions and on the leaderboard. A first name is enough — just make it recognisable.",
    inputLabel: "Full name",
    placeholder: "e.g. Samuel Bright",
    type: "text",
    InputIcon: User,
  },
  {
    key: "email",
    icon: "📧",
    question: "What's your email address?",
    tip: "We'll send a confirmation link here to activate your account. It also becomes your login — no username to remember.",
    inputLabel: "Email address",
    placeholder: "name@example.com",
    type: "email",
    InputIcon: Mail,
  },
  {
    key: "birthCountry",
    icon: "🌍",
    question: "Where were you born?",
    tip: "Your country of origin gives tutors cultural context that makes lessons far more personal and effective. It also helps us pair you with learners who share your background.",
    inputLabel: "Country of birth",
    placeholder: "e.g. Ghana, Nigeria, Senegal…",
    type: "text",
    InputIcon: MapPin,
  },
  {
    key: "residenceCountry",
    icon: "🏠",
    question: "Where do you live now?",
    tip: "Knowing where you currently live helps us schedule sessions in your time zone and suggest language contexts relevant to your daily life.",
    inputLabel: "Country of residence",
    placeholder: "e.g. France, Belgium, Morocco…",
    type: "text",
    InputIcon: Home,
  },
  {
    key: "orgId",
    icon: "🏛️",
    question: "Are you part of an organisation?",
    tip: "Many companies and schools use LML to upskill their teams together. Joining your org's group means shared progress, group challenges, and a dedicated tutor. Prefer to go solo? That's totally fine too.",
    inputLabel: null, // handled as custom select
    InputIcon: Building2,
  },
  {
    key: "targetLanguage",
    icon: "🎯",
    question: "What do you want to master?",
    tip: "Choose the language — or both — that you're committed to mastering. You can update this later from your settings.",
    inputLabel: null, // handled as choice buttons
    InputIcon: BookOpen,
  },
  {
    key: "password",
    icon: "🔒",
    question: "Create your password",
    tip: "Use at least 8 characters. A mix of letters, numbers, and symbols makes it much harder to crack. Your data is always encrypted on our end.",
    inputLabel: "Password",
    placeholder: "Min. 8 characters",
    type: "password",
    InputIcon: Lock,
  },
  {
    key: "repeat",
    icon: "✅",
    question: "Confirm your password",
    tip: "Just type your password once more so we're sure there are no typos. You don't want to be locked out on day one!",
    inputLabel: "Repeat password",
    placeholder: "Same password again",
    type: "password",
    InputIcon: Lock,
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];
type Lang = "french" | "english" | "both";

// ─── Main component ───────────────────────────────────────────────────────────
export function SignUpForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    birthCountry: "",
    residenceCountry: "",
    orgId: "solo",
    targetLanguage: "french" as Lang,
    password: "",
    repeat: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient()
      .from("organizations")
      .select("id, name, logo_url")
      .then(({ data }) => { if (data) setOrganizations(data); });
  }, []);

  // Auto-focus input when step changes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [step]);

  const getLogoUrl = (path: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${path}`;

  // ── Validation per step ───────────────────────────────────────────────────
  const isStepValid = (s: number): boolean => {
    const key = STEPS[s].key as StepKey;
    switch (key) {
      case "fullName":        return formData.fullName.trim().length >= 3;
      case "email":           return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case "birthCountry":    return formData.birthCountry.trim().length >= 2;
      case "residenceCountry":return formData.residenceCountry.trim().length >= 2;
      case "orgId":           return true; // always has a value
      case "targetLanguage":  return true; // always has a value
      case "password":        return formData.password.length >= 8;
      case "repeat":          return formData.repeat === formData.password && formData.repeat.length >= 8;
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const go = (next: number) => {
    if (animating) return;
    setDirection(next > step ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  };

  const handleNext = () => {
    if (!isStepValid(step)) return;
    if (step < STEPS.length - 1) {
      go(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleNext(); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
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
    if (error) {
      setSubmitError(error.message);
      setIsLoading(false);
    } else {
      router.push("/auth/sign-up-success");
    }
  };

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;
  const valid = isStepValid(step);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0 py-6 flex flex-col min-h-[520px]">

      {/* Progress bar */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            Step {step + 1} of {STEPS.length}
          </span>
          <Link href="/auth/login" className="text-[10px] font-black tracking-widest text-zinc-400 hover:text-violet-600 uppercase transition-colors">
            Have an account? <span className="text-violet-600">Login</span>
          </Link>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <div
        key={step}
        className="flex-1 flex flex-col"
        style={{
          animation: animating
            ? "none"
            : direction === "forward"
            ? "stepIn 0.22s ease both"
            : "stepInBack 0.22s ease both",
        }}
      >
        {/* Icon + question */}
        <div className="mb-6 space-y-3">
          <span className="text-4xl">{current.icon}</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight leading-tight">
            {current.question}
          </h2>
          {/* Tip */}
          <div className="flex gap-2.5 bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
            <span className="text-violet-400 text-xs mt-0.5">💡</span>
            <p className="text-xs text-violet-700 font-medium leading-relaxed">
              {current.tip}
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="flex-1 flex flex-col justify-between gap-6">
          <div>

            {/* ── Text / email / password inputs ── */}
            {"inputLabel" in current && current.inputLabel && (
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-1 opacity-70 group-focus-within:opacity-100 transition-opacity">
                  {current.inputLabel}
                </label>
                <div className="relative">
                  {"InputIcon" in current && (
                    <current.InputIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-violet-600 transition-colors pointer-events-none" />
                  )}
                  <input
                    ref={inputRef}
                    type={
                      current.type === "password"
                        ? showPassword ? "text" : "password"
                        : current.type
                    }
                    value={formData[current.key as keyof typeof formData] as string}
                    onChange={(e) =>
                      setFormData({ ...formData, [current.key]: e.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    placeholder={"placeholder" in current ? current.placeholder : ""}
                    className={cn(
                      "w-full h-12 pl-11 pr-12 border bg-zinc-50 rounded-lg outline-none transition-all text-sm font-bold text-[#003366] placeholder:text-zinc-300 shadow-sm",
                      valid
                        ? "border-emerald-400 bg-emerald-50/30"
                        : "border-zinc-300 focus:border-violet-500 focus:bg-white"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {current.type === "password" && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-zinc-400 hover:text-violet-600 transition-colors"
                      >
                        {showPassword
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    {valid && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                </div>
                {/* Repeat password mismatch hint */}
                {current.key === "repeat" &&
                  formData.repeat.length > 0 &&
                  formData.repeat !== formData.password && (
                  <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
                    Passwords don't match yet.
                  </p>
                )}
              </div>
            )}

            {/* ── Organisation select ── */}
            {current.key === "orgId" && (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {/* Solo option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, orgId: "solo" })}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                      formData.orgId === "solo"
                        ? "border-violet-500 bg-violet-50 shadow"
                        : "border-zinc-200 bg-white hover:border-violet-200"
                    )}
                  >
                    <span className="text-xl">🧑‍💻</span>
                    <div>
                      <p className="text-sm font-black text-[#003366]">Solo Scholar</p>
                      <p className="text-[10px] text-zinc-400 font-medium">Learn independently at your own pace</p>
                    </div>
                    {formData.orgId === "solo" && (
                      <CheckCircle2 className="w-4 h-4 text-violet-500 ml-auto shrink-0" />
                    )}
                  </button>

                  {/* Org options */}
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, orgId: org.id })}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                        formData.orgId === org.id
                          ? "border-violet-500 bg-violet-50 shadow"
                          : "border-zinc-200 bg-white hover:border-violet-200"
                      )}
                    >
                      {org.logo_url ? (
                        <div className="w-7 h-7 shrink-0 rounded overflow-hidden border border-zinc-200 bg-white relative">
                          <Image src={getLogoUrl(org.logo_url)} alt={org.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 shrink-0 rounded bg-violet-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-violet-500" />
                        </div>
                      )}
                      <p className="text-sm font-black text-[#003366]">{org.name}</p>
                      {formData.orgId === org.id && (
                        <CheckCircle2 className="w-4 h-4 text-violet-500 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Language choice ── */}
            {current.key === "targetLanguage" && (
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: "french",  label: "🇫🇷  French",       desc: "Master conversational & professional French" },
                  { value: "english", label: "🇬🇧  English",      desc: "Build fluent, confident English skills" },
                  { value: "both",    label: "🌐  Both Fr • En", desc: "Double your reach — learn both languages" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetLanguage: opt.value as Lang })}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-lg border transition-all text-left",
                      formData.targetLanguage === opt.value
                        ? "border-violet-500 bg-violet-50 shadow"
                        : "border-zinc-200 bg-white hover:border-violet-200"
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-black text-[#003366]">{opt.label}</p>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{opt.desc}</p>
                    </div>
                    {formData.targetLanguage === opt.value && (
                      <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="text-[10px] font-bold text-red-500 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
              {submitError}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="flex items-center gap-1.5 px-5 py-3 border border-zinc-200 rounded font-black text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!valid || isLoading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded font-black tracking-[0.15em] text-xs transition-all shadow-lg active:scale-[0.98]",
                valid && !isLoading
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200"
                  : "bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none"
              )}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> ENROLLING…</>
              ) : step === STEPS.length - 1 ? (
                <><CheckCircle2 className="w-4 h-4" /> CREATE MY PROFILE</>
              ) : (
                <>CONTINUE <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes stepInBack {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}