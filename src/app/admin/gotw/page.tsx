"use client";

import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import type { Beer } from "@/types";
import {
  Star,
  Search,
  Calendar,
  Loader2,
  AlertTriangle,
  Check,
  Users,
  Zap,
  ChevronDown,
} from "lucide-react";

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function getNextSunday(mondayStr: string): string {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

function formatWeek(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → ${e.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
}

const RARITY_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  common: { label: "Commune", color: "#8D7C6C", emoji: "⚪" },
  rare: { label: "Rare", color: "#4ECDC4", emoji: "🔵" },
  epic: { label: "Épique", color: "#A78BFA", emoji: "🟣" },
  legendary: { label: "Légendaire", color: "#F0C460", emoji: "🌟" },
};

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function AdminGOTWPage() {
  const admin = useAdmin();
  const { data: gotwHistory = [], isLoading: loadingGOTW } = admin.useAdminGOTW();

  // ── Formulaire ──
  const [beerSearch, setBeerSearch] = useState("");
  const [debouncedBeerSearch, setDebouncedBeerSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [weekStart, setWeekStart] = useState(getNextMonday());
  const [bonusXp, setBonusXp] = useState(50);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showBeerList, setShowBeerList] = useState(false);

  const weekEnd = getNextSunday(weekStart);

  const { data: beerResults = { beers: [], total: 0 }, isLoading: loadingBeers } = admin.useAdminBeers(
    debouncedBeerSearch || undefined
  );

  const handleBeerSearchChange = useCallback(
    (value: string) => {
      setBeerSearch(value);
      setSelectedBeer(null);
      setShowBeerList(true);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedBeerSearch(value.trim()), 400);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  async function handlePublish() {
    if (!selectedBeer) return;
    setActionError(null);
    setSuccessMsg(null);
    try {
      await admin.setGOTW(selectedBeer.id, weekStart, weekEnd, bonusXp);
      setSuccessMsg(`Glupp of the Week publié : "${selectedBeer.name}" pour la semaine du ${formatWeek(weekStart, weekEnd)}`);
      setSelectedBeer(null);
      setBeerSearch("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de la publication");
    }
  }

  // ── Current GOTW = la plus récente (week_start <= aujourd'hui <= week_end) ──
  const today = new Date().toISOString().split("T")[0];
  const currentGOTW = gotwHistory.find(
    (g) => g.week_start <= today && g.week_end >= today
  );

  return (
    <div className="min-h-screen bg-[#141210]">
      <AdminHeader title="Glupp of the Week" subtitle="Gérer la bière de la semaine" />

      <div className="px-6 py-6 lg:px-8 space-y-8">

        {/* ── GOTW actuel ── */}
        <section>
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-[#F5E6D3] font-display">
            <Star size={18} className="text-[#F0C460]" />
            Semaine en cours
          </h2>

          {loadingGOTW ? (
            <div className="h-28 bg-[#1E1B16] border border-[#3A3530] rounded-xl animate-pulse" />
          ) : currentGOTW ? (
            <div className="p-5 bg-[#1E1B16] border border-[#F0C460]/30 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#F0C460]/15 shrink-0">
                  <Star size={22} className="text-[#F0C460]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <div>
                      <p className="text-lg font-bold text-[#F5E6D3]">{currentGOTW.beer?.name}</p>
                      <p className="text-sm text-[#A89888]">{currentGOTW.beer?.brewery}</p>
                    </div>
                    {currentGOTW.beer && (
                      <span
                        className="mt-0.5 px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: `${RARITY_CONFIG[currentGOTW.beer.rarity]?.color}20`,
                          color: RARITY_CONFIG[currentGOTW.beer.rarity]?.color,
                        }}
                      >
                        {RARITY_CONFIG[currentGOTW.beer.rarity]?.emoji}{" "}
                        {RARITY_CONFIG[currentGOTW.beer.rarity]?.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#A89888]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {formatWeek(currentGOTW.week_start, currentGOTW.week_end)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#F0C460]" />
                      <span className="text-[#F0C460] font-semibold">+{currentGOTW.bonus_xp} XP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} />
                      {currentGOTW.participants} participant{currentGOTW.participants !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-[#1E1B16] border border-[#3A3530] rounded-xl">
              <Star size={36} strokeWidth={1.2} className="mb-2 text-[#3A3530]" />
              <p className="text-sm text-[#6B6050]">Aucun Glupp of the Week cette semaine</p>
            </div>
          )}
        </section>

        {/* ── Formulaire nouveau GOTW ── */}
        <section>
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-[#F5E6D3] font-display">
            <Zap size={18} className="text-[#E08840]" />
            Définir le prochain GOTW
          </h2>

          <div className="p-6 bg-[#1E1B16] border border-[#3A3530] rounded-xl space-y-5">
            {/* Feedback */}
            {actionError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertTriangle size={14} className="shrink-0" />
                {actionError}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-lg text-[#4CAF50] text-sm">
                <Check size={14} className="shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Recherche bière */}
            <div>
              <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                Bière *
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050] pointer-events-none" />
                <input
                  type="text"
                  value={beerSearch}
                  onChange={(e) => handleBeerSearchChange(e.target.value)}
                  onFocus={() => beerSearch && setShowBeerList(true)}
                  placeholder="Rechercher une bière..."
                  className="w-full pl-8 pr-4 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                />
                {beerSearch && (
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6050]" />
                )}
              </div>

              {/* Beer dropdown */}
              {showBeerList && debouncedBeerSearch.length > 0 && !selectedBeer && (
                <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#3A3530] bg-[#141210] divide-y divide-[#3A3530]/50">
                  {loadingBeers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={14} className="animate-spin text-[#E08840]" />
                    </div>
                  ) : beerResults.beers.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[#6B6050] text-center">Aucune bière trouvée</p>
                  ) : (
                    beerResults.beers.slice(0, 8).map((beer) => {
                      const rar = RARITY_CONFIG[beer.rarity];
                      return (
                        <button
                          key={beer.id}
                          onClick={() => {
                            setSelectedBeer(beer);
                            setBeerSearch(`${beer.name} — ${beer.brewery}`);
                            setShowBeerList(false);
                            setDebouncedBeerSearch("");
                            setSuccessMsg(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#3A3530]/50 transition-colors"
                        >
                          <span className="text-base shrink-0">{rar?.emoji ?? "🍺"}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#F5E6D3] truncate">{beer.name}</p>
                            <p className="text-xs text-[#6B6050] truncate">{beer.brewery} · {beer.style}</p>
                          </div>
                          {beer.abv != null && (
                            <span className="text-xs text-[#A89888] shrink-0">{beer.abv}%</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Bière sélectionnée */}
              {selectedBeer && (
                <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-[#E08840]/10 border border-[#E08840]/30 rounded-lg">
                  <span className="text-xl shrink-0">
                    {RARITY_CONFIG[selectedBeer.rarity]?.emoji ?? "🍺"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#F5E6D3]">{selectedBeer.name}</p>
                    <p className="text-xs text-[#A89888]">{selectedBeer.brewery} · {selectedBeer.style}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedBeer(null); setBeerSearch(""); }}
                    className="shrink-0 text-[#6B6050] hover:text-[#A89888] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Semaine + Bonus XP */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Début de semaine *
                </label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Fin de semaine
                </label>
                <input
                  type="date"
                  value={weekEnd}
                  readOnly
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#6B6050] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A89888] uppercase tracking-wider mb-1.5">
                  Bonus XP
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={bonusXp}
                  onChange={(e) => setBonusXp(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
                />
              </div>
            </div>

            {/* Résumé + bouton */}
            {selectedBeer && (
              <div className="pt-2 border-t border-[#3A3530] flex items-center justify-between gap-4">
                <p className="text-xs text-[#A89888]">
                  <span className="font-semibold text-[#F5E6D3]">{selectedBeer.name}</span>
                  {" · "}{formatWeek(weekStart, weekEnd)}
                  {" · "}
                  <span className="text-[#F0C460] font-semibold">+{bonusXp} XP</span>
                </p>
                <button
                  onClick={handlePublish}
                  disabled={admin.settingGOTW || !selectedBeer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#F0C460] hover:bg-[#F0C460]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#141210] text-sm font-bold rounded-lg transition-colors shrink-0"
                >
                  {admin.settingGOTW ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Star size={14} />
                  )}
                  Publier
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Historique ── */}
        <section>
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-[#F5E6D3] font-display">
            <Calendar size={18} className="text-[#4ECDC4]" />
            Historique
          </h2>

          {loadingGOTW ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#1E1B16] border border-[#3A3530] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : gotwHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-[#1E1B16] border border-[#3A3530] rounded-xl">
              <Calendar size={36} strokeWidth={1.2} className="mb-2 text-[#3A3530]" />
              <p className="text-sm text-[#6B6050]">Aucun historique</p>
            </div>
          ) : (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#3A3530]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider">Bière</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider">Semaine</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider">Bonus XP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider">Participants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3530]/50">
                  {gotwHistory.map((g, idx) => {
                    const isCurrentWeek = g.week_start <= today && g.week_end >= today;
                    return (
                      <tr
                        key={g.id}
                        className={`${idx % 2 === 1 ? "bg-[#141210]/30" : ""} ${isCurrentWeek ? "bg-[#F0C460]/5" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {g.beer && (
                              <span className="text-base">{RARITY_CONFIG[g.beer.rarity]?.emoji ?? "🍺"}</span>
                            )}
                            <div>
                              <p className="font-medium text-[#F5E6D3]">{g.beer?.name ?? "—"}</p>
                              <p className="text-xs text-[#6B6050]">{g.beer?.brewery}</p>
                            </div>
                            {isCurrentWeek && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F0C460]/15 text-[#F0C460]">
                                EN COURS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#A89888] whitespace-nowrap">
                          {formatWeek(g.week_start, g.week_end)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-[#F0C460]">+{g.bonus_xp} XP</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-[#F5E6D3]">
                            <Users size={13} className="text-[#6B6050]" />
                            {g.participants}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
