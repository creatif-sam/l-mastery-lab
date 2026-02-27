import { CopyProtection } from "@/components/copy-protection";

/**
 * Student-board layout
 * ──────────────────────────────────────────────────────────────────────────
 * Wraps every student page with the CopyProtection component so that:
 *  • Text selection and copy/cut are blocked.
 *  • Right-click is blocked.
 *  • Common keyboard shortcuts (Ctrl+C, Ctrl+A, Ctrl+S, PrtSc …) are blocked.
 *  • A Sonner toast informs the student that copying is not allowed.
 *  • Print / print-to-PDF media hides all content.
 */
export default function StudentBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Client-side copy / screenshot protection – no visible DOM output */}
      <CopyProtection />
      {children}
    </>
  );
}
