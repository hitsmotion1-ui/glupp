"use client";

import { useState, useMemo } from "react";
import { useMap } from "@/lib/hooks/useMap";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import {
  MapPin,
  Navigation,
  Beer,
  Star,
  Clock,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "list" | "nearby";

export default function MapPage() {
  const { bars, nearbyBars, loadingBars, mapState } = useMap();
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  const [viewMode, setViewMode] = useState<ViewMode>("nearby");
  const [search, setSearch] = useState("");
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);

  // Filter bars based on search
  const filteredBars = useMemo(() => {
    const source = viewMode === "nearby" ? nearbyBars : bars;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [bars, nearbyBars, viewMode, search]);

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  if (loadingBars) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 pb-24">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="font-display text-xl font-bold text-glupp-cream mb-1">
          Carte des Bars
        </h2>
        <p className="text-xs text-glupp-text-muted">
          {bars.length} bar{bars.length > 1 ? "s" : ""} référencé
          {bars.length > 1 ? "s" : ""}
          {mapState.userLocation && nearbyBars.length > 0 && (
            <> · {nearbyBars.length} à proximité</>
          )}
        </p>
      </div>

      {/* Location status */}
      {mapState.locationError && (
        <div className="mx-4 mb-3 p-3 bg-glupp-accent/10 border border-glupp-accent/30 rounded-glupp flex items-center gap-2">
          <AlertTriangle size={16} className="text-glupp-accent shrink-0" />
          <p className="text-xs text-glupp-accent">{mapState.locationError}</p>
        </div>
      )}

      {/* View toggle + Search */}
      <div className="px-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <Pill
            label="À proximité"
            active={viewMode === "nearby"}
            onClick={() => setViewMode("nearby")}
          />
          <Pill
            label="Tous les bars"
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un bar..."
            className="w-full pl-10 pr-10 py-2.5 bg-glupp-card border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-glupp-text-muted hover:text-glupp-cream transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Bar list */}
      <div className="px-4 space-y-3">
        {filteredBars.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-glupp-text-muted mx-auto mb-3" />
            <p className="text-glupp-text-soft text-sm">
              {search
                ? "Aucun bar trouvé pour cette recherche."
                : viewMode === "nearby"
                ? "Aucun bar à proximité. Active ta localisation ou consulte tous les bars."
                : "Aucun bar référencé pour le moment."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredBars.map((bar, index) => (
              <motion.div
                key={bar.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    selectedBarId === bar.id
                      ? "border-glupp-accent/50 bg-glupp-accent/5"
                      : "hover:border-glupp-border/80"
                  }`}
                  onClick={() =>
                    setSelectedBarId(
                      selectedBarId === bar.id ? null : bar.id
                    )
                  }
                >
                  <div className="flex items-start gap-3">
                    {/* Bar icon */}
                    <div className="w-10 h-10 rounded-glupp bg-glupp-accent/15 flex items-center justify-center shrink-0">
                      <Beer size={20} className="text-glupp-accent" />
                    </div>

                    {/* Bar info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-glupp-cream text-sm truncate">
                          {bar.name}
                        </h3>
                        {bar.is_verified && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-glupp-accent/15 text-glupp-accent rounded-full font-medium">
                            Vérifié
                          </span>
                        )}
                      </div>

                      {bar.address && (
                        <p className="text-xs text-glupp-text-muted truncate mt-0.5">
                          <MapPin size={10} className="inline mr-1" />
                          {bar.address}
                          {bar.city && `, ${bar.city}`}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5">
                        {bar.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-glupp-gold">
                            <Star size={12} fill="currentColor" />
                            {bar.rating.toFixed(1)}
                          </span>
                        )}
                        {bar.total_votes > 0 && (
                          <span className="text-[10px] text-glupp-text-muted">
                            {bar.total_votes} avis
                          </span>
                        )}
                        {"distance" in bar && (
                          <span className="flex items-center gap-1 text-xs text-glupp-accent font-medium">
                            <Navigation size={10} />
                            {formatDistance(
                              (bar as typeof bar & { distance: number }).distance
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className={`text-glupp-text-muted shrink-0 transition-transform ${
                        selectedBarId === bar.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded bar detail */}
                  <AnimatePresence>
                    {selectedBarId === bar.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-glupp-border/50">
                          <p className="text-xs text-glupp-text-soft text-center">
                            Les menus seront bientôt disponibles !
                          </p>
                          <p className="text-[10px] text-glupp-text-muted text-center mt-1">
                            Aide-nous en scannant les bières de ce bar 🍺
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
