"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { BrewerySelect } from "@/components/beer/BrewerySelect";
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
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { BeerImportExport } from "@/components/admin/BeerImportExport";
import { getRegionSuggestions } from "@/lib/utils/regionSuggestions";

// ═══════════════════════════════════════════
// Country Emoji Picker Data
// ═══════════════════════════════════════════

const COUNTRY_LIST = [
  { code: "FR", flag: "\u{1F1EB}\u{1F1F7}", name: "France" },
  { code: "BE", flag: "\u{1F1E7}\u{1F1EA}", name: "Belgique" },
  { code: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Allemagne" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "USA" },
  { code: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "UK" },
  { code: "IE", flag: "\u{1F1EE}\u{1F1EA}", name: "Irlande" },
  { code: "NL", flag: "\u{1F1F3}\u{1F1F1}", name: "Pays-Bas" },
  { code: "CZ", flag: "\u{1F1E8}\u{1F1FF}", name: "Tchequie" },
  { code: "JP", flag: "\u{1F1EF}\u{1F1F5}", name: "Japon" },
  { code: "MX", flag: "\u{1F1F2}\u{1F1FD}", name: "Mexique" },
  { code: "ES", flag: "\u{1F1EA}\u{1F1F8}", name: "Espagne" },
  { code: "IT", flag: "\u{1F1EE}\u{1F1F9}", name: "Italie" },
  { code: "NO", flag: "\u{1F1F3}\u{1F1F4}", name: "Norvege" },
  { code: "DK", flag: "\u{1F1E9}\u{1F1F0}", name: "Danemark" },
  { code: "AU", flag: "\u{1F1E6}\u{1F1FA}", name: "Australie" },
  { code: "CA", flag: "\u{1F1E8}\u{1F1E6}", name: "Canada" },
  { code: "PL", flag: "\u{1F1F5}\u{1F1F1}", name: "Pologne" },
  { code: "AT", flag: "\u{1F1E6}\u{1F1F9}", name: "Autriche" },
  { code: "SE", flag: "\u{1F1F8}\u{1F1EA}", name: "Suede" },
  { code: "PT", flag: "\u{1F1F5}\u{1F1F9}", name: "Portugal" },
  { code: "BR", flag: "\u{1F1E7}\u{1F1F7}", name: "Bresil" },
  { code: "CH", flag: "\u{1F1E8}\u{1F1ED}", name: "Suisse" },
  { code: "NZ", flag: "\u{1F1F3}\u{1F1FF}", name: "Nouvelle-Zelande" },
  { code: "CN", flag: "\u{1F1E8}\u{1F1F3}", name: "Chine" },
  { code: "VN", flag: "\u{1F1FB}\u{1F1F3}", name: "Vietnam" },
  { code: "TH", flag: "\u{1F1F9}\u{1F1ED}", name: "Thailande" },
];

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
  ibu: string;
  rarity: Rarity;
  description: string;
  region: string;
  taste_bitter: number;
  taste_sweet: number;
  taste_fruity: number;
  taste_body: number;
  barcode: string;
  fun_fact: string;
  fun_fact_icon: string;
}

