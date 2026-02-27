"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, AlertCircle, Wrench, HelpCircle, CheckCircle2, ArrowLeft, Send } from "lucide-react";

const CATEGORIES = [
  { value: "technical", label: "Technical Issue", icon: Wrench, color: "text-red-500" },
  { value: "account", label: "Account Help", icon: HelpCircle, color: "text-amber-500" },
  { value: "billing", label: "Billing & Plans", icon: AlertCircle, color: "text-blue-500" },
  { value: "general", label: "General Inquiry", icon: MessageSquare, color: "text-violet-500" },
  { value: "feedback", label: "Feedback", icon: CheckCircle2, color: "text-emerald-500" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "general", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-500/30">L</div>
            <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">LML<span className="text-violet-500">.</span></span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold text-slate-500">
            <Link href="/" className="hover:text-violet-600 transition-colors">Home</Link>
            <Link href="/blog" className="hover:text-violet-600 transition-colors">Blog</Link>
            <Link href="/auth/login" className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors mb-6">
            <ArrowLeft size={12} /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none mb-3">
            Get in <span className="text-violet-600">Touch.</span>
          </h1>
          <p className="text-slate-500 max-w-lg">
            Having a technical issue or a question about LML? We&apos;re here to help. Fill out the form and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm mb-1">Email Support</h3>
              <p className="text-xs text-slate-500 mb-3">Drop us a line directly.</p>
              <a
                href="mailto:lml@gen116.com"
                className="text-violet-600 font-black text-sm hover:underline"
              >
                lml@gen116.com
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm mb-3">Common Topics</h3>
              <ul className="space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c.value} className="flex items-center gap-2 text-xs text-slate-500">
                    <c.icon className={`w-3 h-3 ${c.color}`} />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 text-white">
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Response Time</p>
              <p className="text-2xl font-black">24h</p>
              <p className="text-xs text-slate-400 mt-1">Average reply time for all inquiries</p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="md:col-span-2">
            {status === "success" ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-10 shadow-sm text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Message Received!</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Thanks for reaching out. We&apos;ll reply to <strong>{form.email}</strong> within 24 hours.
                </p>
                <Link
                  href="/"
                  className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Your Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full name"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Category *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                          form.category === c.value
                            ? "border-violet-600 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                            : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <c.icon className={`w-3.5 h-3.5 shrink-0 ${c.color}`} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Subject *</label>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Brief summary of your issue"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Message *</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    rows={5}
                    placeholder="Describe your issue or question in detail..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl">
                    <AlertCircle size={14} /> {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-violet-500/20"
                >
                  {status === "loading" ? "Sending..." : <><Send size={14} /> Send Message</>}
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Or email us directly at{" "}
                  <a href="mailto:lml@gen116.com" className="text-violet-500 font-bold hover:underline">lml@gen116.com</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
