"use client";

import { useState, useCallback } from "react";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { RARITY_CONFIG } from "@/lib/utils/xp";
import type { Beer, Rarity } from "@/types";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Loader2,
  Beer as BeerIcon,
} from "lucide-react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface BeerFormData {
  name: string;
  brewery: string;
  country: string;
  country_code: string;
  style: string;
  abv: string;
  rarity: Rarity;
  description: string;
}

const EMPTY_FORM: BeerFormData = {
  name: "",
  brewery: "",
  country: "",
  country_code: "",
  style: "",
  abv: "",
  rarity: "common",
  description: "",
};

const RARITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Toutes les raretes" },
  { value: "common", label: "Commune" },
  { value: "rare", label: "Rare" },
  { value: "epic", label: "Epique" },
  { value: "legendary", label: "Legendaire" },
];

// ═══════════════════════════════════════════
// Beer Management Page
// ═══════════════════════════════════════════

export default function AdminBeersPage() {
  const admin = useAdmin();

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("");

  // ── Modals ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null);
  const [form, setForm] = useState<BeerFormData>(EMPTY_FORM);

  // ── Query: beers list ──
  const { data, isLoading } = admin.useAdminBeers(
    search || undefined,
    rarity || undefined
  );
  const beers = data?.beers ?? [];

  // ── Handlers ──
  const updateField = useCallback(
    <K extends keyof BeerFormData>(key: K, value: BeerFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setShowCreateModal(true);
  }, []);

  const openEdit = useCallback((beer: Beer) => {
    setEditingBeer(beer);
    setForm({
      name: beer.name,
      brewery: beer.brewery,
      country: beer.country,
      country_code: beer.country_code,
      style: beer.style,
      abv: beer.abv != null ? String(beer.abv) : "",
      rarity: beer.rarity,
      description: beer.description ?? "",
    });
  }, []);

  const closeModals = useCallback(() => {
    setShowCreateModal(false);
    setEditingBeer(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!form.name.trim() || !form.brewery.trim()) return;
    try {
      await admin.createBeer({
        name: form.name.trim(),
        brewery: form.brewery.trim(),
        country: form.country.trim(),
        country_code: form.country_code.trim(),
        style: form.style.trim(),
        abv: form.abv ? parseFloat(form.abv) : null,
        rarity: form.rarity,
        description: form.description.trim() || null,
      });
      closeModals();
    } catch (err) {
      console.error("Failed to create beer:", err);
    }
  }, [form, admin, closeModals]);

  const handleUpdate = useCallback(async () => {
    if (!editingBeer || !form.name.trim()) return;
    try {
      await admin.updateBeer(editingBeer.id, {
        name: form.name.trim(),
        brewery: form.brewery.trim(),
        country: form.country.trim(),
        country_code: form.country_code.trim(),
        style: form.style.trim(),
        abv: form.abv ? parseFloat(form.abv) : null,
        rarity: form.rarity,
        description: form.description.trim() || null,
      });
      closeModals();
    } catch (err) {
      console.error("Failed to update beer:", err);
    }
  }, [editingBeer, form, admin, closeModals]);

  const handleDelete = useCallback(
    async (beer: Beer) => {
      if (!window.confirm(`Supprimer "${beer.name}" ? Cette action est irreversible.`)) {
        return;
      }
      try {
        await admin.deleteBeer(beer.id);
      } catch (err) {
        console.error("Failed to delete beer:", err);
      }
    },
    [admin]
  );

  // ── Table columns ──
  const columns: DataTableColumn<Beer>[] = [
    {
      key: "name",
      label: "Nom",
      render: (beer) => (
        <div className="min-w-0">
          <p className="font-medium text-[#F5E6D3] truncate">{beer.name}</p>
          <p className="text-xs text-[#A89888] truncate">{beer.brewery}</p>
        </div>
      ),
    },
    {
      key: "style",
      label: "Style",
      render: (beer) => (
        <span className="text-[#A89888]">{beer.style || "\u2014"}</span>
      ),
    },
    {
      key: "country",
      label: "Pays",
      render: (beer) => (
        <span>
          {beer.country} <span className="text-[#A89888] text-xs">{beer.country_code}</span>
        </span>
      ),
    },
    {
      key: "abv",
      label: "ABV",
      render: (beer) => (
        <span className="text-[#A89888] tabular-nums">
          {beer.abv != null ? `${beer.abv}%` : "\u2014"}
        </span>
      ),
    },
    {
      key: "rarity",
      label: "Rarete",
      render: (beer) => {
        const cfg = RARITY_CONFIG[beer.rarity];
        return (
          <span
            className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{
              backgroundColor: `${cfg.color}20`,
              color: cfg.color,
            }}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "elo",
      label: "ELO",
      render: (beer) => (
        <span className="font-mono text-sm text-[#F0C460] tabular-nums">
          {beer.elo}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (beer) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(beer);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#E08840] hover:bg-[#E08840]/10 transition-colors"
            title="Modifier"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(beer);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#141210]">
      <AdminHeader title="Gestion des Bieres">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E08840] text-[#141210] text-sm font-semibold hover:bg-[#E08840]/90 transition-colors"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </AdminHeader>

      <div className="px-6 py-6 lg:px-8 space-y-6">
        {/* ── Filters Bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une biere..."
              className="w-full pl-9 pr-4 py-2 bg-[#1E1B16] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
            />
          </div>

          {/* Rarity filter */}
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="px-3 py-2 bg-[#1E1B16] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
          >
            {RARITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Result count */}
          {!isLoading && (
            <span className="text-xs text-[#6B6050] shrink-0">
              {data?.total ?? 0} biere{(data?.total ?? 0) > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#E08840]" />
          </div>
        ) : (
          <DataTable<Beer>
            columns={columns}
            data={beers}
            pageSize={10}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Create Modal                               */}
      {/* ═══════════════════════════════════════════ */}
      {showCreateModal && (
        <ModalOverlay onClose={closeModals}>
          <BeerForm
            title="Ajouter une biere"
            form={form}
            onChange={updateField}
            onSubmit={handleCreate}
            onCancel={closeModals}
            submitting={admin.creatingBeer}
            submitLabel="Creer"
          />
        </ModalOverlay>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Edit Modal                                 */}
      {/* ═══════════════════════════════════════════ */}
      {editingBeer && (
        <ModalOverlay onClose={closeModals}>
          <BeerForm
            title={`Modifier "${editingBeer.name}"`}
            form={form}
            onChange={updateField}
            onSubmit={handleUpdate}
            onCancel={closeModals}
            submitting={admin.updatingBeer}
            submitLabel="Enregistrer"
          />
        </ModalOverlay>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Modal Overlay
// ═══════════════════════════════════════════

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[#1E1B16] border border-[#3A3530] shadow-2xl">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Beer Form
// ═══════════════════════════════════════════

function BeerForm({
  title,
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  title: string;
  form: BeerFormData;
  onChange: <K extends keyof BeerFormData>(key: K, value: BeerFormData[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const inputClass =
    "w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors";
  const labelClass = "block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#E08840]/15">
            <BeerIcon size={18} className="text-[#E08840]" />
          </div>
          <h2 className="text-lg font-bold text-[#F5E6D3] font-display">
            {title}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name + Brewery row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Ex: Chouffe Blonde"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Brasserie *</label>
            <input
              type="text"
              value={form.brewery}
              onChange={(e) => onChange("brewery", e.target.value)}
              placeholder="Ex: Brasserie d'Achouffe"
              className={inputClass}
            />
          </div>
        </div>

        {/* Country + Country Code row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pays (emoji)</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => onChange("country", e.target.value)}
              placeholder="Ex: \uD83C\uDDE7\uD83C\uDDEA"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Code pays (ISO)</label>
            <input
              type="text"
              value={form.country_code}
              onChange={(e) => onChange("country_code", e.target.value)}
              placeholder="Ex: BE"
              className={inputClass}
              maxLength={2}
            />
          </div>
        </div>

        {/* Style + ABV row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Style</label>
            <input
              type="text"
              value={form.style}
              onChange={(e) => onChange("style", e.target.value)}
              placeholder="Ex: Belgian Blonde"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ABV (%)</label>
            <input
              type="number"
              value={form.abv}
              onChange={(e) => onChange("abv", e.target.value)}
              placeholder="Ex: 8.0"
              step="0.1"
              min="0"
              max="100"
              className={inputClass}
            />
          </div>
        </div>

        {/* Rarity */}
        <div>
          <label className={labelClass}>Rarete</label>
          <select
            value={form.rarity}
            onChange={(e) => onChange("rarity", e.target.value as Rarity)}
            className={inputClass}
          >
            {Object.entries(RARITY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Description de la biere..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#3A3530]">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !form.name.trim() || !form.brewery.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E08840] text-[#141210] text-sm font-semibold hover:bg-[#E08840]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
