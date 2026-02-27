"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * CopyProtection
 * ─────────────
 * Mounts on the student-board layout and:
 *  • Blocks text selection / copy via CSS + clipboard event
 *  • Blocks right-click context menu
 *  • Blocks common keyboard screenshot / save shortcuts
 *  • Shows a Sonner toast so the student understands why
 *  • Applies a CSS class that hides content in print / screen-capture
 *    media (best-effort; OS-level captures cannot be blocked in a browser)
 */
export function CopyProtection() {
  useEffect(() => {
    const TOAST_ID = "copy-protection";

    // ── 1. Block copy / cut events ──────────────────────────────────────
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Copying is not allowed", {
        id: TOAST_ID,
        description:
          "You cannot copy content to translate it. Please practise reading and understanding directly.",
        duration: 4000,
      });
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Cutting is not allowed", {
        id: TOAST_ID,
        description: "You cannot cut content from this page.",
        duration: 4000,
      });
    };

    // ── 2. Block right-click ────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Right-click is disabled", {
        id: TOAST_ID,
        description:
          "Right-clicking is not allowed on student pages to protect learning content.",
        duration: 3000,
      });
    };

    // ── 3. Block keyboard shortcuts ─────────────────────────────────────
    const BLOCKED_COMBOS: Array<{ key: string; ctrl?: boolean; shift?: boolean; meta?: boolean }> = [
      { key: "c",          ctrl: true  },   // Ctrl+C  – copy
      { key: "u",          ctrl: true  },   // Ctrl+U  – view source
      { key: "s",          ctrl: true  },   // Ctrl+S  – save page
      { key: "a",          ctrl: true  },   // Ctrl+A  – select all
      { key: "p",          ctrl: true  },   // Ctrl+P  – print
      { key: "PrintScreen"             },   // PrtSc
      { key: "F12"                     },   // DevTools
      { key: "i",          ctrl: true, shift: true  }, // Ctrl+Shift+I DevTools
      { key: "j",          ctrl: true, shift: true  }, // Ctrl+Shift+J Console
      { key: "s",          ctrl: true, shift: true  }, // Ctrl+Shift+S screenshot (some browsers)
      { key: "c",          meta: true  },   // Cmd+C   macOS copy
      { key: "a",          meta: true  },   // Cmd+A   macOS select all
      { key: "s",          meta: true  },   // Cmd+S   macOS save
      { key: "p",          meta: true  },   // Cmd+P   macOS print
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      const matched = BLOCKED_COMBOS.some(({ key, ctrl, shift, meta }) => {
        const keyMatch = e.key.toLowerCase() === key.toLowerCase();
        const ctrlMatch  = ctrl  ? (e.ctrlKey  || e.metaKey) : true;
        const shiftMatch = shift ? e.shiftKey : !shift ? true : !e.shiftKey;
        const metaMatch  = meta  ? e.metaKey  : true;

        // For simple (non-combo) keys, only match when no modifiers expected
        if (!ctrl && !shift && !meta) {
          return keyMatch && !e.ctrlKey && !e.metaKey && !e.altKey;
        }

        return keyMatch && ctrlMatch && shiftMatch && metaMatch;
      });

      if (matched) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Action not allowed", {
          id: TOAST_ID,
          description:
            "Copying, saving or taking screenshots of learning content is not permitted. Engage with the material directly!",
          duration: 4000,
        });
      }
    };

    // ── 4. Disable drag-to-copy ─────────────────────────────────────────
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // ── 5. Add CSS to body so selection is visually blocked ─────────────
    document.body.classList.add("copy-protected");

    document.addEventListener("copy",        handleCopy);
    document.addEventListener("cut",         handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown",     handleKeyDown, true);
    document.addEventListener("dragstart",   handleDragStart);

    return () => {
      document.body.classList.remove("copy-protected");
      document.removeEventListener("copy",        handleCopy);
      document.removeEventListener("cut",         handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown",     handleKeyDown, true);
      document.removeEventListener("dragstart",   handleDragStart);
    };
  }, []);

  // Nothing rendered – purely side-effect component
  return null;
}
