"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, Check, ChevronDown } from "lucide-react";

type Lang = "en" | "fr";

interface LanguageSwitcherProps {
  onLanguageChange: (lang: Lang) => void;
}

// Maps ISO country codes to preferred language
const FRENCH_COUNTRIES = new Set([
  "FR", "BE", "CH", "LU", "MC", "SN", "CI", "ML", "BF",
  "NE", "TD", "CM", "CF", "CG", "CD", "GA", "GQ", "DJ",
  "KM", "MG", "MU", "SC", "TN", "MA", "DZ", "BJ", "TG",
  "GN", "RW", "BI", "HT", "VU", "PF", "NC",
]);

function detectLangFromCountry(countryCode: string): Lang {
  return FRENCH_COUNTRIES.has(countryCode.toUpperCase()) ? "fr" : "en";
}

const COUNTRY_NAMES: Record<string, string> = {
  FR: "France", BE: "Belgium", CH: "Switzerland", SN: "Senegal",
  CI: "Côte d'Ivoire", CM: "Cameroon", MA: "Morocco", DZ: "Algeria",
  TN: "Tunisia", CD: "DR Congo", CG: "Republic of Congo", GA: "Gabon",
  ML: "Mali", BF: "Burkina Faso", NE: "Niger", TD: "Chad",
  MG: "Madagascar", HT: "Haiti", RW: "Rwanda", GN: "Guinea",
  US: "United States", GB: "United Kingdom", NG: "Nigeria",
  GH: "Ghana", KE: "Kenya", ZA: "South Africa", EG: "Egypt",
};

export function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const [lang, setLang] = useState<Lang>("en");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [detectedLang, setDetectedLang] = useState<Lang>("en");

  // Detect location on mount
  useEffect(() => {
    const stored = localStorage.getItem("lml_lang") as Lang | null;
    if (stored) {
      setLang(stored);
      onLanguageChange(stored);
      return;
    }

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        const code: string = data.country_code || "US";
        const name: string =
          COUNTRY_NAMES[code] || data.country_name || code;
        const suggested = detectLangFromCountry(code);
        setCountryCode(code);
        setCountryName(name);
        setDetectedLang(suggested);

        // Only show prompt if suggested language differs from default (en)
        if (suggested === "fr") {
          setTimeout(() => setShowPrompt(true), 1200);
        }
      })
      .catch(() => {
        // silently fail — stay on English
      });
  }, []);

  const applyLang = useCallback(
    (chosen: Lang) => {
      setLang(chosen);
      onLanguageChange(chosen);
      localStorage.setItem("lml_lang", chosen);
      setShowPrompt(false);
      setShowPicker(false);
    },
    [onLanguageChange]
  );

  const dismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem("lml_lang", "en");
  };

  const promptText = {
    heading: `We noticed you're browsing from ${countryName ?? "your region"}.`,
    body: `The primary language in ${countryName ?? "your country"} is French. Would you like to continue in French?`,
    confirm: "Continue in French",
    decline: "Keep English",
  };

  return (
    <>
      {/* === GEO-DETECTION PROMPT === */}
      <AnimatePresence>
        {showPrompt && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100vw-32px)] max-w-sm"
          >
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-violet-100 dark:bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Language Detected
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {promptText.heading}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {promptText.body}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => applyLang("fr")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black tracking-widest rounded-xl transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  {promptText.confirm}
                </button>
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 text-[11px] font-black tracking-widest rounded-xl transition-all active:scale-95"
                >
                  {promptText.decline}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === FLOATING TOGGLE (always visible) === */}
      <div className="fixed top-[72px] right-4 z-[150]">
        <div className="relative">
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-black/70 border border-slate-200 dark:border-white/10 backdrop-blur-md rounded-full shadow-lg text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-violet-500" />
            <span>{lang === "en" ? "🇬🇧 EN" : "🇫🇷 FR"}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showPicker ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full mt-2 right-0 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[130px]"
              >
                {(
                  [
                    { code: "en" as Lang, flag: "🇬🇧", label: "English" },
                    { code: "fr" as Lang, flag: "🇫🇷", label: "Français" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.code}
                    onClick={() => applyLang(option.code)}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-[11px] font-black tracking-widest transition-colors ${
                      lang === option.code
                        ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {lang === option.code && (
                      <Check className="w-3 h-3 shrink-0" />
                    )}
                    {lang !== option.code && (
                      <span className="w-3 h-3 shrink-0" />
                    )}
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
