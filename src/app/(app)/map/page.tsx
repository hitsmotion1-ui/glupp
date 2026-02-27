"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMap } from "@/lib/hooks/useMap";
import { BarReviewPanel } from "@/components/map/BarReviewPanel";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  MapPin,
  Navigation,
  Beer,
  Star,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
  List,
  Map as MapIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bar } from "@/types";

// Dynamic import for LeafletMap (SSR disabled)
const LeafletMap = dynamic(
  () => import("@/components/map/LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-glupp-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs text-glupp-text-muted">Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
);

type ViewMode = "map" | "list";

export default function MapPage() {
  const { bars, nearbyBars, loadingBars, mapState } = useMap();

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [search, setSearch] = useState("");
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // The bars to display (with distance if available)
  const displayBars = useMemo(() => {
    const source = mapState.userLocation ? nearbyBars : bars;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [bars, nearbyBars, mapState.userLocation, search]);

  const selectedBar = useMemo(() => {
    if (!selectedBarId) return null;
    return (
      displayBars.find((b) => b.id === selectedBarId) ||
      bars.find((b) => b.id === selectedBarId) ||
      null
    );
  }, [selectedBarId, displayBars, bars]);

  const handleBarSelect = useCallback((barId: string) => {
    setSelectedBarId((prev) => (prev === barId ? null : barId));
    setSheetExpanded(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedBarId(null);
    setSheetExpanded(false);
  }, []);

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  if (loadingBars) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[50vh] w-full rounded-glupp-lg" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Top bar: search + view toggle */}
        <div className="px-4 pt-4 pb-2 shrink-0 space-y-2">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-glupp-cream">
                Carte des Bars
              </h2>
              <p className="text-[10px] text-glupp-text-muted">
                {bars.length} bar{bars.length > 1 ? "s" : ""}
                {mapState.userLocation && nearbyBars.length > 0 && (
                  <> &middot; {nearbyBars.length} a proximite</>
                )}
              </p>
            </div>

            {/* View toggle */}
            <div className="flex bg-glupp-card border border-glupp-border rounded-glupp overflow-hidden">
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "map"
                    ? "bg-glupp-accent text-white"
                    : "text-glupp-text-muted hover:text-glupp-cream"
                }`}
              >
                <MapIcon size={12} />
                Carte
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-glupp-accent text-white"
                    : "text-glupp-text-muted hover:text-glupp-cream"
                }`}
              >
                <List size={12} />
                Liste
              </button>
            </div>
          </div>

          {/* Location error */}
          {mapState.locationError && (
            <div className="p-2 bg-glupp-accent/10 border border-glupp-accent/30 rounded-glupp flex items-center gap-2">
              <AlertTriangle size={12} className="text-glupp-accent shrink-0" />
              <p className="text-[10px] text-glupp-accent">{mapState.locationError}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-glupp-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bar..."
              className="w-full pl-9 pr-9 py-2 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-glupp-text-muted hover:text-glupp-cream transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === "map" ? (
            <LeafletMap
              bars={displayBars}
              userLocation={mapState.userLocation}
              center={mapState.center}
              zoom={mapState.zoom}
              onBarSelect={handleBarSelect}
              selectedBarId={selectedBarId}
            />
          ) : (
            /* List view */
            <div className="h-full overflow-y-auto px-4 pb-24 space-y-2.5 pt-1">
              {displayBars.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-glupp-text-muted mx-auto mb-3" />
                  <p className="text-glupp-text-soft text-sm">
                    {search
                      ? "Aucun bar trouve pour cette recherche."
                      : "Aucun bar reference pour le moment."}
                  </p>
                </div>
              ) : (
                displayBars.map((bar, index) => (
                  <motion.div
                    key={bar.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  >
                    <Card
                      className={`p-3.5 cursor-pointer transition-all ${
                        selectedBarId === bar.id
                          ? "border-glupp-accent/50 bg-glupp-accent/5"
                          : "hover:border-glupp-border/80"
                      }`}
                      onClick={() => handleBarSelect(bar.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Bar icon */}
                        <div className="w-9 h-9 rounded-full bg-glupp-accent/15 flex items-center justify-center shrink-0">
                          <Beer size={18} className="text-glupp-accent" />
                        </div>

                        {/* Bar info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-glupp-cream text-sm truncate">
                              {bar.name}
                            </h3>
                            {bar.is_verified && (
                              <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-glupp-accent/15 text-glupp-accent rounded-full font-medium">
                                Verifie
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {bar.rating > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-glupp-gold">
                                <Star size={10} fill="currentColor" />
                                {bar.rating.toFixed(1)}
                              </span>
                            )}
                            {"distance" in bar &&
                              typeof (bar as Bar & { distance?: number }).distance ===
                                "number" && (
                                <span className="flex items-center gap-1 text-[11px] text-glupp-accent font-medium">
                                  <Navigation size={10} />
                                  {formatDistance(
                                    (bar as Bar & { distance: number }).distance
                                  )}
                                </span>
                              )}
                            {bar.address && (
                              <span className="text-[10px] text-glupp-text-muted truncate">
                                {bar.city || bar.address}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
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
                              <BarReviewPanel
                                bar={bar}
                                onClose={() => setSelectedBarId(null)}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet — FIXED position, outside map container, above Leaflet z-indexes */}
      <AnimatePresence>
        {selectedBar && viewMode === "map" && (
          <>
            {/* Backdrop tap to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSheet}
              className="fixed inset-0 z-[60] bg-transparent"
              style={{ pointerEvents: "auto" }}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-[61] bg-glupp-bg border-t border-glupp-border rounded-t-2xl shadow-2xl ${
                sheetExpanded ? "max-h-[80vh]" : "max-h-[40vh]"
              } flex flex-col`}
            >
              {/* Drag handle */}
              <button
                onClick={() => setSheetExpanded(!sheetExpanded)}
                className="w-full pt-3 pb-2 flex justify-center shrink-0"
              >
                <div className="w-10 h-1 bg-glupp-border rounded-full" />
              </button>

              {/* Bar header */}
              <div className="px-4 pb-3 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-glupp-cream text-base truncate">
                        {selectedBar.name}
                      </h3>
                      {selectedBar.is_verified && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-glupp-accent/15 text-glupp-accent rounded-full font-medium">
                          Verifie
                        </span>
                      )}
                    </div>
                    {selectedBar.address && (
                      <p className="text-[11px] text-glupp-text-muted mt-0.5 truncate">
                        <MapPin size={10} className="inline mr-1" />
                        {selectedBar.address}
                        {selectedBar.city && `, ${selectedBar.city}`}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {"distance" in selectedBar &&
                        typeof (selectedBar as Bar & { distance?: number }).distance ===
                          "number" && (
                          <span className="flex items-center gap-1 text-xs text-glupp-accent font-medium">
                            <Navigation size={10} />
                            {formatDistance(
                              (selectedBar as Bar & { distance: number }).distance
                            )}
                          </span>
                        )}
                      {selectedBar.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-glupp-gold">
                          <Star size={10} fill="currentColor" />
                          {selectedBar.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCloseSheet}
                    className="p-1.5 rounded-full bg-glupp-card hover:bg-glupp-card-alt transition-colors"
                  >
                    <X size={16} className="text-glupp-text-muted" />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
                <BarReviewPanel bar={selectedBar} onClose={handleCloseSheet} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
