"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Globe, Zap, Lock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "circOut" as const },
  }),
};

export function FooterSection({ lang = "en" }: { lang?: "en" | "fr" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const t = {
    tagline:
      lang === "fr"
        ? "Language Mastery Lab — la plateforme d'intelligence collective pour les apprenants de langues en Afrique et dans le monde."
        : "Language Mastery Lab — the collective intelligence platform for language learners across Africa and the world.",
    vision: lang === "fr" ? "Notre Vision" : "Our Vision",
    visionText:
      lang === "fr"
        ? "Un monde où les barrières linguistiques ne limitent plus le potentiel humain. Nous imaginons chaque individu capable de se connecter, de créer et de diriger dans n'importe quelle langue."
        : "A world where language barriers no longer limit human potential. We envision every individual empowered to connect, create, and lead in any language — through the transformative power of collective learning.",
    mission: lang === "fr" ? "Notre Mission" : "Our Mission",
    missionText:
      lang === "fr"
        ? "Accélérer la maîtrise des langues en combinant enseignement expert, responsabilité collective et outils intelligents — rendant la fluidité 5× plus rapide que l'étude solo traditionnelle."
        : "To accelerate language mastery by combining expert tuition, peer accountability, and intelligent tools within organisations — making fluency achievable 5× faster than traditional solo study.",
    confidentiality: lang === "fr" ? "Confidentialité" : "Confidentiality",
    bulletA:
      lang === "fr"
        ? "Vos données personnelles et votre progression sont chiffrées et jamais partagées avec des tiers."
        : "Your personal data and learning progress are encrypted and never shared with third parties.",
    bulletB:
      lang === "fr"
        ? "Les données d'organisation sont isolées par Row-Level Security. Zéro fuite inter-org."
        : "Organisation data is isolated with Row-Level Security. Zero cross-org data leakage.",
    bulletC:
      lang === "fr"
        ? "Vous pouvez demander la suppression complète de votre compte à tout moment."
        : "You may request full deletion of your account and data at any time.",
    copyright:
      lang === "fr"
        ? "© 2026 LML — Language Mastery Lab. Tous droits réservés."
        : "© 2026 LML — Language Mastery Lab. All rights reserved.",
    privacy: lang === "fr" ? "Politique de Confidentialité" : "Privacy Policy",
    terms: lang === "fr" ? "Conditions d'Utilisation" : "Terms of Use",
    blog: "Blog",
    login: lang === "fr" ? "Connexion" : "Login",
    signUp: lang === "fr" ? "Inscription" : "Sign Up",
  };

  const columns = [
    {
      id: "brand",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-500/30">
              L
            </div>
            <span className="text-xl font-black tracking-tighter">
              LML<span className="text-violet-500">.</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{t.tagline}</p>
          <div className="flex flex-wrap gap-4 pt-1">
            {[
              { label: t.blog, href: "/blog" },
              { label: t.login, href: "/auth/login" },
              { label: t.signUp, href: "/auth/sign-up" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "vision",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-violet-400" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-widest">{t.vision}</h4>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{t.visionText}</p>
        </div>
      ),
    },
    {
      id: "mission",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-widest">{t.mission}</h4>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{t.missionText}</p>
        </div>
      ),
    },
    {
      id: "confidentiality",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-widest">{t.confidentiality}</h4>
          </div>
          <ul className="text-slate-400 text-xs leading-relaxed space-y-2">
            {[t.bulletA, t.bulletB, t.bulletC].map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <footer ref={ref} className="relative z-10 bg-slate-950 text-white mt-auto overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {columns.map((col, i) => (
          <motion.div
            key={col.id}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {col.content}
          </motion.div>
        ))}
      </div>

      {/* Bottom bar */}
      <motion.div
        className="border-t border-white/5"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-600 text-[10px] tracking-[0.2em] uppercase font-bold">
            {t.copyright}
          </p>
          <div className="flex gap-6 text-[10px] font-black tracking-widest text-slate-600 uppercase">
            <span className="hover:text-violet-400 cursor-pointer transition-colors">{t.privacy}</span>
            <span className="hover:text-violet-400 cursor-pointer transition-colors">{t.terms}</span>
            <Link href="/blog" className="hover:text-violet-400 transition-colors">{t.blog}</Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
