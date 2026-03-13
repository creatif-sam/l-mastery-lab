"use client";

import { Printer } from "lucide-react";

export function PdfExportButton() {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-[11px] font-black uppercase tracking-widest rounded-full transition-colors print:hidden shadow-sm"
      >
        <Printer className="w-3.5 h-3.5" />
        Export PDF
      </button>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          main, main * { visibility: visible !important; }
          main { position: absolute; top: 0; left: 0; width: 100%; }
          nav, aside, header { display: none !important; }
        }
      `}</style>
    </>
  );
}
