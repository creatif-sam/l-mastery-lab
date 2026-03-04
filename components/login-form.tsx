"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Added Eye icons
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Visibility state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Fetch role and redirect accordingly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "admin") {
        router.push("/protected/admin");
      } else if (profile?.role === "tutor") {
        router.push("/protected/tutor");
      } else {
        router.push("/protected/student-board");
      }
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-8", className)} {...props}>
      <header className="space-y-2 text-left">
        <h1 className="text-4xl font-black text-[#003366] tracking-tight">
          Login<span className="text-violet-600">.</span>
        </h1>
        <p className="text-zinc-400 text-sm font-medium">
          Enter your credentials to access the Lab.
        </p>
      </header>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
          {/* Email */}
          <div className="flex flex-col space-y-1.5 group">
            <Label htmlFor="email" className="text-[10px] font-black tracking-widest text-[#003366] uppercase ml-3 opacity-70 group-focus-within:opacity-100 transition-opacity">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                className="h-11 pl-12 border-zinc-300 bg-zinc-50 rounded-xl focus:border-violet-600 focus:bg-white transition-all font-bold text-xs text-[#003366]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div className="flex flex-col space-y-1.5 group">
            <div className="flex justify-between items-center px-3">
              <Label htmlFor="password" className="text-[10px] font-black tracking-widest text-[#003366] uppercase opacity-70 group-focus-within:opacity-100 transition-opacity">
                Password
              </Label>
              <Link href="/auth/forgot-password" className="text-[10px] font-black text-violet-600 hover:text-violet-700 tracking-widest uppercase">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="h-11 pl-12 pr-12 border-zinc-300 bg-zinc-50 rounded-xl focus:border-violet-600 focus:bg-white transition-all font-bold text-xs text-[#003366]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Eye Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-1">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider text-center">{error}</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded font-black tracking-[0.2em] text-xs transition-all shadow-xl active:scale-[0.98]" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ENTER THE LAB"}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-zinc-200"></div>
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Or</span>
          <div className="flex-1 h-px bg-zinc-200"></div>
        </div>

        {/* Google Sign-In */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-2 border-zinc-300 hover:border-violet-600 hover:bg-violet-50 rounded font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            setError(null);
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            });
            if (error) {
              setError(error.message);
              setIsLoading(false);
            }
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-zinc-700 font-black tracking-wide">Continue with Google</span>
        </Button>

        <div className="text-center pt-2">
          <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            New here?{" "}
            <Link href="/auth/sign-up" className="text-violet-600 underline underline-offset-8 decoration-2 hover:text-violet-700">
              Enroll Now
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}