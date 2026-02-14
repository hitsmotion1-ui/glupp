"use client";

import { useRanking } from "@/lib/hooks/useRanking";
import { useAppStore } from "@/lib/store/useAppStore";
import { BeerRow } from "@/components/beer/BeerRow";
import { BeerModal } from "@/components/beer/BeerModal";
import { GluppModal } from "@/components/beer/GluppModal";
import { XPToast } from "@/components/gamification/XPToast";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";

const STYLE_FILTERS = [
  "All",
  "IPA",
  "Stout",
  "Tripel",
  "Lager",
  "Belgian",
  "Saison",
  "Hefeweizen",
  "Pale Ale",
];

export default function RankingPage() {
  const { rankings, loading, filterStyle, setFilterStyle } = useRanking();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Title */}
      <div className="px-4 mb-4">
        <h2 className="font-display text-xl font-bold text-glupp-cream">
          Classement Mondial
        </h2>
        <p className="text-xs text-glupp-text-muted mt-1">
          {rankings.length} bieres classees par ELO
        </p>
      </div>

      {/* Style filters */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {STYLE_FILTERS.map((style) => (
          <Pill
            key={style}
            label={style}
            active={
              style === "All" ? !filterStyle : filterStyle === style
            }
            onClick={() =>
              setFilterStyle(style === "All" ? null : style)
            }
          />
        ))}
      </div>

      {/* Ranking list */}
      <div>
        {rankings.map((beer, index) => (
          <BeerRow
            key={beer.id}
            beer={beer}
            rank={index + 1}
            onClick={() => openBeerModal(beer.id)}
          />
        ))}
      </div>

      {rankings.length === 0 && (
        <div className="text-center py-12 text-glupp-text-muted">
          Aucune biere trouvee pour ce filtre.
        </div>
      )}

      {/* Modals */}
      <BeerModal />
      <GluppModal />
      <XPToast />
    </div>
  );
}
