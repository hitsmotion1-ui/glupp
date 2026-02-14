"use client";

import { useState } from "react";
import { useCollection } from "@/lib/hooks/useCollection";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { BeerCard } from "@/components/beer/BeerCard";
import { BeerModal } from "@/components/beer/BeerModal";
import { GluppModal } from "@/components/beer/GluppModal";
import { BarcodeScanner } from "@/components/beer/BarcodeScanner";
import { XPToast } from "@/components/gamification/XPToast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";
import { Search, ScanLine } from "lucide-react";
import type { Beer } from "@/types";

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
  const openGluppModal = useAppStore((s) => s.openGluppModal);

  const [showScanner, setShowScanner] = useState(false);
  const [scanToast, setScanToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);

    // Look up beer by barcode
    const { data, error } = await supabase
      .from("beers")
      .select("*")
      .eq("barcode", barcode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      setScanToast({
        message: "Erreur lors de la recherche.",
        type: "error",
      });
      return;
    }

    if (data) {
      const beer = data as Beer;
      if (tastedIds.has(beer.id)) {
        // Already tasted — open the beer modal to see details
        openBeerModal(beer.id);
        setScanToast({
          message: `${beer.name} — deja dans ta collection !`,
          type: "info",
        });
      } else {
        // Not yet tasted — open glupp modal directly
        openGluppModal(beer.id);
      }
    } else {
      setScanToast({
        message: `Code-barres "${barcode}" non reconnu. Essaie la recherche manuelle.`,
        type: "error",
      });
    }
  };

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

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            placeholder="Rechercher une biere..."
            className="w-full pl-10 pr-4 py-2.5 bg-glupp-card border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>
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

      {/* Floating scan button */}
      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-5 py-3 bg-glupp-accent text-glupp-bg font-semibold rounded-full shadow-glupp-accent hover:brightness-110 active:scale-95 transition-all"
      >
        <ScanLine className="w-5 h-5" />
        Scanner
      </button>

      {/* Scanner overlay */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan result toast */}
      <Toast
        message={scanToast?.message || ""}
        type={scanToast?.type}
        isVisible={!!scanToast}
        onClose={() => setScanToast(null)}
      />

      {/* Modals */}
      <BeerModal />
      <GluppModal onGlupped={refetch} />
      <XPToast />
    </div>
  );
}
