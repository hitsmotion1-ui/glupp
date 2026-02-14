"use client";

import { useCollection } from "@/lib/hooks/useCollection";
import { useAppStore } from "@/lib/store/useAppStore";
import { BeerCard } from "@/components/beer/BeerCard";
import { BeerModal } from "@/components/beer/BeerModal";
import { GluppModal } from "@/components/beer/GluppModal";
import { XPToast } from "@/components/gamification/XPToast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";

const RARITY_FILTERS: { key: Rarity | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "common", label: "Communes" },
  { key: "rare", label: "Rares" },
  { key: "epic", label: "Epiques" },
  { key: "legendary", label: "Legendaires" },
];

export default function CollectionPage() {
  const {
    filteredBeers,
    tastedIds,
    loading,
    stats,
    filter,
    setFilter,
    refetch,
  } = useCollection();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

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
    <div className="py-6">
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

      {/* Rarity filters */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {RARITY_FILTERS.map((rf) => (
          <Pill
            key={rf.key}
            label={rf.label}
            active={filter.rarity === rf.key}
            onClick={() =>
              setFilter({ ...filter, rarity: rf.key })
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
        {filteredBeers.map((beer) => (
          <BeerCard
            key={beer.id}
            beer={beer}
            tasted={tastedIds.has(beer.id)}
            onClick={() => openBeerModal(beer.id)}
          />
        ))}
      </div>

      {filteredBeers.length === 0 && (
        <div className="text-center py-12 text-glupp-text-muted">
          Aucune biere trouvee.
        </div>
      )}

      {/* Modals */}
      <BeerModal />
      <GluppModal onGlupped={refetch} />
      <XPToast />
    </div>
  );
}
