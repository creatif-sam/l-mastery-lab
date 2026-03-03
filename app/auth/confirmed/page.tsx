import Link from "next/link";
import { CheckCircle2, ArrowRight, LogIn } from "lucide-react";

export default function ConfirmedPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* HEADER */}
      <header className="w-full bg-white border-b border-zinc-100 shadow-sm px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#003366]">
          LML<span className="text-violet-600">.</span>
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-500 uppercase hover:text-violet-600 transition-colors"
        >
          Login <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-8">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-[#003366] tracking-tight">
              Email confirmed<span className="text-violet-600">.</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              Your account is now active. Welcome to Language Mastery Lab —
              your fluency journey starts right now.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-zinc-200" />

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white rounded font-black tracking-[0.2em] text-xs transition-all shadow-xl shadow-violet-200"
            >
              <LogIn className="w-4 h-4" />
              GO TO LOGIN
            </Link>
            <Link
              href="/"
              className="block w-full py-3 border border-zinc-200 bg-white hover:border-violet-300 text-zinc-500 hover:text-violet-600 rounded font-black tracking-[0.15em] text-xs transition-all"
            >
              BACK TO HOME
            </Link>
          </div>

          <p className="text-[10px] font-medium text-zinc-400">
            If you didn&apos;t create this account, you can safely ignore this page.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-zinc-100 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            © 2026 Language Mastery Lab — All rights reserved
          </span>
          <div className="flex items-center gap-6">
            <Link href="/learn-more" className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors">About</Link>
            <Link href="/blog" className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors">Blog</Link>
            <Link href="/auth/login" className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
