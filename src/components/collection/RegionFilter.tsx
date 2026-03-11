"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { RegionMode } from "@/lib/hooks/useRegionFilter";

interface Country {
  readonly code: string;
  readonly flag: string;
  readonly name: string;
}

interface RegionFilterProps {
  countries: readonly Country[];
  regions: string[];
  selectedCountry: string | null;
  setSelectedCountry: (code: string | null) => void;
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
  countryStats?: Map<string, { tasted: number; total: number }>;
  regionMode?: RegionMode;
  setRegionMode?: (mode: RegionMode) => void;
  hasDepartments?: boolean;
  isLoading?: boolean;
}

export function RegionFilter({
  countries,
  regions,
  selectedCountry,
  setSelectedCountry,
  selectedRegion,
  setSelectedRegion,
  countryStats,
  regionMode = "regions",
  setRegionMode,
  hasDepartments = false,
  isLoading = false,
}: RegionFilterProps) {
  // État local pour la barre de recherche
  const [searchQuery, setSearchQuery] = useState("");

  // Réinitialiser la recherche quand on change de pays ou de mode
  useEffect(() => {
    setSearchQuery("");
  }, [selectedCountry, regionMode]);

  // Filtrer la liste active (régions ou départements) selon la recherche
  const filteredRegions = regions.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Ligne des Pays */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
        <button
          onClick={() => setSelectedCountry(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedCountry
              ? "bg-glupp-accent text-glupp-bg"
              : "bg-glupp-card border border-glupp-border text-glupp-text-soft hover:border-glupp-accent"
          }`}
        >
          Tous
        </button>
        
        {countries.map((c) => {
          const stats = countryStats?.get(c.code);
          return (
            <button
              key={c.code}
              onClick={() =>
                setSelectedCountry(selectedCountry === c.code ? null : c.code)
              }
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCountry === c.code
                  ? "bg-glupp-accent text-glupp-bg"
                  : "bg-glupp-card border border-glupp-border text-glupp-text-soft hover:border-glupp-accent"
              }`}
            >
              <span className="text-sm">{c.flag}</span>
              <span>{c.name}</span>
              {stats && (
                <span className="opacity-60">
                  {stats.tasted}/{stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Zone Régions / Départements (Affichée seulement si un pays est sélectionné) */}
      {selectedCountry && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 overflow-hidden"
        >
          {/* Toggle : Régions vs Départements (Seulement pour les pays compatibles) */}
          {hasDepartments && setRegionMode && !isLoading && regions.length > 0 && (
            <div className="flex items-center gap-1.5 px-4 mt-1">
              <button
                onClick={() => setRegionMode("regions")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  regionMode === "regions"
                    ? "bg-glupp-accent/20 text-glupp-accent"
                    : "text-glupp-text-muted hover:text-glupp-text-soft"
                }`}
              >
                Régions
              </button>
              <button
                onClick={() => setRegionMode("departments")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  regionMode === "departments"
                    ? "bg-glupp-accent/20 text-glupp-accent"
                    : "text-glupp-text-muted hover:text-glupp-text-soft"
                }`}
              >
                Départements
              </button>
            </div>
          )}

          {/* 🔍 BARRE DE RECHERCHE */}
          {!isLoading && regions.length > 5 && (
            <div className="px-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-glupp-text-muted" size={14} />
                <input
                  type="text"
                  placeholder={`Rechercher un${regionMode === "departments" ? " département" : "e région"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-glupp-bg/50 border border-glupp-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-glupp-text placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
                />
              </div>
            </div>
          )}

          {/* État de chargement OU Liste des pilules */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2">
            {isLoading ? (
              <div className="flex items-center gap-2 px-2 py-1 text-glupp-text-muted text-[11px]">
                <Loader2 size={12} className="animate-spin" />
                <span>Chargement des filtres...</span>
              </div>
            ) : regions.length > 0 ? (
              <>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    !selectedRegion
                      ? "bg-glupp-accent/20 text-glupp-accent border border-glupp-accent/30"
                      : "bg-glupp-card-alt text-glupp-text-muted border border-transparent hover:border-glupp-border"
                  }`}
                >
                  {regionMode === "departments" ? "Tous départements" : "Toutes régions"}
                </button>
                {filteredRegions.length > 0 ? (
                  filteredRegions.map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        setSelectedRegion(selectedRegion === r ? null : r)
                      }
                      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        selectedRegion === r
                          ? "bg-glupp-accent/20 text-glupp-accent border border-glupp-accent/30"
                          : "bg-glupp-card-alt text-glupp-text-muted border border-transparent hover:border-glupp-border"
                      }`}
                    >
                      {r}
                    </button>
                  ))
                ) : (
                  <span className="text-[11px] text-glupp-text-muted px-2 py-1 italic">
                    Aucun résultat pour "{searchQuery}"
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-glupp-text-muted px-2 py-1">
                Aucun filtre disponible pour ce pays.
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}