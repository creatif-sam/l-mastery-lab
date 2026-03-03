"use client";

import { useState, useRef } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Globe,
  X,
  AlertTriangle,
  FileText,
  Upload,
  ImageOff,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
  member_count: number;
};

type OrgFormData = {
  name: string;
  slug: string;
  logo_url: string;   // final URL — either uploaded or pasted
  description: string;
};

const emptyForm: OrgFormData = { name: "", slug: "", logo_url: "", description: "" };

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── upload a logo file and return its public URL ── */
async function uploadLogo(
  supabase: ReturnType<typeof createClient>,
  file: File,
  orgId: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${orgId}.${ext}`;
  const { error } = await supabase.storage
    .from("org-logos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    toast.error("Logo upload failed: " + error.message);
    return null;
  }
  return supabase.storage.from("org-logos").getPublicUrl(path).data.publicUrl;
}

/* ────────────────────────────────────────────────────── */
export function AdminOrganizationsClient({
  initialOrgs,
}: {
  initialOrgs: Organization[];
}) {
  const supabase = createClient();

  const [orgs, setOrgs] = useState<Organization[]>(initialOrgs);
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);

  const [form, setForm] = useState<OrgFormData>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");   // data-URL of selected file
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      (o.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  /* ─── helpers ─── */
  const resetLogoState = () => { setLogoFile(null); setLogoPreview(""); };

  const handleLogoFileChange = (file: File | null) => {
    setLogoFile(file);
    if (!file) { setLogoPreview(""); return; }
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleNameChange = (value: string) =>
    setForm((prev) => ({ ...prev, name: value, slug: slugify(value) }));

  /* ─── Create ─── */
  const openCreate = () => {
    setForm(emptyForm);
    resetLogoState();
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setIsSaving(true);

    // Insert without logo first so we get the id
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: form.name.trim(),
        slug: form.slug.trim(),
        logo_url: form.logo_url.trim() || null,
        description: form.description.trim() || null,
      })
      .select("id, name, slug, logo_url, description, created_at")
      .single();

    if (error) {
      setIsSaving(false);
      toast.error(error.code === "23505" ? "Slug already taken" : "Failed to create organisation");
      return;
    }

    // Upload logo file if provided
    let finalLogoUrl: string | null = data.logo_url;
    if (logoFile) {
      const uploaded = await uploadLogo(supabase, logoFile, data.id);
      if (uploaded) {
        finalLogoUrl = uploaded;
        await supabase.from("organizations").update({ logo_url: uploaded }).eq("id", data.id);
      }
    }

    setIsSaving(false);
    setOrgs((prev) => [{ ...data, logo_url: finalLogoUrl, member_count: 0 }, ...prev]);
    toast.success(`Organisation "${data.name}" created`);
    setShowCreateModal(false);
    resetLogoState();
  };

  /* ─── Edit ─── */
  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setForm({
      name: org.name,
      slug: org.slug,
      logo_url: org.logo_url ?? "",
      description: org.description ?? "",
    });
    resetLogoState();
  };

  const handleEdit = async () => {
    if (!editingOrg) return;
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setIsSaving(true);

    // Upload new logo file if provided
    let finalLogoUrl: string | null = form.logo_url.trim() || null;
    if (logoFile) {
      const uploaded = await uploadLogo(supabase, logoFile, editingOrg.id);
      if (uploaded) finalLogoUrl = uploaded;
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        name: form.name.trim(),
        slug: form.slug.trim(),
        logo_url: finalLogoUrl,
        description: form.description.trim() || null,
      })
      .eq("id", editingOrg.id);
    setIsSaving(false);

    if (error) {
      toast.error(error.code === "23505" ? "Slug already taken" : "Failed to update organisation");
      return;
    }
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === editingOrg.id
          ? { ...o, name: form.name.trim(), slug: form.slug.trim(), logo_url: finalLogoUrl, description: form.description.trim() || null }
          : o
      )
    );
    toast.success("Organisation updated — members notified");
    setEditingOrg(null);
    resetLogoState();
  };

  /* ─── Delete ─── */
  const handleDelete = async () => {
    if (!deletingOrg) return;
    setIsDeleting(true);
    const { error } = await supabase.from("organizations").delete().eq("id", deletingOrg.id);
    setIsDeleting(false);
    if (error) { toast.error("Failed to delete organisation"); return; }
    setOrgs((prev) => prev.filter((o) => o.id !== deletingOrg.id));
    toast.success(`Organisation "${deletingOrg.name}" deleted`);
    setDeletingOrg(null);
  };

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        {[
          { label: "Total Organisations", value: orgs.length, icon: Building2, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Total Members", value: orgs.reduce((s, o) => s + o.member_count, 0), icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          {
            label: "Avg Members / Org",
            value: orgs.length === 0 ? 0 : Math.round(orgs.reduce((s, o) => s + o.member_count, 0) / orgs.length),
            icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 flex-1">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, slug or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            <Plus size={14} />
            Add Organisation
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Organisation</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Slug</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Description</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Members</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden xl:table-cell">Created</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-800 dark:text-white">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md">{org.slug}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell max-w-[240px]">
                    <span className="text-slate-500 text-xs line-clamp-2">{org.description || "—"}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                      <Users size={10} /> {org.member_count}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden xl:table-cell">
                    <span className="text-slate-400 text-xs">
                      {new Date(org.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(org)} className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors" title="Edit">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeletingOrg(org)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-400 text-sm">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No organisations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <OrgModal
          title="Add Organisation"
          form={form}
          setForm={setForm}
          onNameChange={handleNameChange}
          currentLogoUrl={null}
          logoFile={logoFile}
          logoPreview={logoPreview}
          onLogoFileChange={handleLogoFileChange}
          onConfirm={handleCreate}
          onClose={() => { setShowCreateModal(false); resetLogoState(); }}
          isSaving={isSaving}
          confirmLabel="Create Organisation"
        />
      )}

      {/* Edit Modal */}
      {editingOrg && (
        <OrgModal
          title="Edit Organisation"
          form={form}
          setForm={setForm}
          onNameChange={handleNameChange}
          currentLogoUrl={editingOrg.logo_url}
          logoFile={logoFile}
          logoPreview={logoPreview}
          onLogoFileChange={handleLogoFileChange}
          onConfirm={handleEdit}
          onClose={() => { setEditingOrg(null); resetLogoState(); }}
          isSaving={isSaving}
          confirmLabel="Save Changes"
        />
      )}

      {/* Delete Confirm */}
      {deletingOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Organisation</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{deletingOrg.name}</span>?{" "}
              Members will have their <span className="font-semibold">organisation_id</span> set to null.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingOrg(null)} disabled={isDeleting} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   OrgModal — shared create / edit modal with logo upload
───────────────────────────────────────────────────────── */
function OrgModal({
  title,
  form,
  setForm,
  onNameChange,
  currentLogoUrl,
  logoFile,
  logoPreview,
  onLogoFileChange,
  onConfirm,
  onClose,
  isSaving,
  confirmLabel,
}: {
  title: string;
  form: OrgFormData;
  setForm: React.Dispatch<React.SetStateAction<OrgFormData>>;
  onNameChange: (v: string) => void;
  currentLogoUrl: string | null;
  logoFile: File | null;
  logoPreview: string;
  onLogoFileChange: (file: File | null) => void;
  onConfirm: () => void;
  onClose: () => void;
  isSaving: boolean;
  confirmLabel: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onLogoFileChange(file);
    if (file) setForm((prev) => ({ ...prev, logo_url: "" }));
  };

  // What to show as the "new" preview
  const newPreviewSrc = logoPreview || (form.logo_url && form.logo_url !== currentLogoUrl ? form.logo_url : null);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Building2 size={16} className="text-indigo-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          {/* ── LOGO SECTION ── */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Organisation Logo
            </label>

            {/* When editing: side-by-side current vs new */}
            {currentLogoUrl && (
              <div className="flex gap-3 mb-3">
                {/* Current (old) logo */}
                <div className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1">Current logo</p>
                  <div className="flex items-center justify-center p-3 h-20">
                    <img src={currentLogoUrl} alt="current logo" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
                {/* New logo preview */}
                <div className="flex-1 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-500/40 overflow-hidden bg-indigo-50/50 dark:bg-indigo-500/5">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-3 pt-2 pb-1">New logo</p>
                  <div className="flex items-center justify-center p-3 h-20">
                    {newPreviewSrc ? (
                      <img src={newPreviewSrc} alt="new logo" className="max-h-full max-w-full object-contain rounded" />
                    ) : (
                      <ImageOff size={20} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* When creating: single preview */}
            {!currentLogoUrl && newPreviewSrc && (
              <div className="relative mb-3 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden h-24 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <img src={newPreviewSrc} alt="logo preview" className="max-h-full max-w-full object-contain p-2" />
                <button
                  type="button"
                  onClick={() => { onLogoFileChange(null); setForm((prev) => ({ ...prev, logo_url: "" })); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Upload + revert buttons */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={handleFilePick}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Upload size={12} />
                {logoFile ? "Change file" : "Upload logo"}
              </button>
              {(logoFile || newPreviewSrc) && (
                <button
                  type="button"
                  onClick={() => { onLogoFileChange(null); setForm((prev) => ({ ...prev, logo_url: currentLogoUrl ?? "" })); }}
                  title="Revert to current logo"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-semibold hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <RotateCcw size={11} /> Revert
                </button>
              )}
            </div>

            {logoFile && (
              <p className="mt-1.5 text-[11px] text-indigo-500 font-medium">
                {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)
              </p>
            )}

            {/* Fallback: paste a URL */}
            <div className="mt-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-white/10 focus-within:border-indigo-300 transition-colors">
              <Globe size={12} className="text-slate-400 flex-shrink-0" />
              <input
                type="url"
                placeholder="Or paste an image URL…"
                value={form.logo_url}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, logo_url: e.target.value }));
                  if (e.target.value) onLogoFileChange(null);
                }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Organisation Name <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400 transition-colors">
              <Building2 size={13} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="e.g. Tech Academy"
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="bg-transparent text-sm text-slate-800 dark:text-white flex-1 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Slug <span className="text-red-400">*</span>
              <span className="text-slate-400 font-normal ml-1">(unique URL identifier)</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400 transition-colors">
              <Globe size={13} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="e.g. tech-academy"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="bg-transparent text-sm font-mono text-slate-800 dark:text-white flex-1 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-white/10 focus-within:border-indigo-400 transition-colors">
              <FileText size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <textarea
                placeholder="Brief description of the organisation…"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="bg-transparent text-sm text-slate-800 dark:text-white flex-1 outline-none placeholder:text-slate-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
            {isSaving ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
