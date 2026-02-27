import { ForgotPasswordForm } from "@/components/forgot-password-form";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* NAV */}
      <header className="w-full bg-white border-b border-zinc-100 shadow-sm px-6 md:px-12 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#003366]">
            LML<span className="text-violet-600">.</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-[10px] font-black tracking-widest text-zinc-500 hover:text-[#003366] uppercase transition-colors"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="text-[10px] font-black tracking-widest text-zinc-500 hover:text-violet-600 uppercase transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/auth/login"
              className="text-[10px] font-black tracking-widest text-zinc-500 hover:text-violet-600 uppercase transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-4 py-2 bg-[#003366] text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-violet-700 transition-all active:scale-95"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-zinc-100 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            © 2026 Language Mastery Lab — All rights reserved
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/auth/login"
              className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/sign-up"
              className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
