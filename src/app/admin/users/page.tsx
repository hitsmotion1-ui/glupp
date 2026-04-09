"use client";

import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getLevel, getLevelProgress, getNextLevel } from "@/lib/utils/xp";
import type { Profile } from "@/types";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Users,
  AlertTriangle,
  ShieldOff,
  Shield,
  ChevronRight,
  Beer,
  Swords,
  Camera,
  Calendar,
  Trophy,
  Plus,
  Trash2,
  Activity,
  MessageSquare,
} from "lucide-react";

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days}j`;
  return formatDate(iso);
}

const RARITY_EMOJI: Record<string, string> = {
  common: "⚪",
  rare: "🔵",
  epic: "🟣",
  legendary: "🌟",
};

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function UsersPage() {
  const admin = useAdmin();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ── XP modal ──
  const [xpModal, setXpModal] = useState<{ user: Profile } | null>(null);
  const [xpAmount, setXpAmount] = useState<number | "">("");
  const [xpReason, setXpReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Ban confirmation ──
  const [confirmBanId, setConfirmBanId] = useState<string | null>(null);

  // ── Detail panel ──
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // ── Add beer modal ──
  const [showAddBeerModal, setShowAddBeerModal] = useState(false);
  const [addBeerSearch, setAddBeerSearch] = useState("");
  const [addBeerComment, setAddBeerComment] = useState("");
  const [addBeerError, setAddBeerError] = useState<string | null>(null);

  // ── Remove beer modal ──
  const [removeBeerTarget, setRemoveBeerTarget] = useState<{ beerId: string; beerName: string } | null>(null);
  const [removeBeerComment, setRemoveBeerComment] = useState("");

  // ── Activity tab in detail panel ──
  const [detailTab, setDetailTab] = useState<"beerdex" | "activity" | "trophies">("beerdex");

  const { data: users = [], isLoading, isError, error } = admin.useAdminUsers(debouncedSearch || undefined);
  const { data: userDetail, isLoading: loadingDetail } = admin.useUserAdminDetail(selectedUserId);

  // ── Beer search for add-to-beerdex ──
  const { data: beerSearchResults = [] } = useQuery({
    queryKey: ["admin", "beer-search", addBeerSearch],
    queryFn: async () => {
      if (addBeerSearch.trim().length < 2) return [];
      const { data } = await supabase
        .from("beers")
        .select("id, name, brewery, rarity, country")
        .eq("status", "approved")
        .or(`name.ilike.%${addBeerSearch}%,brewery.ilike.%${addBeerSearch}%`)
        .order("name")
        .limit(10);
      return data || [];
    },
    enabled: addBeerSearch.trim().length >= 2,
    staleTime: 10 * 1000,
  });

  // ─── Search with debounce ────────────────

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedSearch(value.trim()), 400);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  // ─── XP Modal ───────────────────────────

  function openXpModal(user: Profile, e?: React.MouseEvent) {
    e?.stopPropagation();
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
    if (!xpModal || xpAmount === "" || !xpReason.trim()) return;
    const amount = Number(xpAmount);
    if (amount === 0) return;
    // Empêcher XP < 0
    if (xpModal.user.xp + amount < 0) {
      setActionError("Le résultat ne peut pas être inférieur à 0 XP.");
      return;
    }
    setActionError(null);
    try {
      await admin.awardXP(xpModal.user.id, amount, xpReason.trim());
      closeXpModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'ajustement d'XP");
    }
  }

  // ─── Ban ────────────────────────────────

  async function handleToggleBan(userId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmBanId === userId) {
      setConfirmBanId(null);
      try {
        await admin.toggleBan(userId);
      } catch (err) {
        console.error("Ban error:", err);
      }
    } else {
      setConfirmBanId(userId);
    }
  }

  // ─── Detail Panel ────────────────────────

  const selectedUser = users.find((u) => u.id === selectedUserId);

  // ─── Render ──────────────────────────────

  return (
    <div className="min-h-screen flex">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
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
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#3A3530]/50">
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
              <AlertTriangle size={40} strokeWidth={1.2} className="mb-3 text-red-500/60" />
              <p className="text-sm font-medium text-red-400">Erreur de chargement</p>
              <p className="mt-1 text-xs text-[#6B6050]">
                {error instanceof Error ? error.message : "Une erreur est survenue"}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={48} strokeWidth={1.2} className="mb-3 text-[#3A3530]" />
              <p className="text-sm font-medium text-[#6B6050]">Aucun utilisateur trouvé</p>
              {search.trim() && (
                <p className="mt-1 text-xs text-[#6B6050]">Essayez de modifier votre recherche</p>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">XP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">Bières</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">Duels</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">Inscrit le</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3A3530]/50">
                    {users.map((user, idx) => {
                      const level = getLevel(user.xp);
                      const isBanned = user.is_banned ?? false;
                      const isSelected = selectedUserId === user.id;
                      const isConfirmingBan = confirmBanId === user.id;

                      return (
                        <tr
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(isSelected ? null : user.id);
                            setConfirmBanId(null);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#E08840]/8 border-l-2 border-l-[#E08840]"
                              : idx % 2 === 1
                                ? "bg-[#141210]/30 hover:bg-[#3A3530]/20"
                                : "hover:bg-[#3A3530]/20"
                          } ${isBanned ? "opacity-60" : ""}`}
                        >
                          {/* Username */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-full bg-[#3A3530] flex items-center justify-center shrink-0">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-[#A89888]">
                                    {(user.username || "?")[0].toUpperCase()}
                                  </span>
                                )}
                                {isBanned && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-[8px]">🚫</span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-[#F5E6D3] truncate">{user.username}</p>
                                  {isBanned && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400">
                                      BANNI
                                    </span>
                                  )}
                                </div>
                                {user.display_name && (
                                  <p className="text-xs text-[#6B6050] truncate">{user.display_name}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* XP + Level */}
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

                          {/* Beers */}
                          <td className="px-4 py-3 text-sm text-[#F5E6D3] tabular-nums whitespace-nowrap">
                            {user.beers_tasted}
                          </td>

                          {/* Duels */}
                          <td className="px-4 py-3 text-sm text-[#F5E6D3] tabular-nums whitespace-nowrap">
                            {user.duels_played}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-sm text-[#A89888] whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* XP Button */}
                              <button
                                onClick={(e) => openXpModal(user, e)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F0C460]/10 hover:bg-[#F0C460]/20 text-[#F0C460] text-xs font-semibold rounded-lg transition-colors"
                                title="Ajuster l'XP"
                              >
                                <SlidersHorizontal size={12} />
                                XP
                              </button>

                              {/* Ban Button */}
                              {isConfirmingBan ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-[#A89888]">
                                    {isBanned ? "Débannir ?" : "Bannir ?"}
                                  </span>
                                  <button
                                    onClick={(e) => handleToggleBan(user.id, e)}
                                    disabled={admin.togglingBan}
                                    className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                  >
                                    {admin.togglingBan ? <Loader2 size={10} className="animate-spin" /> : "Oui"}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmBanId(null); }}
                                    className="px-2 py-1 text-xs text-[#6B6050] hover:text-[#A89888] rounded transition-colors"
                                  >
                                    Non
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleToggleBan(user.id, e)}
                                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                                    isBanned
                                      ? "text-[#4CAF50] bg-[#4CAF50]/10 hover:bg-[#4CAF50]/20"
                                      : "text-[#6B6050] hover:text-red-400 hover:bg-red-400/10"
                                  }`}
                                  title={isBanned ? "Débannir" : "Bannir"}
                                >
                                  {isBanned ? <Shield size={13} /> : <ShieldOff size={13} />}
                                </button>
                              )}

                              {/* Detail arrow */}
                              <ChevronRight
                                size={14}
                                className={`transition-transform text-[#6B6050] ${isSelected ? "rotate-90 text-[#E08840]" : ""}`}
                              />
                            </div>
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
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Detail Panel (slide-over droit)            */}
      {/* ═══════════════════════════════════════════ */}
      {selectedUserId && (
        <>
          {/* Backdrop mobile */}
          <div
            className="fixed inset-0 z-30 lg:hidden bg-black/40"
            onClick={() => setSelectedUserId(null)}
          />
          <aside className="fixed right-0 top-0 z-40 h-screen w-80 lg:w-96 bg-[#1A1814] border-l border-[#3A3530] overflow-y-auto shadow-2xl lg:relative lg:shadow-none lg:h-auto lg:sticky lg:top-0">
            {/* Header du panel */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#3A3530]">
              <h3 className="text-sm font-bold text-[#F5E6D3]">Profil utilisateur</h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[#E08840]" />
              </div>
            ) : userDetail ? (
              <div className="px-5 py-5 space-y-6">
                {/* Avatar + infos */}
                <div className="flex items-start gap-4">
                  <div className="relative w-14 h-14 rounded-full bg-[#3A3530] flex items-center justify-center shrink-0 overflow-hidden">
                    {userDetail.profile.avatar_url ? (
                      <img src={userDetail.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-[#A89888]">
                        {(userDetail.profile.username || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#F5E6D3] truncate">
                      {userDetail.profile.display_name || userDetail.profile.username}
                    </p>
                    <p className="text-xs text-[#6B6050]">@{userDetail.profile.username}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {(() => {
                        const lvl = getLevel(userDetail.profile.xp);
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#F0C460]/10 text-[#F0C460]">
                            {lvl.icon} Niveau {lvl.level}
                          </span>
                        );
                      })()}
                      {userDetail.profile.is_banned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/15 text-red-400">
                          🚫 BANNI
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barre de progression XP */}
                {(() => {
                  const xp = userDetail.profile.xp;
                  const lvl = getLevel(xp);
                  const next = getNextLevel(xp);
                  const pct = getLevelProgress(xp);
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-xs text-[#A89888]">
                        <span className="font-semibold text-[#F0C460]">{xp.toLocaleString("fr-FR")} XP</span>
                        {next && <span>→ {next.icon} Nv.{next.level} ({next.min.toLocaleString("fr-FR")} XP)</span>}
                      </div>
                      <div className="h-2 bg-[#3A3530] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F0C460] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {!next && <p className="text-xs text-[#6B6050] mt-1 text-center">Niveau maximum atteint 🎉</p>}
                    </div>
                  );
                })()}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Beer, label: "Bières", value: userDetail.profile.beers_tasted, color: "#E08840" },
                    { icon: Swords, label: "Duels", value: userDetail.profile.duels_played, color: "#A78BFA" },
                    { icon: Camera, label: "Photos", value: userDetail.profile.photos_taken, color: "#4ECDC4" },
                    { icon: Calendar, label: "Inscrit", value: formatDate(userDetail.profile.created_at), color: "#F0C460" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center gap-2.5 p-2.5 bg-[#141210] rounded-lg">
                      <Icon size={14} style={{ color }} className="shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B6050] uppercase tracking-wider">{label}</p>
                        <p className="text-xs font-bold text-[#F5E6D3]">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats alerte (glupps/jour) */}
                {userDetail.stats && (
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2 py-1 bg-[#141210] rounded text-[#A89888]">
                      Aujourd&apos;hui : {userDetail.stats.glupps_today} glupps · {userDetail.stats.duels_today} duels
                    </span>
                    <span className="px-2 py-1 bg-[#141210] rounded text-[#A89888]">
                      7j : {userDetail.stats.glupps_week} glupps
                    </span>
                    {userDetail.stats.glupps_today > 10 && (
                      <span className="px-2 py-1 bg-red-500/15 rounded text-red-400 font-semibold">
                        ⚠️ Activité suspecte
                      </span>
                    )}
                  </div>
                )}

                {/* Tabs */}
                <div className="flex bg-[#141210] rounded-lg p-0.5 border border-[#3A3530]">
                  {[
                    { key: "beerdex" as const, label: "Beerdex", icon: Beer },
                    { key: "activity" as const, label: "Activité", icon: Activity },
                    { key: "trophies" as const, label: "Trophées", icon: Trophy },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setDetailTab(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold rounded-md transition-colors ${
                        detailTab === key ? "bg-[#3A3530] text-[#F5E6D3]" : "text-[#6B6050] hover:text-[#A89888]"
                      }`}
                    >
                      <Icon size={11} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab: Beerdex */}
                {detailTab === "beerdex" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-[#A89888] uppercase tracking-wider">
                        Beerdex ({userDetail.stats?.total_beers || userDetail.recent_beers.length})
                      </h4>
                      <button
                        onClick={() => { setShowAddBeerModal(true); setAddBeerSearch(""); setAddBeerComment(""); setAddBeerError(null); }}
                        className="flex items-center gap-1 px-2 py-1 bg-[#E08840]/10 text-[#E08840] text-[10px] font-semibold rounded-lg hover:bg-[#E08840]/20 transition-colors"
                      >
                        <Plus size={10} />
                        Ajouter
                      </button>
                    </div>
                    {userDetail.recent_beers.length === 0 ? (
                      <p className="text-xs text-[#6B6050] italic">Aucune bière goûtée</p>
                    ) : (
                      <div className="space-y-1.5">
                        {userDetail.recent_beers.map((b: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-[#141210] rounded-lg group">
                            <span className="text-sm shrink-0">{RARITY_EMOJI[b.rarity] ?? "⚪"}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-[#F5E6D3] truncate">{b.beer_name}</p>
                              <p className="text-[9px] text-[#6B6050] truncate">{b.brewery}</p>
                            </div>
                            <span className="text-[9px] text-[#6B6050] shrink-0">{timeAgo(b.tasted_at)}</span>
                            <button
                              onClick={() => setRemoveBeerTarget({ beerId: b.beer_id, beerName: b.beer_name })}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#6B6050] hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                              title="Retirer du beerdex"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Activity */}
                {detailTab === "activity" && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-3">
                      Activité récente
                    </h4>
                    {userDetail.recent_activity && userDetail.recent_activity.length > 0 ? (
                      <div className="space-y-1.5">
                        {userDetail.recent_activity.map((a: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-[#141210] rounded-lg">
                            <span className="text-sm shrink-0 mt-0.5">
                              {a.activity_type === "glupp" ? "🍺" : a.activity_type === "duel" ? "⚔️" : a.activity_type === "trophy" ? "🏆" : a.activity_type === "level_up" ? "📈" : "📌"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] text-[#F5E6D3]">
                                <span className="font-semibold capitalize">{a.activity_type}</span>
                                {a.beer_name && <span className="text-[#E08840]"> — {a.beer_name}</span>}
                              </p>
                              {a.metadata && (
                                <p className="text-[9px] text-[#6B6050] truncate">
                                  {a.metadata.xp ? `+${a.metadata.xp} XP` : ""}
                                  {a.metadata.bar ? ` · ${a.metadata.bar}` : ""}
                                  {a.metadata.trophy_name ? a.metadata.trophy_name : ""}
                                  {a.metadata.level_name ? `Niveau ${a.metadata.level_name}` : ""}
                                </p>
                              )}
                            </div>
                            <span className="text-[9px] text-[#6B6050] shrink-0">{timeAgo(a.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6B6050] italic">Aucune activité</p>
                    )}
                  </div>
                )}

                {/* Tab: Trophées */}
                {detailTab === "trophies" && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-3">
                      Trophées ({userDetail.trophies.length})
                    </h4>
                    {userDetail.trophies.length === 0 ? (
                      <p className="text-xs text-[#6B6050] italic">Aucun trophée obtenu</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {userDetail.trophies.map((t: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-[#141210] rounded-lg">
                            <span className="text-lg shrink-0">{t.emoji}</span>
                            <div>
                              <p className="text-[10px] font-medium text-[#F5E6D3] leading-tight">{t.name}</p>
                              {t.completed_at && <p className="text-[8px] text-[#6B6050]">{timeAgo(t.completed_at)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions rapides */}
                <div className="border-t border-[#3A3530] pt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-3">
                    Actions
                  </h4>
                  <button
                    onClick={() => selectedUser && openXpModal(selectedUser)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#F0C460]/10 hover:bg-[#F0C460]/20 text-[#F0C460] text-sm font-semibold rounded-lg transition-colors"
                  >
                    <SlidersHorizontal size={14} />
                    Ajuster l&apos;XP
                  </button>
                  <button
                    onClick={() => {
                      if (selectedUser) {
                        setConfirmBanId(selectedUser.id);
                        setSelectedUserId(null);
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      userDetail.profile.is_banned
                        ? "bg-[#4CAF50]/10 hover:bg-[#4CAF50]/20 text-[#4CAF50]"
                        : "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    }`}
                  >
                    {userDetail.profile.is_banned ? <Shield size={14} /> : <ShieldOff size={14} />}
                    {userDetail.profile.is_banned ? "Débannir" : "Bannir cet utilisateur"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Trophy size={36} strokeWidth={1.2} className="mb-2 text-[#3A3530]" />
                <p className="text-sm text-[#6B6050]">Données indisponibles</p>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* XP Modal                                   */}
      {/* ═══════════════════════════════════════════ */}
      {xpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeXpModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3530]">
              <div>
                <h2 className="text-base font-bold text-[#F5E6D3]">Ajuster l'XP</h2>
                <p className="text-xs text-[#A89888] mt-0.5">
                  {xpModal.user.username}
                  {xpModal.user.display_name ? ` (${xpModal.user.display_name})` : ""}
                  {" — "}
                  <span className="text-[#F0C460]">{xpModal.user.xp.toLocaleString("fr-FR")} XP actuels</span>
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
                  Montant XP <span className="normal-case text-[#6B6050]">(négatif pour retirer)</span>
                </label>
                <input
                  type="number"
                  min={-100000}
                  max={100000}
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="ex: 500 ou -100"
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors tabular-nums"
                />
                {/* Aperçu XP final */}
                {xpAmount !== "" && xpAmount !== 0 && (
                  <p className={`mt-1.5 text-xs font-medium ${
                    xpModal.user.xp + Number(xpAmount) < 0
                      ? "text-red-400"
                      : Number(xpAmount) < 0
                        ? "text-orange-400"
                        : "text-[#4CAF50]"
                  }`}>
                    → Résultat estimé :{" "}
                    <span className="font-bold">
                      {Math.max(0, xpModal.user.xp + Number(xpAmount)).toLocaleString("fr-FR")} XP
                    </span>
                    {" "}
                    {(() => {
                      const finalXp = Math.max(0, xpModal.user.xp + Number(xpAmount));
                      const newLevel = getLevel(finalXp);
                      const oldLevel = getLevel(xpModal.user.xp);
                      if (newLevel.level !== oldLevel.level) {
                        return (
                          <span className="text-[#F0C460]">
                            → {newLevel.icon} Nv.{newLevel.level}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Raison
                </label>
                <textarea
                  value={xpReason}
                  onChange={(e) => setXpReason(e.target.value)}
                  placeholder="Pourquoi cet ajustement..."
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
                  xpAmount === "" ||
                  xpAmount === 0 ||
                  !xpReason.trim() ||
                  (xpModal.user.xp + Number(xpAmount) < 0)
                }
                className={`flex items-center gap-2 px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-[#141210] text-sm font-bold rounded-lg transition-colors ${
                  Number(xpAmount) < 0
                    ? "bg-red-400 hover:bg-red-400/90"
                    : "bg-[#F0C460] hover:bg-[#F0C460]/90"
                }`}
              >
                {admin.awardingXP ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <SlidersHorizontal size={14} />
                )}
                {Number(xpAmount) < 0 ? "Retirer" : "Attribuer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Add Beer to User Modal                     */}
      {/* ═══════════════════════════════════════════ */}
      {showAddBeerModal && selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddBeerModal(false)} />
          <div className="relative w-full max-w-md bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3530]">
              <div>
                <h2 className="text-base font-bold text-[#F5E6D3]">Ajouter une bière</h2>
                <p className="text-xs text-[#6B6050] mt-0.5">au beerdex de {selectedUser?.username}</p>
              </div>
              <button onClick={() => setShowAddBeerModal(false)} className="w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addBeerError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{addBeerError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">Rechercher une bière</label>
                <input
                  type="text"
                  value={addBeerSearch}
                  onChange={(e) => setAddBeerSearch(e.target.value)}
                  placeholder="Nom ou brasserie..."
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 transition-colors"
                />
              </div>
              {beerSearchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {beerSearchResults.map((beer: any) => (
                    <button
                      key={beer.id}
                      onClick={async () => {
                        setAddBeerError(null);
                        try {
                          await admin.addBeerToUser(selectedUserId!, beer.id, addBeerComment.trim() || undefined);
                          setShowAddBeerModal(false);
                        } catch (err) {
                          setAddBeerError(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                      disabled={admin.addingBeerToUser}
                      className="w-full flex items-center gap-2.5 p-2.5 bg-[#141210] rounded-lg text-left hover:bg-[#E08840]/10 hover:border-[#E08840]/30 border border-transparent transition-colors disabled:opacity-50"
                    >
                      <span className="text-sm">{RARITY_EMOJI[beer.rarity] ?? "⚪"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#F5E6D3] truncate">{beer.country} {beer.name}</p>
                        <p className="text-[10px] text-[#6B6050] truncate">{beer.brewery}</p>
                      </div>
                      <Plus size={14} className="text-[#E08840] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">Commentaire (optionnel)</label>
                <input
                  type="text"
                  value={addBeerComment}
                  onChange={(e) => setAddBeerComment(e.target.value)}
                  placeholder="Raison de l'ajout..."
                  className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Remove Beer Confirmation Modal              */}
      {/* ═══════════════════════════════════════════ */}
      {removeBeerTarget && selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRemoveBeerTarget(null)} />
          <div className="relative w-full max-w-sm bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className="font-bold text-[#F5E6D3]">Retirer du Beerdex</h3>
              <p className="text-xs text-[#A89888] mt-1">
                Retirer <span className="text-[#E08840] font-semibold">{removeBeerTarget.beerName}</span> du beerdex de {selectedUser?.username} ? L&apos;XP correspondante sera retirée.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                <MessageSquare size={10} className="inline mr-1" />
                Commentaire pour l&apos;utilisateur
              </label>
              <input
                type="text"
                value={removeBeerComment}
                onChange={(e) => setRemoveBeerComment(e.target.value)}
                placeholder="Ex: Bière ajoutée par erreur"
                className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRemoveBeerTarget(null); setRemoveBeerComment(""); }}
                className="flex-1 px-4 py-2.5 text-sm text-[#A89888] hover:text-[#F5E6D3] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    await admin.removeBeerFromUser(selectedUserId!, removeBeerTarget.beerId, removeBeerComment.trim() || undefined);
                    setRemoveBeerTarget(null);
                    setRemoveBeerComment("");
                  } catch (err) {
                    console.error(err);
                  }
                }}
                disabled={admin.removingBeerFromUser}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {admin.removingBeerFromUser ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
