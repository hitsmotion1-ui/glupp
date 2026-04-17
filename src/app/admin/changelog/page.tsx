"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Plus, Trash2, Pencil, X, Send, Eye, Sparkles } from "lucide-react";

interface ChangelogFeature {
  icon: string;
  text: string;
}

interface Changelog {
  id: string;
  version: string;
  title: string;
  description: string;
  features: ChangelogFeature[];
  created_at: string;
}

const EMOJI_SUGGESTIONS = ["🎯", "🍺", "⚔️", "🏆", "📸", "💎", "🔔", "💬", "📍", "🌍", "🎖️", "⭐", "🔥", "📊", "🛠️", "✨", "🎉", "👑", "🍻", "📨"];

export default function AdminChangelogPage() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Changelog | null>(null);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<ChangelogFeature[]>([{ icon: "✨", text: "" }]);
  const [submitting, setSubmitting] = useState(false);

  // Preview
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchChangelogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("changelogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setChangelogs(data as Changelog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const resetForm = () => {
    setVersion("");
    setTitle("");
    setDescription("");
    setFeatures([{ icon: "✨", text: "" }]);
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (changelog: Changelog) => {
    setEditing(changelog);
    setVersion(changelog.version);
    setTitle(changelog.title);
    setDescription(changelog.description);
    setFeatures(changelog.features.length > 0 ? changelog.features : [{ icon: "✨", text: "" }]);
    setShowForm(true);
  };

  const openNew = () => {
    resetForm();
    // Pré-remplir la version avec la prochaine
    if (changelogs.length > 0) {
      const latest = changelogs[0].version;
      const parts = latest.split(".").map(Number);
      parts[2] = (parts[2] || 0) + 1;
      setVersion(parts.join("."));
    } else {
      setVersion("1.0.0");
    }
    setShowForm(true);
  };

  const addFeature = () => {
    setFeatures([...features, { icon: "✨", text: "" }]);
  };

  const removeFeature = (index: number) => {
    if (features.length <= 1) return;
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: "icon" | "text", value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const handleSubmit = async () => {
    if (!version.trim() || !title.trim()) return;

    const cleanFeatures = features.filter((f) => f.text.trim());
    setSubmitting(true);

    try {
      if (editing) {
        const { error } = await supabase
          .from("changelogs")
          .update({
            version: version.trim(),
            title: title.trim(),
            description: description.trim(),
            features: cleanFeatures,
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("changelogs")
          .insert({
            version: version.trim(),
            title: title.trim(),
            description: description.trim(),
            features: cleanFeatures,
          });
        if (error) throw error;
      }

      resetForm();
      fetchChangelogs();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée de changelog ?")) return;
    await supabase.from("changelogs").delete().eq("id", id);
    fetchChangelogs();
  };

  // Reset all users' last_seen_version to force re-display
  const handlePushToAll = async (versionStr: string) => {
    if (!confirm(`Forcer l'affichage de la v${versionStr} pour TOUS les utilisateurs ?\n\nCela va reset leur last_seen_version.`)) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_version: null })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // update all

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Tous les utilisateurs verront le changelog à leur prochaine visite !");
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 transition-colors";
  const labelClass = "block text-xs text-[#A89888] mb-1.5 font-medium";

  return (
    <div className="p-6 max-w-4xl">
      <AdminHeader
        title="Changelog"
        subtitle="Gere les notes de mise a jour affichees aux utilisateurs"
      />

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E08840] text-[#16130E] font-semibold text-sm rounded-lg hover:bg-[#E08840]/90 transition-colors"
        >
          <Plus size={16} />
          Nouvelle version
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-[#1E1B16] border border-[#3A3530] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5E6D3]">
              {editing ? `Modifier v${editing.version}` : "Nouvelle version"}
            </h3>
            <button onClick={resetForm} className="text-[#6B6050] hover:text-[#F5E6D3]">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Version *</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.2.0"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Defis quotidiens & Partage !"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Un court résumé de cette mise à jour..."
              rows={2}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Features */}
          <div>
            <label className={labelClass}>Nouveautés</label>
            <div className="space-y-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Emoji picker inline */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-10 h-10 bg-[#141210] border border-[#3A3530] rounded-lg text-lg hover:border-[#E08840]/50 transition-colors flex items-center justify-center"
                    >
                      {feature.icon}
                    </button>
                    <div className="absolute top-full left-0 mt-1 p-2 bg-[#1E1B16] border border-[#3A3530] rounded-lg shadow-xl hidden group-hover:flex flex-wrap gap-1 z-50 w-48">
                      {EMOJI_SUGGESTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => updateFeature(i, "icon", emoji)}
                          className="w-8 h-8 hover:bg-[#3A3530] rounded flex items-center justify-center text-base transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={feature.text}
                    onChange={(e) => updateFeature(i, "text", e.target.value)}
                    placeholder="Description de la feature..."
                    className={inputClass + " flex-1"}
                  />

                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    disabled={features.length <= 1}
                    className="p-2 text-[#6B6050] hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFeature}
              className="mt-2 flex items-center gap-1.5 text-xs text-[#E08840] hover:underline"
            >
              <Plus size={12} />
              Ajouter une feature
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !version.trim() || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E08840] text-[#16130E] font-semibold text-sm rounded-lg hover:bg-[#E08840]/90 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-[#16130E] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {editing ? "Sauvegarder" : "Publier"}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 text-sm text-[#6B6050] hover:text-[#F5E6D3] transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Changelogs list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-[#1E1B16] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : changelogs.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-[#3A3530] mx-auto mb-3" />
          <p className="text-sm text-[#6B6050]">Aucun changelog pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {changelogs.map((changelog) => (
            <div
              key={changelog.id}
              className="p-5 bg-[#1E1B16] border border-[#3A3530] rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#E08840]/15 text-[#E08840] text-xs font-bold rounded">
                      v{changelog.version}
                    </span>
                    <h3 className="text-sm font-bold text-[#F5E6D3]">{changelog.title}</h3>
                  </div>
                  <p className="text-xs text-[#6B6050]">
                    {new Date(changelog.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewId(previewId === changelog.id ? null : changelog.id)}
                    className="p-1.5 text-[#6B6050] hover:text-[#F5E6D3] rounded hover:bg-[#3A3530] transition-colors"
                    title="Previsualiser"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(changelog)}
                    className="p-1.5 text-[#6B6050] hover:text-[#E08840] rounded hover:bg-[#3A3530] transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handlePushToAll(changelog.version)}
                    className="p-1.5 text-[#6B6050] hover:text-[#4ECDC4] rounded hover:bg-[#3A3530] transition-colors"
                    title="Renvoyer a tous"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(changelog.id)}
                    className="p-1.5 text-[#6B6050] hover:text-red-400 rounded hover:bg-[#3A3530] transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {changelog.description && (
                <p className="text-xs text-[#A89888] mb-3">{changelog.description}</p>
              )}

              {/* Features inline */}
              <div className="flex flex-wrap gap-1.5">
                {changelog.features.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#141210] border border-[#3A3530]/50 rounded-md text-[10px] text-[#A89888]"
                  >
                    {f.icon} {f.text}
                  </span>
                ))}
              </div>

              {/* Preview expanded */}
              {previewId === changelog.id && (
                <div className="mt-4 p-4 bg-[#141210] border border-[#3A3530] rounded-lg">
                  <p className="text-[10px] text-[#6B6050] mb-3 uppercase tracking-wider">Apercu utilisateur :</p>
                  <div className="text-center mb-3">
                    <Sparkles size={24} className="text-[#E08840] mx-auto mb-2" />
                    <h4 className="font-bold text-[#F5E6D3] text-sm">{changelog.title}</h4>
                    <p className="text-[10px] text-[#6B6050]">Version {changelog.version}</p>
                  </div>
                  {changelog.description && (
                    <p className="text-xs text-[#A89888] text-center mb-3">{changelog.description}</p>
                  )}
                  <div className="space-y-1.5">
                    {changelog.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 px-2 py-1.5 bg-[#1E1B16] rounded-lg">
                        <span className="text-sm">{f.icon}</span>
                        <span className="text-xs text-[#F5E6D3]">{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
