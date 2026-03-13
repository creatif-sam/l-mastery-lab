"use client";

import { useState } from "react";
import { Video, Save, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SiteConfigFormProps {
  currentVideoUrl: string | null;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function SiteConfigForm({ currentVideoUrl }: SiteConfigFormProps) {
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl ?? "");
  const [saving, setSaving] = useState(false);

  const videoId = extractYouTubeId(videoUrl);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "onboarding_video_url", value: videoUrl.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      toast.success("Video URL saved! It will appear on the home page.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not save configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-white/5">
        <div className="w-9 h-9 bg-rose-500/10 rounded-xl flex items-center justify-center">
          <Video className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Home Page Video</h3>
          <p className="text-xs text-slate-400 mt-0.5">Paste a YouTube URL to show an onboarding video on the public home page</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex gap-3">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {videoId && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview</p>
            <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Onboarding video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Open on YouTube
            </a>
          </div>
        )}

        {videoUrl && !videoId && (
          <p className="text-xs text-amber-500 font-medium">⚠ Could not extract a valid YouTube video ID from this URL.</p>
        )}

        {!videoUrl && (
          <p className="text-xs text-slate-400 italic">No video set — the home page will show the animation section instead.</p>
        )}
      </div>
    </div>
  );
}
