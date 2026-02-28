"use client";

import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { getLevel } from "@/lib/utils/xp";
import type { Profile } from "@/types";
import {
  Search,
  Gift,
  X,
  Loader2,
  Users,
  AlertTriangle,
} from "lucide-react";

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function UsersPage() {
  const admin = useAdmin();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // XP modal state
  const [xpModal, setXpModal] = useState<{
    user: Profile;
  } | null>(null);
  const [xpAmount, setXpAmount] = useState<number | "">("");
  const [xpReason, setXpReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = admin.useAdminUsers(debouncedSearch || undefined);

  // ─── Search with debounce ────────────────

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setDebouncedSearch(value.trim());
      }, 400);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  // ─── XP Modal Handlers ──────────────────

  function openXpModal(user: Profile) {
    setXpModal({ user });
    setXpAmount("");
    setXpReason("");
    setActionError(null);
  }

  function closeXpModal() {
    setXpModal(null);
    setXpAmount("");
    setXpReason("");
    setActionError(null);
  }

  async function handleAwardXP() {
    if (!xpModal || !xpAmount || xpAmount <= 0 || !xpReason.trim()) return;
    setActionError(null);
    try {
      await admin.awardXP(xpModal.user.id, xpAmount, xpReason.trim());
      closeXpModal();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erreur lors de l'attribution d'XP"
      );
    }
  }

  // ─── Render ──────────────────────────────

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Utilisateurs"
        subtitle={`${users.length} utilisateur${users.length !== 1 ? "s" : ""}`}
      />

      <div className="px-4 py-6 lg:px-8 space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050] pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par pseudo ou nom..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1E1B16] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden animate-pulse">
            <div className="px-4 py-3 border-b border-[#3A3530]">
              <div className="h-4 bg-[#3A3530] rounded w-full max-w-xs" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 border-b border-[#3A3530]/50"
              >
                <div className="w-8 h-8 bg-[#3A3530] rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 bg-[#3A3530] rounded w-1/3" />
                  <div className="h-3 bg-[#3A3530] rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle
              size={40}
              strokeWidth={1.2}
              className="mb-3 text-red-500/60"
            />
            <p className="text-sm font-medium text-red-400">
              Erreur de chargement
            </p>
            <p className="mt-1 text-xs text-[#6B6050]">
              {error instanceof Error ? error.message : "Une erreur est survenue"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users
              size={48}
              strokeWidth={1.2}
              className="mb-3 text-[#3A3530]"
            />
            <p className="text-sm font-medium text-[#6B6050]">
              Aucun utilisateur trouve
            </p>
            {search.trim() && (
              <p className="mt-1 text-xs text-[#6B6050]">
                Essayez de modifier votre recherche
              </p>
            )}
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !isError && users.length > 0 && (
          <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#3A3530]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Utilisateur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      XP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Bieres
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Duels
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Inscrit le
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3530]/50">
                  {users.map((user, idx) => {
                    const level = getLevel(user.xp);
                    return (
                      <tr
                        key={user.id}
                        className={idx % 2 === 1 ? "bg-[#141210]/30" : ""}
                      >
                        {/* Username + Display Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Avatar placeholder */}
                            <div className="w-8 h-8 rounded-full bg-[#3A3530] flex items-center justify-center shrink-0">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-[#A89888]">
                                  {(user.username || "?")[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#F5E6D3] truncate">
                                {user.username}
                              </p>
                              {user.display_name && (
                                <p className="text-xs text-[#6B6050] truncate">
                                  {user.display_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* XP + Level Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#F0C460] tabular-nums">
                              {user.xp.toLocaleString("fr-FR")}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F0C460]/10 text-[#F0C460]">
                              {level.icon} Nv.{level.level}
                            </span>
                          </div>
                        </td>

                        {/* Beers Tasted */}
                        <td className="px-4 py-3 text-sm text-[#F5E6D3] tabular-nums whitespace-nowrap">
                          {user.beers_tasted}
                        </td>

                        {/* Duels Played */}
                        <td className="px-4 py-3 text-sm text-[#F5E6D3] tabular-nums whitespace-nowrap">
                          {user.duels_played}
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-3 text-sm text-[#A89888] whitespace-nowrap">
                          {formatDate(user.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openXpModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0C460]/10 hover:bg-[#F0C460]/20 text-[#F0C460] text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Gift size={12} />
                            Donner XP
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* XP Modal */}
      {xpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeXpModal}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3530]">
              <div>
                <h2 className="text-base font-bold text-[#F5E6D3]">
                  Donner de l&apos;XP
                </h2>
                <p className="text-xs text-[#A89888] mt-0.5">
                  {xpModal.user.username}
                  {xpModal.user.display_name
                    ? ` (${xpModal.user.display_name})`
                    : ""}
                </p>
              </div>
              <button
                onClick={closeXpModal}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {actionError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Montant XP
                </label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={xpAmount}
                  onChange={(e) =>
                    setXpAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="ex: 500"
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors tabular-nums"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Raison
                </label>
                <textarea
                  value={xpReason}
                  onChange={(e) => setXpReason(e.target.value)}
                  placeholder="Pourquoi attribuer ces XP..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#3A3530]">
              <button
                onClick={closeXpModal}
                className="px-4 py-2 text-sm text-[#A89888] hover:text-[#F5E6D3] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAwardXP}
                disabled={
                  admin.awardingXP ||
                  !xpAmount ||
                  xpAmount <= 0 ||
                  !xpReason.trim()
                }
                className="flex items-center gap-2 px-5 py-2 bg-[#F0C460] hover:bg-[#F0C460]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#141210] text-sm font-bold rounded-lg transition-colors"
              >
                {admin.awardingXP ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Gift size={14} />
                )}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
