"use client";

import { useState, useMemo, useCallback } from "react";
import { useCollection } from "@/lib/hooks/useCollection";
import { useMyTop } from "@/lib/hooks/useMyTop";
import { useRanking } from "@/lib/hooks/useRanking";
import { useRegionFilter } from "@/lib/hooks/useRegionFilter";
import { matchesNormalizedRegion, matchesNormalizedDepartment } from "@/lib/utils/regionMapping";
import { useAppStore } from "@/lib/store/useAppStore";
import { useProfile } from "@/lib/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { BeerCard } from "@/components/beer/BeerCard";
import { BeerRow } from "@/components/beer/BeerRow";
import { RegionFilter } from "@/components/collection/RegionFilter";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { RARITY_CONFIG, type Rarity, formatNumber } from "@/lib/utils/xp";
import { Search, ChevronDown, Trophy, BookOpen, Globe, Crown, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RARITY_FILTERS: { key: Rarity | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "common", label: "Communes" },
  { key: "rare", label: "Rares" },
  { key: "epic", label: "Epiques" },
  { key: "legendary", label: "Legendaires" },
];

const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary"];
const PAGE_SIZE = 60;

type ViewMode = "top" | "beerdex" | "mondial";
type SortMode = "tasted_first" | "rarity" | "name";

