"use client";

import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import type { Trophy } from "@/types";
import {
  Search,
  Trophy as TrophyIcon,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Gift,
} from "lucide-react";

// ═══════════════════════════════════════════
// Category config
// ═══════════════════════════════════════════

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  collection: { label: "Collection", color: "#E08840" },
  style: { label: "Styles", color: "#4ECDC4" },
  region: { label: "Régions", color: "#F0C460" },
  rarity: { label: "Rareté", color: "#A78BFA" },
  social: { label: "Social", color: "#3B82F6" },
  photos: { label: "Photos", color: "#EC4899" },
};

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function AdminTrophiesPage() {
  const admin = useAdmin();
  const { data: trophies = [], isLoading } = admin.useAdminTrophies();

  // ── Award modal ──
  const [awardModal, setAwardModal] = useState<{ trophy: Trophy } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: userResults = [], isLoading: loadingUsers } = admin.useAdminUsers(
    debouncedUserSearch || undefined
  );

  const handleUserSearchChange = useCallback(
    (value: string) => {
      setUserSearch(value);
      setSelectedUserId(null);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedUserSearch(value.trim()), 400);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  function openAwardModal(trophy: Trophy) {
    setAwardModal({ trophy });
    setUserSearch("");
    setDebouncedUserSearch("");
    setSelectedUserId(null);
    setActionError(null);
    setSuccessMsg(null);
  }

  function closeAwardModal() {
    setAwardModal(null);
    setUserSearch("");
    setSelectedUserId(null);
    setActionError(null);
    setSuccessMsg(null);
  }

  async function handleAwardTrophy() {
    if (!awardModal || !selectedUserId) return;
    setActionError(null);
    setSuccessMsg(null);
    try {
      await admin.awardTrophy(selectedUserId, awardModal.trophy.id);
      const user = userResults.find((u) => u.id === selectedUserId);
      setSuccessMsg(
        `Trophée "${awardModal.trophy.name}" attribué à ${user?.username ?? "l'utilisateur"} !`
      );
      setSelectedUserId(null);
      setUserSearch("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'attribution");
    }
  }

  // ── Group by category ──
  const grouped = trophies.reduce<Record<string, Trophy[]>>((acc, t) => {
    const cat = t.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) =>
    (CATEGORY_LABELS[a]?.label ?? a).localeCompare(CATEGORY_LABELS[b]?.label ?? b)
  );

  return (
    <div className="min-h-screen bg-[#141210]">
      <AdminHeader
        title="Trophées"
        subtitle={`${trophies.length} trophée${trophies.length !== 1 ? "s" : ""} configuré${trophies.length !== 1 ? "s" : ""}`}
      />

      <div className="px-6 py-6 lg:px-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#E08840]" />
          </div>
        ) : trophies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TrophyIcon size={48} strokeWidth={1.2} className="mb-3 text-[#3A3530]" />
            <p className="text-sm text-[#6B6050]">Aucun trophée configuré</p>
          </div>
        ) : (
          categories.map((cat) => {
            const catConfig = CATEGORY_LABELS[cat];
            return (
              <section key={cat}>
                <h2 className="flex items-center gap-2 mb-4 text-base font-bold text-[#F5E6D3]">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: catConfig?.color ?? "#6B6050" }}
                  />
                  {catConfig?.label ?? cat}
                  <span className="text-xs font-normal text-[#6B6050]">
                    ({grouped[cat].length})
                  </span>
                </h2>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[cat].map((trophy) => (
                    <div
                      key={trophy.id}
                      className="flex items-start gap-3 p-4 bg-[#1E1B16] border border-[#3A3530] rounded-xl hover:border-[#4A4540] transition-colors"
                    >
                      {/* Emoji */}
                      <span className="text-3xl shrink-0 mt-0.5">{trophy.emoji}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#F5E6D3] leading-tight">
                              {trophy.name}
                            </p>
                            {trophy.description && (
                              <p className="text-xs text-[#A89888] mt-0.5 leading-relaxed">
                                {trophy.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F0C460]/10 text-[#F0C460] whitespace-nowrap">
                            +{trophy.xp_reward} XP
                          </span>
                        </div>

                        {/* Attribuer button */}
                        <button
                          onClick={() => openAwardModal(trophy)}
                          className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-[#4ECDC4]/10 hover:bg-[#4ECDC4]/20 text-[#4ECDC4] rounded-lg transition-colors"
                        >
                          <Gift size={11} />
                          Attribuer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Award Modal                                */}
      {/* ═══════════════════════════════════════════ */}
      {awardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAwardModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3530]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{awardModal.trophy.emoji}</span>
                <div>
                  <h2 className="text-base font-bold text-[#F5E6D3]">{awardModal.trophy.name}</h2>
                  <p className="text-xs text-[#A89888]">Attribuer à un utilisateur</p>
                </div>
              </div>
              <button
                onClick={closeAwardModal}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Feedback */}
              {actionError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  <AlertTriangle size={14} className="shrink-0" />
                  {actionError}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-lg text-[#4CAF50] text-xs">
                  <Check size={14} className="shrink-0" />
                  {successMsg}
                </div>
              )}

              {/* Search user */}
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Rechercher un utilisateur
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050] pointer-events-none" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                    placeholder="Pseudo ou nom..."
                    className="w-full pl-8 pr-4 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                  />
                </div>
              </div>

              {/* User results */}
              {debouncedUserSearch.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[#3A3530] bg-[#141210] divide-y divide-[#3A3530]/50">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={16} className="animate-spin text-[#E08840]" />
                    </div>
                  ) : userResults.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-[#6B6050] text-center">Aucun utilisateur trouvé</p>
                  ) : (
                    userResults.slice(0, 8).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setUserSearch(`${user.username}${user.display_name ? ` (${user.display_name})` : ""}`);
                          setDebouncedUserSearch("");
                          setSuccessMsg(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#3A3530]/50 transition-colors ${
                          selectedUserId === user.id ? "bg-[#E08840]/10" : ""
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#3A3530] flex items-center justify-center shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[#A89888]">
                              {(user.username || "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#F5E6D3] truncate">{user.username}</p>
                          {user.display_name && (
                            <p className="text-xs text-[#6B6050] truncate">{user.display_name}</p>
                          )}
                        </div>
                        <span className="text-xs text-[#F0C460] shrink-0">
                          {user.xp.toLocaleString("fr-FR")} XP
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected user recap */}
              {selectedUserId && debouncedUserSearch === "" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#E08840]/10 border border-[#E08840]/30 rounded-lg">
                  <Check size={14} className="text-[#E08840] shrink-0" />
                  <span className="text-sm text-[#F5E6D3]">{userSearch}</span>
                  <button
                    onClick={() => { setSelectedUserId(null); setUserSearch(""); }}
                    className="ml-auto text-[#6B6050] hover:text-[#A89888]"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#3A3530]">
              <button
                onClick={closeAwardModal}
                className="px-4 py-2 text-sm text-[#A89888] hover:text-[#F5E6D3] transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handleAwardTrophy}
                disabled={admin.awardingTrophy || !selectedUserId}
                className="flex items-center gap-2 px-5 py-2 bg-[#4ECDC4] hover:bg-[#4ECDC4]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#141210] text-sm font-bold rounded-lg transition-colors"
              >
                {admin.awardingTrophy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Gift size={14} />
                )}
                Attribuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
