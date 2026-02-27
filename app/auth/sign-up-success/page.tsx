import Link from "next/link";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";

export default function Page() {
  const emailProviders = [
    {
      name: "Gmail",
      url: "https://mail.google.com",
      icon: "G",
      color: "hover:border-red-400 hover:bg-red-50",
      textColor: "text-red-500",
    },
    {
      name: "Outlook",
      url: "https://outlook.live.com/mail",
      icon: "O",
      color: "hover:border-blue-400 hover:bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      name: "Yahoo",
      url: "https://mail.yahoo.com",
      icon: "Y",
      color: "hover:border-purple-400 hover:bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* ---- HEADER ---- */}
      <header className="w-full bg-white border-b border-zinc-100 shadow-sm px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#003366]">
          LML<span className="text-violet-600">.</span>
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-500 uppercase hover:text-violet-600 transition-colors"
        >
          Already verified? <span className="text-violet-600 underline underline-offset-4">Login</span>
        </Link>
      </header>

      {/* ---- MAIN CONTENT ---- */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-violet-600" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-[#003366] tracking-tight italic">
              You&apos;re almost in<span className="text-violet-600">.</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              A confirmation link has been sent to your inbox.
              <br />
              Click it to activate your account and begin your mastery journey.
            </p>
          </div>

          {/* Inbox / Spam reminder */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-left space-y-1">
            <p className="text-[11px] font-black tracking-widest text-amber-700 uppercase">
              📬 Heads up!
            </p>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Can&apos;t find the email? Check your{" "}
              <span className="font-black">Inbox</span> and also your{" "}
              <span className="font-black">Spam / Junk</span> folder — it
              sometimes lands there.
            </p>
          </div>

          {/* Open Mailbox Buttons */}
          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Open your mailbox
            </p>
            <div className="grid grid-cols-3 gap-3">
              {emailProviders.map((provider) => (
                <a
                  key={provider.name}
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-2 py-4 px-3 bg-white border border-zinc-200 rounded-2xl transition-all shadow-sm active:scale-95 ${provider.color}`}
                >
                  <span className={`text-xl font-black ${provider.textColor}`}>
                    {provider.icon}
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                    {provider.name}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Back to home */}
          <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            Wrong email?{" "}
            <Link
              href="/auth/sign-up"
              className="text-violet-600 underline underline-offset-4 hover:text-violet-700 transition-colors"
            >
              Sign up again
            </Link>
          </p>
        </div>
      </main>

      {/* ---- FOOTER ---- */}
      <footer className="w-full bg-white border-t border-zinc-100 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            © 2026 Language Mastery Lab — All rights reserved
          </span>
          <div className="flex items-center gap-6">
            <Link href="/learn-more" className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors">
              About
            </Link>
            <Link href="/blog" className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors">
              Blog
            </Link>
            <Link href="/auth/login" className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-violet-600 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
