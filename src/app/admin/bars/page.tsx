"use client";

import { useState, useCallback } from "react";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import type { Bar } from "@/types";
import {
  Search,
  X,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface BarFormData {
  name: string;
  address: string;
  city: string;
  geo_lat: string;
  geo_lng: string;
}

const EMPTY_FORM: BarFormData = {
  name: "",
  address: "",
  city: "",
  geo_lat: "",
  geo_lng: "",
};

// ═══════════════════════════════════════════
// Bar Management Page
// ═══════════════════════════════════════════

export default function AdminBarsPage() {
  const admin = useAdmin();

  // ── Filters ──
  const [search, setSearch] = useState("");

  // ── Modals ──
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [form, setForm] = useState<BarFormData>(EMPTY_FORM);

  // ── Query: bars list ──
  const { data, isLoading } = admin.useAdminBars(search || undefined);
  const bars = data?.bars ?? [];

  // ── Handlers ──
  const updateField = useCallback(
    <K extends keyof BarFormData>(key: K, value: BarFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const openEdit = useCallback((bar: Bar) => {
    setEditingBar(bar);
    setForm({
      name: bar.name,
      address: bar.address ?? "",
      city: bar.city ?? "",
      geo_lat: bar.geo_lat != null ? String(bar.geo_lat) : "",
      geo_lng: bar.geo_lng != null ? String(bar.geo_lng) : "",
    });
  }, []);

  const closeModal = useCallback(() => {
    setEditingBar(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editingBar || !form.name.trim()) return;
    try {
      await admin.updateBar(editingBar.id, {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        geo_lat: form.geo_lat ? parseFloat(form.geo_lat) : null,
        geo_lng: form.geo_lng ? parseFloat(form.geo_lng) : null,
      });
      closeModal();
    } catch (err) {
      console.error("Failed to update bar:", err);
    }
  }, [editingBar, form, admin, closeModal]);

  const handleDelete = useCallback(
    async (bar: Bar) => {
      if (
        !window.confirm(
          `Supprimer "${bar.name}" ? Cette action est irreversible.`
        )
      ) {
        return;
      }
      try {
        await admin.deleteBar(bar.id);
      } catch (err) {
        console.error("Failed to delete bar:", err);
      }
    },
    [admin]
  );

  const handleToggleVerified = useCallback(
    async (bar: Bar) => {
      try {
        await admin.toggleVerified(bar.id);
      } catch (err) {
        console.error("Failed to toggle verified:", err);
      }
    },
    [admin]
  );

  // ── Table columns ──
  const columns: DataTableColumn<Bar>[] = [
    {
      key: "name",
      label: "Nom",
      render: (bar) => (
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={14} className="text-[#4ECDC4] shrink-0" />
          <span className="font-medium text-[#F5E6D3] truncate">
            {bar.name}
          </span>
        </div>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (bar) => (
        <span className="text-[#A89888]">{bar.city || "\u2014"}</span>
      ),
    },
    {
      key: "address",
      label: "Adresse",
      render: (bar) => (
        <span className="text-[#A89888] text-xs max-w-[200px] truncate block">
          {bar.address || "\u2014"}
        </span>
      ),
    },
    {
      key: "rating",
      label: "Note",
      render: (bar) => (
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-[#F0C460] tabular-nums">
            {bar.rating > 0 ? bar.rating.toFixed(1) : "\u2014"}
          </span>
          {bar.total_votes > 0 && (
            <span className="text-xs text-[#6B6050]">
              ({bar.total_votes})
            </span>
          )}
        </div>
      ),
    },
    {
      key: "is_verified",
      label: "Verifie",
      render: (bar) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleVerified(bar);
          }}
          disabled={admin.togglingVerified}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
            bar.is_verified
              ? "bg-[#4CAF50]/15 text-[#4CAF50] hover:bg-[#4CAF50]/25"
              : "bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/25"
          } disabled:opacity-50`}
          title={bar.is_verified ? "Cliquer pour retirer la verification" : "Cliquer pour verifier"}
        >
          {bar.is_verified ? (
            <>
              <ShieldCheck size={12} />
              Verifie
            </>
          ) : (
            <>
              <ShieldX size={12} />
              Non verifie
            </>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (bar) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(bar);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#E08840] hover:bg-[#E08840]/10 transition-colors"
            title="Modifier"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(bar);
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
      <AdminHeader title="Gestion des Bars" />

      <div className="px-6 py-6 lg:px-8 space-y-6">
        {/* ── Search Bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bar..."
              className="w-full pl-9 pr-4 py-2 bg-[#1E1B16] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
            />
          </div>

          {/* Result count */}
          {!isLoading && (
            <span className="text-xs text-[#6B6050] shrink-0">
              {data?.total ?? 0} bar{(data?.total ?? 0) > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#E08840]" />
          </div>
        ) : (
          <DataTable<Bar>
            columns={columns}
            data={bars}
            pageSize={10}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Edit Modal                                 */}
      {/* ═══════════════════════════════════════════ */}
      {editingBar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Content */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[#1E1B16] border border-[#3A3530] shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#4ECDC4]/15">
                    <MapPin size={18} className="text-[#4ECDC4]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#F5E6D3] font-display">
                    Modifier &quot;{editingBar.name}&quot;
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Nom du bar"
                    className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                  />
                </div>

                {/* City + Address */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Ex: Paris"
                      className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Ex: 12 rue de la Biere"
                      className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                    />
                  </div>
                </div>

                {/* Geo coordinates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                      Latitude
                    </label>
                    <input
                      type="number"
                      value={form.geo_lat}
                      onChange={(e) => updateField("geo_lat", e.target.value)}
                      placeholder="Ex: 48.8566"
                      step="0.0001"
                      className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                      Longitude
                    </label>
                    <input
                      type="number"
                      value={form.geo_lng}
                      onChange={(e) => updateField("geo_lng", e.target.value)}
                      placeholder="Ex: 2.3522"
                      step="0.0001"
                      className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#3A3530]">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={admin.updatingBar || !form.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E08840] text-[#141210] text-sm font-semibold hover:bg-[#E08840]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {admin.updatingBar && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
