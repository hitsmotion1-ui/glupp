"use client";

import { useState, useMemo, useCallback } from "react";
import { useCollection } from "@/lib/hooks/useCollection";
import { useAppStore } from "@/lib/store/useAppStore";
import { BeerCard } from "@/components/beer/BeerCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";
import { Search, ChevronDown } from "lucide-react";

const RARITY_FILTERS: { key: Rarity | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "common", label: "Communes" },
  { key: "rare", label: "Rares" },
  { key: "epic", label: "Epiques" },
  { key: "legendary", label: "Legendaires" },
];

const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary"];
const PAGE_SIZE = 60; // Load 60 at a time (20 rows of 3)

type SortMode = "tasted_first" | "rarity" | "name";

export default function CollectionPage() {
  const {
    filteredBeers,
    tastedIds,
    loading,
    stats,
    filter,
    setFilter,
  } = useCollection();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [sortMode, setSortMode] = useState<SortMode>("tasted_first");

  // Sort beers: tasted first, then by rarity order, then name
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
          legendary: 0,
          epic: 1,
          rare: 2,
          common: 3,
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

  // Paginated slice
  const visibleBeers = useMemo(
    () => sortedBeers.slice(0, displayCount),
    [sortedBeers, displayCount]
  );

  const hasMore = displayCount < sortedBeers.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  // Reset display count when filter changes
  const handleFilterChange = useCallback(
    (newFilter: typeof filter) => {
      setDisplayCount(PAGE_SIZE);
      setFilter(newFilter);
    },
    [setFilter]
  );

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
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
    <div className="py-6 pb-24">
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-display text-xl font-bold text-glupp-cream">
            Ma Collection
          </h2>
          <span className="text-sm text-glupp-text-soft">
            {stats.tasted}/{stats.total}
          </span>
        </div>
        <ProgressBar
          value={stats.percentage}
          label={`${stats.percentage}% complete`}
          subLabel={`${stats.tasted} bieres gluppees`}
        />
      </div>

      {/* Rarity counters */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4">
        {RARITY_ORDER.map((rarity) => {
          const config = RARITY_CONFIG[rarity];
          const data = stats.byRarity[rarity];
          return (
            <button
              key={rarity}
              onClick={() =>
                handleFilterChange({
                  ...filter,
                  rarity: filter.rarity === rarity ? "all" : rarity,
                })
              }
              className={`rounded-glupp p-2 text-center transition-all border ${
                filter.rarity === rarity
                  ? "border-current"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: `${config.color}18`, color: config.color }}
            >
              <p className="text-lg font-bold leading-tight">
                {data?.tasted || 0}
                <span className="text-xs font-normal opacity-60">
                  /{data?.total || 0}
                </span>
              </p>
              <p className="text-[9px] opacity-80">{config.label}</p>
            </button>
          );
        })}
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
