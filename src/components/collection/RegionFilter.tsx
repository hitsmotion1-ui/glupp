"use client";

import { motion } from "framer-motion";
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
}: RegionFilterProps) {
  return (
    <div className="space-y-2">
      {/* Country row */}
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

      {/* Region/Department toggle + list (only when country selected and regions exist) */}
      {selectedCountry && regions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1.5"
        >
          {/* Toggle: Regions / Departements (only for countries that support it) */}
          {hasDepartments && setRegionMode && (
            <div className="flex items-center gap-1.5 px-4">
              <button
                onClick={() => setRegionMode("regions")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  regionMode === "regions"
                    ? "bg-glupp-accent/20 text-glupp-accent"
                    : "text-glupp-text-muted hover:text-glupp-text-soft"
                }`}
              >
                Regions
              </button>
              <button
                onClick={() => setRegionMode("departments")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  regionMode === "departments"
                    ? "bg-glupp-accent/20 text-glupp-accent"
                    : "text-glupp-text-muted hover:text-glupp-text-soft"
                }`}
              >
                Departements
              </button>
            </div>
          )}

          {/* Region/Department pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
            <button
              onClick={() => setSelectedRegion(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                !selectedRegion
                  ? "bg-glupp-accent/20 text-glupp-accent border border-glupp-accent/30"
                  : "bg-glupp-card-alt text-glupp-text-muted border border-transparent hover:border-glupp-border"
              }`}
            >
              {regionMode === "departments" ? "Tous departements" : "Toutes regions"}
            </button>
            {regions.map((r) => (
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
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
