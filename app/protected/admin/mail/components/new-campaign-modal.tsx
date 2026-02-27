"use client";

import { useState } from "react";
import { Users, Mail, BookOpen, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Template = { id: string; name: string; category: string; subject: string; body: string };
type User = { id: string; full_name: string; role: string; target_language?: string };

interface NewCampaignModalProps {
  templates: Template[];
  allUsers: User[];
  onClose: () => void;
  onCreated: (campaign: any) => void;
}

export function NewCampaignModal({ templates, allUsers, onClose, onCreated }: NewCampaignModalProps) {
  const supabase = createClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipientType, setRecipientType] = useState<"custom" | "newsletter" | "students" | "tutors" | "all">("custom");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSelectTemplate = (tmpl: Template) => {
    setSelectedTemplate(tmpl);
    setSubject(tmpl.subject);
    setBody(tmpl.body);
  };

  const getRecipientCount = () => {
    if (recipientType === "custom") return customEmails.split(",").filter((e) => e.trim()).length;
    if (recipientType === "all") return allUsers.length;
    if (recipientType === "students") return allUsers.filter((u) => u.role === "student").length;
    if (recipientType === "tutors") return allUsers.filter((u) => u.role === "tutor").length;
    return 0;
  };

  const handleSaveDraft = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body are required"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("email_campaigns").insert([{
      subject,
      body,
      recipient_type: recipientType,
      custom_emails: recipientType === "custom" ? customEmails : null,
      status: "draft",
      recipients_count: getRecipientCount(),
    }]).select().single();
    setSaving(false);
    if (error) { toast.error("Failed to save draft"); return; }
    onCreated(data);
    toast.success("Draft saved!");
    onClose();
  };

  const recipientOptions = [
    { value: "custom", label: "Custom", icon: Mail, desc: "Enter specific email addresses" },
    { value: "newsletter", label: "Newsletter", icon: BookOpen, desc: "Newsletter subscribers" },
    { value: "students", label: "Students", icon: Users, desc: "All enrolled students" },
    { value: "tutors", label: "Tutors", icon: UserCheck, desc: "All platform tutors" },
    { value: "all", label: "All Users", icon: Users, desc: "Every registered user" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white text-xl">New Email Campaign</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Load from template */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Load from Template (Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`text-left p-3 rounded-xl border transition-all ${selectedTemplate?.id === t.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30"}`}
                >
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{t.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">{t.category}</p>
                </button>
              ))}
              {templates.length === 0 && (
                <p className="text-slate-400 text-sm col-span-2">No templates saved yet</p>
              )}
            </div>
          </div>

          {/* Send To */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Send To</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recipientOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRecipientType(opt.value as any)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${recipientType === opt.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300 dark:hover:border-white/10"}`}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
            {recipientType === "custom" && (
              <div className="mt-3">
                <p className="text-xs text-amber-500 font-medium mb-1.5">✏ Enter specific email addresses (comma-separated) below</p>
                <input
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none"
                />
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your email subject..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Body (HTML supported)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="<p>Hello {{name}},</p><p>Your message here...</p>"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none resize-none font-mono"
            />
            <p className="text-xs text-slate-400 mt-1.5">Use {'{{name}}'} for recipient name. Estimated recipients: <span className="font-semibold text-indigo-500">{getRecipientCount()}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-white/5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-500/25 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
