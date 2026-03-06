"use client";

import { motion } from "framer-motion";

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
}

export function RegionFilter({
  countries,
  regions,
  selectedCountry,
  setSelectedCountry,
  selectedRegion,
  setSelectedRegion,
  countryStats,
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

      {/* Region row (only when country selected and regions exist) */}
      {selectedCountry && regions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1"
        >
          <button
            onClick={() => setSelectedRegion(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              !selectedRegion
                ? "bg-glupp-accent/20 text-glupp-accent border border-glupp-accent/30"
                : "bg-glupp-card-alt text-glupp-text-muted border border-transparent hover:border-glupp-border"
            }`}
          >
            Toutes regions
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
        </motion.div>
      )}
    </div>
  );
}
