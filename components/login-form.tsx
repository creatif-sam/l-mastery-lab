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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/protected/student-board");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-8", className)} {...props}>
      <header className="space-y-2 text-left">
        <h1 className="text-4xl font-black text-[#003366] tracking-tight italic">
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
                className="h-14 pl-12 border-zinc-300 bg-zinc-50 rounded-xl focus:border-violet-600 focus:bg-white transition-all font-bold text-xs text-[#003366]"
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
                className="h-14 pl-12 pr-12 border-zinc-300 bg-zinc-50 rounded-xl focus:border-violet-600 focus:bg-white transition-all font-bold text-xs text-[#003366]"
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
          className="w-full h-14 bg-[#003366] hover:bg-violet-700 text-white rounded-xl font-black tracking-[0.2em] text-xs transition-all shadow-xl active:scale-[0.98]" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ENTER THE LAB"}
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