const EMPTY_FORM: BeerFormData = {
  name: "",
  brewery: "",
  country: "",
  country_code: "",
  style: "",
  abv: "",
  ibu: "",
  rarity: "common",
  description: "",
  region: "",
  taste_bitter: 3,
  taste_sweet: 3,
  taste_fruity: 3,
  taste_body: 3,
  barcode: "",
  fun_fact: "",
  fun_fact_icon: "💡",
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

  // ── Reject modal ──
  const [rejectingBeerId, setRejectingBeerId] = useState<string | null>(null);
  const [rejectingBeerName, setRejectingBeerName] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // ── Error / feedback ──
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ── Photo lightbox ──
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ── Query: beers list ──
  const { data, isLoading } = admin.useAdminBeers(
    search || undefined,
    rarity || undefined
  );
  const beers = data?.beers ?? [];

  // ── Query: pending beers for moderation ──
  const { data: pendingBeers = [], isLoading: loadingPending } = admin.useAdminPendingBeers();

  // ── Fetch existing styles for dropdown ──
  const { data: existingStyles = [] } = useQuery({
    queryKey: ["admin", "beer-styles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beers")
        .select("style")
        .eq("is_active", true)
        .eq("status", "approved");
      if (!data) return [];
      const styles = new Set(data.map((b) => b.style).filter(Boolean));
      return Array.from(styles).sort();
    },
    staleTime: 5 * 60 * 1000,
  });

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
      ibu: beer.ibu != null ? String(beer.ibu) : "",
      rarity: beer.rarity,
      description: beer.description ?? "",
      region: beer.region ?? "",
      taste_bitter: beer.taste_bitter ?? 3,
      taste_sweet: beer.taste_sweet ?? 3,
      taste_fruity: beer.taste_fruity ?? 3,
      taste_body: beer.taste_body ?? 3,
      barcode: (beer as Beer & { barcode?: string }).barcode ?? "",
      fun_fact: (beer as Beer & { fun_fact?: string }).fun_fact ?? "",
      fun_fact_icon: (beer as Beer & { fun_fact_icon?: string }).fun_fact_icon ?? "💡",
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
        ibu: form.ibu ? parseInt(form.ibu) : null,
        rarity: form.rarity,
        description: form.description.trim() || null,
        region: form.region.trim() || null,
        taste_bitter: form.taste_bitter,
        taste_sweet: form.taste_sweet,
        taste_fruity: form.taste_fruity,
        taste_body: form.taste_body,
        barcode: form.barcode.trim() || null,
        fun_fact: form.fun_fact.trim() || null,
        fun_fact_icon: form.fun_fact_icon || "💡",
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
        ibu: form.ibu ? parseInt(form.ibu) : null,
        rarity: form.rarity,
        description: form.description.trim() || null,
        region: form.region.trim() || null,
        taste_bitter: form.taste_bitter,
        taste_sweet: form.taste_sweet,
        taste_fruity: form.taste_fruity,
        taste_body: form.taste_body,
        barcode: form.barcode.trim() || null,
        fun_fact: form.fun_fact.trim() || null,
        fun_fact_icon: form.fun_fact_icon || "💡",
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
      key: "region",
      label: "Region",
      render: (beer) => (
        <span className="text-[#A89888] text-xs">{beer.region || "\u2014"}</span>
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
        {/* ── Error / Success feedback ── */}
        {actionError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <XCircle size={16} className="shrink-0" />
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="ml-auto text-red-400/70 hover:text-red-400"
            >
              &times;
            </button>
          </div>
        )}
        {actionSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <CheckCircle size={16} className="shrink-0" />
            <span>{actionSuccess}</span>
            <button
              onClick={() => setActionSuccess(null)}
              className="ml-auto text-green-400/70 hover:text-green-400"
            >
              &times;
            </button>
          </div>
        )}

        <BeerImportExport />

        {/* ── Pending Beers (Moderation) ── */}
        {pendingBeers.length > 0 && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-yellow-400" />
              <h3 className="text-sm font-bold text-yellow-400">
                Bieres en attente de validation ({pendingBeers.length})
              </h3>
            </div>

            <div className="space-y-2">
              {pendingBeers.map((beer) => {
                const proposer = (beer as Beer & { proposer?: { username: string; display_name?: string } | null }).proposer;
                return (
                  <div
                    key={beer.id}
                    className="flex items-center gap-3 p-3 bg-[#1E1B16] rounded-lg border border-[#3A3530]"
                  >
                    {/* Photo preview (clickable for lightbox) */}
                    {beer.image_url ? (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(beer.image_url!)}
                        className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-[#3A3530] bg-[#141210] cursor-zoom-in hover:border-[#E08840]/50 transition-colors"
                        title="Agrandir la photo"
                      >
                        <img
                          src={beer.image_url}
                          alt={beer.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="shrink-0 w-14 h-14 rounded-lg border border-[#3A3530] bg-[#141210] flex items-center justify-center">
                        <BeerIcon size={20} className="text-[#3A3530]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#F5E6D3] text-sm truncate">
                        {beer.country} {beer.name}
                      </p>
                      <p className="text-xs text-[#A89888] truncate">
                        {beer.brewery} · {beer.style}
                        {beer.abv ? ` · ${beer.abv}%` : ""}
                        {beer.region ? ` · ${beer.region}` : ""}
                      </p>
                      {proposer && (
                        <p className="text-xs text-[#6B6050] mt-0.5">
                          Proposee par @{proposer.display_name || proposer.username}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          openEdit(beer);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#E08840] hover:bg-[#E08840]/10 transition-colors"
                        title="Modifier avant validation"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          setActionError(null);
                          setActionSuccess(null);
                          try {
                            await admin.approveBeer(beer.id);
                            setActionSuccess(`Approuvee : "${beer.name}" ajoutee a la liste !`);
                          } catch (err) {
                            setActionError(
                              err instanceof Error ? err.message : "Erreur lors de la validation"
                            );
                          }
                        }}
                        disabled={admin.approvingBeer}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold hover:bg-green-500/25 transition-colors disabled:opacity-50"
                        title="Valider"
                      >
                        <CheckCircle size={14} />
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          setRejectingBeerId(beer.id);
                          setRejectingBeerName(beer.name);
                          setRejectReason("");
                        }}
                        disabled={admin.rejectingBeer}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50"
                        title="Rejeter"
                      >
                        <XCircle size={14} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            existingStyles={existingStyles}
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
            existingStyles={existingStyles}
          />
        </ModalOverlay>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Reject Modal                               */}
      {/* ═══════════════════════════════════════════ */}
      {rejectingBeerId && (
        <ModalOverlay
          onClose={() => {
            setRejectingBeerId(null);
            setRejectReason("");
          }}
        >
          <div className="p-6 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/15">
                <XCircle size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5E6D3] font-display">
                  Rejeter la biere
                </h2>
                <p className="text-xs text-[#A89888]">
                  &quot;{rejectingBeerName}&quot;
                </p>
              </div>
            </div>

            {/* Reason field */}
            <div className="mb-4">
              <label className="block mb-1.5 text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                Raison du rejet (optionnel)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Doublon avec une biere existante, informations incorrectes..."
                rows={3}
                className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-colors resize-none"
                autoFocus
              />
              <p className="text-[10px] text-[#6B6050] mt-1">
                Le commentaire sera inclus dans la notification envoyee a l&apos;utilisateur.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3A3530]">
              <button
                onClick={() => {
                  setRejectingBeerId(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  setActionError(null);
                  setActionSuccess(null);
                  try {
                    await admin.rejectBeer(rejectingBeerId, rejectReason || undefined);
                    setActionSuccess(`Rejetee : "${rejectingBeerName}" a ete refusee.`);
                    setRejectingBeerId(null);
                    setRejectReason("");
                  } catch (err) {
                    setActionError(
                      err instanceof Error ? err.message : "Erreur lors du rejet"
                    );
                  }
                }}
                disabled={admin.rejectingBeer}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {admin.rejectingBeer && <Loader2 size={14} className="animate-spin" />}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Photo Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
            className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Photo biere"
            className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
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
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#1E1B16] border border-[#3A3530] shadow-2xl">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Country Picker
// ═══════════════════════════════════════════

function CountryPicker({
  selectedFlag,
  selectedCode,
  onSelect,
}: {
  selectedFlag: string;
  selectedCode: string;
  onSelect: (flag: string, code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_LIST;
    const q = search.toLowerCase();
    return COUNTRY_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedName = COUNTRY_LIST.find((c) => c.code === selectedCode)?.name;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] hover:border-[#E08840]/50 transition-colors"
      >
        <span>
          {selectedFlag ? (
            <>
              <span className="text-lg mr-2">{selectedFlag}</span>
              {selectedName || selectedCode}
            </>
          ) : (
            <span className="text-[#6B6050]">Choisir un pays...</span>
          )}
        </span>
        <ChevronDown size={14} className="text-[#6B6050]" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1E1B16] border border-[#3A3530] rounded-lg shadow-xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-[#3A3530]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-2 py-1.5 bg-[#141210] border border-[#3A3530] rounded text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onSelect(c.flag, c.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#3A3530] transition-colors ${
                  selectedCode === c.code ? "bg-[#E08840]/10 text-[#E08840]" : "text-[#F5E6D3]"
                }`}
              >
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-xs text-[#6B6050] ml-auto">{c.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-[#6B6050] py-4">
                Aucun pays trouve
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Style Dropdown with custom add
// ═══════════════════════════════════════════

function StylePicker({
  value,
  onChange,
  existingStyles,
}: {
  value: string;
  onChange: (v: string) => void;
  existingStyles: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newStyle, setNewStyle] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAddingNew(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return existingStyles;
    const q = search.toLowerCase();
    return existingStyles.filter((s) => s.toLowerCase().includes(q));
  }, [search, existingStyles]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] hover:border-[#E08840]/50 transition-colors"
      >
        <span className={value ? "text-[#F5E6D3]" : "text-[#6B6050]"}>
          {value || "Choisir un style..."}
        </span>
        <ChevronDown size={14} className="text-[#6B6050]" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1E1B16] border border-[#3A3530] rounded-lg shadow-xl max-h-72 overflow-hidden">
          <div className="p-2 border-b border-[#3A3530]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un style..."
              className="w-full px-2 py-1.5 bg-[#141210] border border-[#3A3530] rounded text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-48">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#3A3530] transition-colors ${
                  value === s ? "bg-[#E08840]/10 text-[#E08840]" : "text-[#F5E6D3]"
                }`}
              >
                {s}
              </button>
            ))}

            {/* Add new style */}
            {!addingNew ? (
              <button
                type="button"
                onClick={() => setAddingNew(true)}
                className="w-full text-left px-3 py-2 text-sm text-[#E08840] hover:bg-[#E08840]/10 transition-colors border-t border-[#3A3530]"
              >
                + Ajouter un nouveau style
              </button>
            ) : (
              <div className="p-2 border-t border-[#3A3530] flex gap-2">
                <input
                  type="text"
                  value={newStyle}
                  onChange={(e) => setNewStyle(e.target.value)}
                  placeholder="Nouveau style..."
                  className="flex-1 px-2 py-1.5 bg-[#141210] border border-[#3A3530] rounded text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStyle.trim()) {
                      onChange(newStyle.trim());
                      setOpen(false);
                      setAddingNew(false);
                      setNewStyle("");
                      setSearch("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStyle.trim()) {
                      onChange(newStyle.trim());
                      setOpen(false);
                      setAddingNew(false);
                      setNewStyle("");
                      setSearch("");
                    }
                  }}
                  className="px-3 py-1.5 bg-[#E08840] text-[#141210] rounded text-xs font-semibold hover:bg-[#E08840]/90"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Taste Slider (admin)
// ═══════════════════════════════════════════

const TASTE_DIMENSIONS = [
  { key: "taste_bitter" as const, label: "Amertume", color: "#E08840", emoji: "\u{1F37A}" },
  { key: "taste_sweet" as const, label: "Sucre", color: "#DCB04C", emoji: "\u{1F36F}" },
  { key: "taste_fruity" as const, label: "Fruite", color: "#4CAF50", emoji: "\u{1F353}" },
  { key: "taste_body" as const, label: "Corps", color: "#8D7C6C", emoji: "\u{1F4AA}" },
];

function TasteSliders({
  values,
  onChange,
}: {
  values: { taste_bitter: number; taste_sweet: number; taste_fruity: number; taste_body: number };
  onChange: (key: keyof typeof values, value: number) => void;
}) {
  return (
    <div className="space-y-3">
      {TASTE_DIMENSIONS.map((dim) => (
        <div key={dim.key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#A89888] flex items-center gap-1.5">
              <span>{dim.emoji}</span>
              {dim.label}
            </label>
            <span
              className="text-xs font-bold tabular-nums w-4 text-center"
              style={{ color: dim.color }}
            >
              {values[dim.key].toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#6B6050] w-3 text-center">1</span>
            <input
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={values[dim.key]}
              onChange={(e) => onChange(dim.key, parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${dim.color} 0%, ${dim.color} ${((values[dim.key] - 1) / 4) * 100}%, #3A3530 ${((values[dim.key] - 1) / 4) * 100}%, #3A3530 100%)`,
              }}
            />
            <span className="text-[10px] text-[#6B6050] w-3 text-center">5</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Beer Form (enhanced)
// ═══════════════════════════════════════════

function BeerForm({
  title,
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  existingStyles,
}: {
  title: string;
  form: BeerFormData;
  onChange: <K extends keyof BeerFormData>(key: K, value: BeerFormData[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
  existingStyles: string[];
}) {
  const inputClass =
    "w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors";
  const labelClass = "block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider";
  const sectionClass = "rounded-lg border border-[#3A3530] p-4 space-y-4";
  const sectionTitleClass = "text-sm font-bold text-[#F5E6D3] mb-3";

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

      <div className="space-y-5">
        {/* ── Section 1: Infos de base ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>Informations</h3>

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
              <BrewerySelect
                value={form.brewery}
                onChange={(name) => onChange("brewery", name)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Country (emoji picker) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Pays</label>
              <CountryPicker
                selectedFlag={form.country}
                selectedCode={form.country_code}
                onSelect={(flag, code) => {
                  onChange("country", flag);
                  onChange("country_code", code);
                }}
              />
            </div>
            <div>
              <label className={labelClass}>Region</label>
              {getRegionSuggestions(form.country_code).length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={getRegionSuggestions(form.country_code).includes(form.region) ? form.region : (form.region ? "__other__" : "")}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__other__") onChange("region", "");
                      else onChange("region", v);
                    }}
                    className={inputClass}
                  >
                    <option value="">-- Choisir une region --</option>
                    {getRegionSuggestions(form.country_code).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="__other__">Autre...</option>
                  </select>
                  {!getRegionSuggestions(form.country_code).includes(form.region) && form.region !== "" && (
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => onChange("region", e.target.value)}
                      placeholder="Saisir la region..."
                      className={inputClass}
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => onChange("region", e.target.value)}
                  placeholder="Ex: Bretagne, Bavaria, California..."
                  className={inputClass}
                />
              )}
            </div>
          </div>

          {/* Style (dropdown) + ABV + IBU */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Style</label>
              <StylePicker
                value={form.style}
                onChange={(v) => onChange("style", v)}
                existingStyles={existingStyles}
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
            <div>
              <label className={labelClass}>IBU</label>
              <input
                type="number"
                value={form.ibu}
                onChange={(e) => onChange("ibu", e.target.value)}
                placeholder="Ex: 35"
                min="0"
                max="200"
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
        </div>

        {/* ── Section 2: Profil gustatif ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>Profil gustatif</h3>
          <TasteSliders
            values={{
              taste_bitter: form.taste_bitter,
              taste_sweet: form.taste_sweet,
              taste_fruity: form.taste_fruity,
              taste_body: form.taste_body,
            }}
            onChange={(key, value) => onChange(key, value)}
          />
        </div>

        {/* ── Section 3: Description ── */}
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

        {/* ── Section 4: Barcode ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>Code-barres</h3>
          <div>
            <label className={labelClass}>EAN / UPC</label>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => onChange("barcode", e.target.value)}
              placeholder="Ex: 5410228103706"
              maxLength={30}
              className={inputClass}
            />
            <p className="text-[10px] text-[#6B6050] mt-1">
              Permet a l&apos;utilisateur de scanner la biere directement depuis sa camera.
            </p>
          </div>
        </div>

        {/* ── Section 5: Fun Fact ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>Fun Fact</h3>
          <div className="flex gap-3">
            {/* Icon emoji picker */}
            <div className="shrink-0">
              <label className={labelClass}>Icone</label>
              <input
                type="text"
                value={form.fun_fact_icon}
                onChange={(e) => onChange("fun_fact_icon", e.target.value)}
                maxLength={4}
                className="w-16 text-center px-2 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-lg text-[#F5E6D3] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Anecdote / Histoire</label>
              <textarea
                value={form.fun_fact}
                onChange={(e) => onChange("fun_fact", e.target.value)}
                placeholder="Ex: Cette biere est brassee dans une ancienne abbaye cistercienne fondee en 1133..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
          <p className="text-[10px] text-[#6B6050]">
            Affiche dans la fiche biere pour enrichir l&apos;experience utilisateur.
          </p>
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
