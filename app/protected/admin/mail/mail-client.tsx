"use client";

import { useState } from "react";
import { Mail, FileText, Plus, Send, Clock, Eye, Trash2, BarChart2, Users, BookOpen, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { NewCampaignModal } from "./components/new-campaign-modal";
import { format } from "date-fns";

type Campaign = {
  id: string;
  subject: string;
  recipient_type: string;
  custom_emails?: string | null;
  status: string;
  recipients_count: number;
  created_at: string;
  body: string;
};

type Template = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  created_at: string;
};

type User = { id: string; full_name: string; role: string; target_language?: string };

interface MailClientProps {
  initialCampaigns: Campaign[];
  initialTemplates: Template[];
  stats: { total: number; drafts: number; sent: number; totalEmailsSent: number };
  allUsers: User[];
}

export function MailClient({ initialCampaigns, initialTemplates, stats, allUsers }: MailClientProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");
  const [campaignFilter, setCampaignFilter] = useState<"all" | "draft" | "sent">("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", category: "announcement", subject: "", body: "" });

  const filteredCampaigns = campaigns.filter((c) =>
    campaignFilter === "all" ? true : c.status === campaignFilter
  );

  const handleDeleteCampaign = async (id: string) => {
    await supabase.from("email_campaigns").delete().eq("id", id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success("Campaign deleted");
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    toast.loading("Sending campaign...", { id: "sending" });
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          subject: campaign.subject,
          body: campaign.body,
          recipientType: campaign.recipient_type,
          customEmails: campaign.custom_emails ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? { ...c, status: "sent", recipients_count: data.count } : c));
      toast.success(`Campaign sent to ${data.count} recipients!`, { id: "sending" });
    } catch (err: any) {
      toast.error(err.message || "Send failed", { id: "sending" });
    }
  };

  const handleSaveTemplate = async () => {
    const { data, error } = await supabase.from("email_templates").insert([newTemplate]).select().single();
    if (error) { toast.error("Failed to save template"); return; }
    setTemplates((prev) => [data, ...prev]);
    setShowNewTemplate(false);
    setNewTemplate({ name: "", category: "announcement", subject: "", body: "" });
    toast.success("Template saved!");
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from("email_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  const onCampaignCreated = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  };

  const recipientBadge = (type: string) => {
    const classes: any = {
      custom: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      newsletter: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
      students: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
      tutors: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      all: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
    };
    return classes[type] || classes.custom;
  };

  const statusBadge = (status: string) =>
    status === "sent"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400";

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: stats.total, icon: Mail, color: "text-slate-600 dark:text-slate-300", numColor: "text-slate-900 dark:text-white" },
          { label: "Draft Campaigns", value: stats.drafts, icon: Clock, color: "text-amber-500", numColor: "text-amber-500" },
          { label: "Sent Campaigns", value: stats.sent, icon: Send, color: "text-emerald-500", numColor: "text-emerald-500" },
          { label: "Total Emails Sent", value: stats.totalEmailsSent, icon: BarChart2, color: "text-blue-500", numColor: "text-blue-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-3xl font-black ${s.numColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-white/5">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === "campaigns" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <Mail size={15} /> Email Campaigns
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === "templates" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <FileText size={15} /> Email Templates ({templates.length})
          </button>
        </div>

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div>
            <div className="flex items-center justify-between p-4 flex-wrap gap-3">
              <div className="flex gap-2">
                {(["all", "draft", "sent"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCampaignFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${campaignFilter === f ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowNewCampaign(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-500/25"
              >
                <Plus size={14} /> New Campaign
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-white/5">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Subject</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Recipient Type</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Recipients</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden xl:table-cell">Created</th>
                    <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 max-w-xs">
                        <p className="font-medium text-slate-800 dark:text-white truncate">{c.subject}</p>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${recipientBadge(c.recipient_type)}`}>
                          {c.recipient_type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${statusBadge(c.status)}`}>
                          {c.status === "sent" ? <Send size={9} /> : <Clock size={9} />}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-slate-500">{c.recipients_count || "—"}</td>
                      <td className="px-5 py-3 hidden xl:table-cell text-slate-500 text-xs">
                        {format(new Date(c.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setPreviewCampaign(c)} className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Preview">
                            <Eye size={12} />
                          </button>
                          {c.status === "draft" && (
                            <button onClick={() => handleSendCampaign(c)} className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors" title="Send now">
                              <Send size={12} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteCampaign(c.id)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors" title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                        No campaigns yet. <button onClick={() => setShowNewCampaign(true)} className="text-indigo-500 font-medium hover:underline">Create one →</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div>
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-slate-500">{templates.length} template{templates.length !== 1 ? "s" : ""} available</p>
              <button
                onClick={() => setShowNewTemplate(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus size={14} /> New Template
              </button>
            </div>
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <div key={t.id} className="border border-slate-200 dark:border-white/5 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{t.name}</p>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium capitalize">{t.category}</span>
                    </div>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{t.subject}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.body?.replace(/<[^>]*>/g, "")}</p>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-400 text-sm">No templates yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <NewCampaignModal
          templates={templates}
          allUsers={allUsers}
          onClose={() => setShowNewCampaign(false)}
          onCreated={onCampaignCreated}
        />
      )}

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-5">New Email Template</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Template Name</label>
                <input value={newTemplate.name} onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none" placeholder="e.g. Welcome Email" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                <select value={newTemplate.category} onChange={(e) => setNewTemplate((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none">
                  <option value="announcement">Announcement</option>
                  <option value="welcome">Welcome</option>
                  <option value="reminder">Reminder</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email Subject</label>
                <input value={newTemplate.subject} onChange={(e) => setNewTemplate((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none" placeholder="Email subject line" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Body (HTML or plain text)</label>
                <textarea value={newTemplate.body} onChange={(e) => setNewTemplate((p) => ({ ...p, body: e.target.value }))}
                  rows={8}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none resize-none font-mono"
                  placeholder="<p>Hello {{name}},</p><p>Your content here...</p>" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNewTemplate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400">Cancel</button>
              <button onClick={handleSaveTemplate} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Save Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{previewCampaign.subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${recipientBadge(previewCampaign.recipient_type)}`}>{previewCampaign.recipient_type}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusBadge(previewCampaign.status)}`}>{previewCampaign.status}</span>
                </div>
              </div>
              <button onClick={() => setPreviewCampaign(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {previewCampaign.body || "No content"}
            </div>
            <button onClick={() => setPreviewCampaign(null)} className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
