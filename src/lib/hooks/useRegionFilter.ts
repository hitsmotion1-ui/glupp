"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  normalizeRegions,
  normalizeToDepartments,
  COUNTRIES_WITH_DEPARTMENTS,
  ALL_FR_REGIONS,
  ALL_FR_DEPARTMENTS,
} from "@/lib/utils/regionMapping";

export const COUNTRIES = [
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "BE", flag: "🇧🇪", name: "Belgique" },
  { code: "DE", flag: "🇩🇪", name: "Allemagne" },
  { code: "US", flag: "🇺🇸", name: "USA" },
  { code: "GB", flag: "🇬🇧", name: "UK" },
  { code: "IE", flag: "🇮🇪", name: "Irlande" },
  { code: "NL", flag: "🇳🇱", name: "Pays-Bas" },
  { code: "CZ", flag: "🇨🇿", name: "Tchéquie" },
  { code: "JP", flag: "🇯🇵", name: "Japon" },
  { code: "MX", flag: "🇲🇽", name: "Mexique" },
  { code: "ES", flag: "🇪🇸", name: "Espagne" },
  { code: "IT", flag: "🇮🇹", name: "Italie" },
  { code: "NO", flag: "🇳🇴", name: "Norvège" },
  { code: "DK", flag: "🇩🇰", name: "Danemark" },
  { code: "AU", flag: "🇦🇺", name: "Australie" },
] as const;

export type RegionMode = "regions" | "departments";

export function useRegionFilter() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionMode, setRegionMode] = useState<RegionMode>("regions");

  // Vérifie si le pays gère les départements
  const hasDepartments =
    selectedCountry != null && COUNTRIES_WITH_DEPARTMENTS.has(selectedCountry);

  // 1. UNE SEULE REQUÊTE POUR TOUT : On récupère les régions brutes
  const { data: rawRegions = [], isLoading } = useQuery({
    queryKey: ["raw-regions", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const { data } = await supabase
        .from("beers")
        .select("region")
        .eq("country_code", selectedCountry)
        .eq("is_active", true)
        .eq("status", "approved")
        .not("region", "is", null);

      if (!data) return [];
      return data.map((d) => d.region as string).filter(Boolean);
    },
    enabled: !!selectedCountry,
    staleTime: 10 * 60 * 1000,
  });

  // 2. On dérive les régions et départements en local (zéro coût réseau)
  const regions = useMemo(() => {
    // 👈 1. On rassure TypeScript : si aucun pays n'est sélectionné, on renvoie une liste vide
    if (!selectedCountry) return []; 
    
    const fetchedRegions = normalizeRegions(rawRegions, selectedCountry);
    
    let combined = fetchedRegions;
    if (selectedCountry === "FR") {
      combined = [...new Set([...ALL_FR_REGIONS, ...fetchedRegions])];
    }
    
    // Tri alphabétique gérant les accents français
    return combined.sort((a, b) => a.localeCompare(b, "fr"));
  }, [rawRegions, selectedCountry]);

  const departments = useMemo(() => {
    // 👈 2. Même sécurité ici pour les départements
    if (!hasDepartments || !selectedCountry) return []; 
    
    const fetchedDepartments = normalizeToDepartments(rawRegions, selectedCountry);
    
    let combined = fetchedDepartments;
    if (selectedCountry === "FR") {
      combined = [...new Set([...ALL_FR_DEPARTMENTS, ...fetchedDepartments])];
    }
    
    // Tri alphabétique gérant les accents français
    return combined.sort((a, b) => a.localeCompare(b, "fr"));
  }, [rawRegions, selectedCountry, hasDepartments]);

  const handleSetCountry = (code: string | null) => {
    setSelectedCountry(code);
    setSelectedRegion(null);
    setRegionMode("regions");
  };

  const handleSetRegionMode = (mode: RegionMode) => {
    setRegionMode(mode);
    setSelectedRegion(null);
  };

  const activeList = regionMode === "departments" ? departments : regions;

  return {
    countries: COUNTRIES,
    regions: activeList,
    allRegions: regions,
    departments,
    selectedCountry,
    setSelectedCountry: handleSetCountry,
    selectedRegion,
    setSelectedRegion,
    regionMode,
    setRegionMode: handleSetRegionMode,
    hasDepartments,
    isLoading, // Ajouté pour permettre d'afficher un loader dans l'UI si besoin
  };
}