export default function CollectionPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("top");

  return (
    <div className="py-6 pb-24">
      {/* Header */}
      <HeaderSection />

      {/* View toggle */}
      <div className="flex gap-2 px-4 mb-4">
        {([
          { key: "top" as const, label: "Mon Top", icon: Trophy },
          { key: "beerdex" as const, label: "Beerdex", icon: BookOpen },
          { key: "mondial" as const, label: "Mondial", icon: Globe },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-glupp text-xs font-medium transition-all ${
              viewMode === key
                ? "bg-glupp-accent text-glupp-bg"
                : "bg-glupp-card border border-glupp-border text-glupp-text-soft hover:border-glupp-accent"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* View content */}
      <AnimatePresence mode="wait">
        {viewMode === "top" && (
          <motion.div
            key="top"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <MyTopView />
          </motion.div>
        )}
        {viewMode === "beerdex" && (
          <motion.div
            key="beerdex"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <BeerdexView />
          </motion.div>
        )}
        {viewMode === "mondial" && (
          <motion.div
            key="mondial"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <MondialView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Header Section ─── */
function HeaderSection() {
  const { stats, loading } = useCollection();
  const { profile } = useProfile();

  if (loading) {
    return (
      <div className="px-4 mb-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-display text-xl font-bold text-glupp-cream">
          Mon Classement
        </h2>
        {profile && <LevelBadge xp={profile.xp} />}
      </div>
      <p className="text-xs text-glupp-text-muted mb-2">
        {stats.tasted} bieres gluppees · {profile ? formatNumber(profile.xp) : 0} XP
      </p>

      {/* Rarity counters */}
      <div className="grid grid-cols-4 gap-2">
        {RARITY_ORDER.map((rarity) => {
          const config = RARITY_CONFIG[rarity];
          const data = stats.byRarity[rarity];
          return (
            <div
              key={rarity}
              className="rounded-glupp p-2 text-center"
              style={{ backgroundColor: `${config.color}18`, color: config.color }}
            >
              <p className="text-lg font-bold leading-tight">
                {data?.tasted || 0}
                <span className="text-xs font-normal opacity-60">
                  /{data?.total || 0}
                </span>
              </p>
              <p className="text-[9px] opacity-80">{config.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mon Top View ─── */
function MyTopView() {
  const { myTopBeers, loading } = useMyTop();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (myTopBeers.length < 2) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Swords size={48} className="text-glupp-accent mb-4" />
        </motion.div>
        <h3 className="font-display text-lg font-bold text-glupp-cream mb-2">
          Ton classement perso
        </h3>
        <p className="text-sm text-glupp-text-soft max-w-xs">
          Gluppe des bieres et joue des duels pour voir ton classement personnel ici !
        </p>
      </div>
    );
  }

  const topBeer = myTopBeers[0];
  const rest = myTopBeers.slice(1);

  return (
    <div>
      {/* #1 — Premium card */}
      <div className="px-4 mb-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => openBeerModal(topBeer.id)}
          className="w-full relative p-4 rounded-glupp-lg border-2 border-glupp-gold/40 bg-gradient-to-br from-glupp-gold/10 to-transparent text-left"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">
              <Crown size={28} className="text-glupp-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-glupp-gold font-medium mb-0.5">
                #1 — Ta biere preferee
              </p>
              <p className="font-display text-lg font-bold text-glupp-cream truncate">
                {topBeer.name}
              </p>
              <p className="text-xs text-glupp-text-muted truncate">
                {topBeer.brewery} · {topBeer.country}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-glupp-gold">{topBeer.wins}W</p>
              <p className="text-[10px] text-glupp-text-muted">{topBeer.duels}D</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Rest of the list */}
      <div>
        {rest.map((beer, index) => (
          <BeerRow
            key={beer.id}
            beer={beer}
            rank={index + 2}
            onClick={() => openBeerModal(beer.id)}
            tasted
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Beerdex View (original Collection) ─── */
function BeerdexView() {
  const {
    filteredBeers: allFilteredBeers,
    tastedIds,
    loading,
    filter,
    setFilter,
    allBeers,
  } = useCollection();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  const regionFilter = useRegionFilter();

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [sortMode, setSortMode] = useState<SortMode>("tasted_first");

  // Apply region filter on top of existing filters
  const filteredBeers = useMemo(() => {
    let beers = allFilteredBeers;
    if (regionFilter.selectedCountry) {
      beers = beers.filter((b) => b.country_code === regionFilter.selectedCountry);
    }
    if (regionFilter.selectedRegion) {
      if (regionFilter.regionMode === "departments") {
        beers = beers.filter((b) =>
          matchesNormalizedDepartment(b.region, regionFilter.selectedRegion!, b.country_code)
        );
      } else {
        beers = beers.filter((b) =>
          matchesNormalizedRegion(b.region, regionFilter.selectedRegion!, b.country_code)
        );
      }
    }
    return beers;
  }, [allFilteredBeers, regionFilter.selectedCountry, regionFilter.selectedRegion, regionFilter.regionMode]);

  // Country stats for RegionFilter
  const countryStats = useMemo(() => {
    const m = new Map<string, { tasted: number; total: number }>();
    for (const b of allBeers) {
      const s = m.get(b.country_code) || { tasted: 0, total: 0 };
      s.total++;
      if (tastedIds.has(b.id)) s.tasted++;
      m.set(b.country_code, s);
    }
    return m;
  }, [allBeers, tastedIds]);

  const sortedBeers = useMemo(() => {
    const sorted = [...filteredBeers];
    switch (sortMode) {
      case "tasted_first":
        sorted.sort((a, b) => {
          const aTasted = tastedIds.has(a.id) ? 0 : 1;
          const bTasted = tastedIds.has(b.id) ? 0 : 1;
          if (aTasted !== bTasted) return aTasted - bTasted;
          return a.name.localeCompare(b.name);
        });
        break;
      case "rarity": {
        const rarityRank: Record<string, number> = {
          legendary: 0, epic: 1, rare: 2, common: 3,
        };
        sorted.sort((a, b) => {
          const rA = rarityRank[a.rarity] ?? 4;
          const rB = rarityRank[b.rarity] ?? 4;
          if (rA !== rB) return rA - rB;
          return a.name.localeCompare(b.name);
        });
        break;
      }
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [filteredBeers, tastedIds, sortMode]);

  const visibleBeers = useMemo(
    () => sortedBeers.slice(0, displayCount),
    [sortedBeers, displayCount]
  );
  const hasMore = displayCount < sortedBeers.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleFilterChange = useCallback(
    (newFilter: typeof filter) => {
      setDisplayCount(PAGE_SIZE);
      setFilter(newFilter);
    },
    [setFilter]
  );

  if (loading) {
    return (
      <div className="px-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Region Filter */}
      <div className="mb-3">
        <RegionFilter {...regionFilter} countryStats={countryStats} />
      </div>

      {/* Search bar + Sort */}
      <div className="px-4 mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) =>
              handleFilterChange({ ...filter, search: e.target.value })
            }
            placeholder="Rechercher une biere..."
            className="w-full pl-10 pr-4 py-2.5 bg-glupp-card border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="px-3 py-2.5 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-text-soft focus:outline-none focus:border-glupp-accent transition-colors appearance-none"
        >
          <option value="tasted_first">Gluppees</option>
          <option value="rarity">Rarete</option>
          <option value="name">A-Z</option>
        </select>
      </div>

      {/* Rarity filters */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {RARITY_FILTERS.map((rf) => (
          <Pill
            key={rf.key}
            label={rf.label}
            active={filter.rarity === rf.key}
            onClick={() =>
              handleFilterChange({ ...filter, rarity: rf.key })
            }
            color={
              rf.key !== "all"
                ? RARITY_CONFIG[rf.key as Rarity]?.color
                : undefined
            }
          />
        ))}
      </div>

      {/* Beer grid */}
      <div className="grid grid-cols-3 gap-3 px-4">
        {visibleBeers.map((beer) => (
          <BeerCard
            key={beer.id}
            beer={beer}
            tasted={tastedIds.has(beer.id)}
            onClick={() => openBeerModal(beer.id)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center mt-6 px-4">
          <button
            onClick={loadMore}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-glupp-card border border-glupp-border rounded-glupp text-sm text-glupp-text-soft hover:border-glupp-accent hover:text-glupp-cream transition-colors"
          >
            <ChevronDown size={16} />
            Voir plus ({sortedBeers.length - displayCount} restantes)
          </button>
        </div>
      )}

      {filteredBeers.length === 0 && (
        <div className="text-center py-12 text-glupp-text-muted">
          Aucune biere trouvee.
        </div>
      )}
    </div>
  );
}

/* ─── Mondial View (original Ranking) ─── */
function MondialView() {
  const {
    rankings,
    loading,
    filterStyle,
    setFilterStyle,
    sortBy,
    setSortBy,
    availableStyles,
  } = useRanking();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  const regionFilter = useRegionFilter();

  // Fetch user's tasted beer IDs
  const { data: tastedIds } = useQuery({
    queryKey: [...queryKeys.collection.all, "tasted-ids"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("user_beers")
        .select("beer_id")
        .eq("user_id", user.id);
      return new Set((data || []).map((ub) => ub.beer_id));
    },
    staleTime: 5 * 60 * 1000,
  });

  const tastedSet = useMemo(() => tastedIds || new Set<string>(), [tastedIds]);

  // Apply region filter
  const filteredRankings = useMemo(() => {
    let beers = rankings;
    if (regionFilter.selectedCountry) {
      beers = beers.filter((b) => b.country_code === regionFilter.selectedCountry);
    }
    if (regionFilter.selectedRegion) {
      if (regionFilter.regionMode === "departments") {
        beers = beers.filter((b) =>
          matchesNormalizedDepartment(b.region, regionFilter.selectedRegion!, b.country_code)
        );
      } else {
        beers = beers.filter((b) =>
          matchesNormalizedRegion(b.region, regionFilter.selectedRegion!, b.country_code)
        );
      }
    }
    return beers;
  }, [rankings, regionFilter.selectedCountry, regionFilter.selectedRegion, regionFilter.regionMode]);

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Region Filter */}
      <div className="mb-3">
        <RegionFilter {...regionFilter} />
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 px-4 pb-3">
        {([
          { key: "elo" as const, label: "ELO" },
          { key: "name" as const, label: "Nom" },
          { key: "votes" as const, label: "Votes" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-glupp transition-colors ${
              sortBy === key
                ? "bg-glupp-accent text-glupp-bg"
                : "bg-glupp-card text-glupp-text-soft border border-glupp-border hover:border-glupp-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Style filters */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
        <Pill
          label="Tous"
          active={!filterStyle}
          onClick={() => setFilterStyle(null)}
        />
        {availableStyles.map((style) => (
          <Pill
            key={style}
            label={style}
            active={filterStyle === style}
            onClick={() => setFilterStyle(style)}
          />
        ))}
      </div>

      {/* Ranking list */}
      <div>
        {filteredRankings.map((beer, index) => (
          <BeerRow
            key={beer.id}
            beer={beer}
            rank={index + 1}
            onClick={() => openBeerModal(beer.id)}
            tasted={tastedSet.has(beer.id)}
          />
        ))}
      </div>

      {filteredRankings.length === 0 && (
        <div className="text-center py-12 text-glupp-text-muted">
          Aucune biere trouvee pour ce filtre.
        </div>
      )}
    </div>
  );
}
