"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { normalizeRegions } from "@/lib/utils/regionMapping";

export const COUNTRIES = [
  { code: "FR", flag: "\u{1F1EB}\u{1F1F7}", name: "France" },
  { code: "BE", flag: "\u{1F1E7}\u{1F1EA}", name: "Belgique" },
  { code: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Allemagne" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "USA" },
  { code: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "UK" },
  { code: "IE", flag: "\u{1F1EE}\u{1F1EA}", name: "Irlande" },
  { code: "NL", flag: "\u{1F1F3}\u{1F1F1}", name: "Pays-Bas" },
  { code: "CZ", flag: "\u{1F1E8}\u{1F1FF}", name: "Tchequie" },
  { code: "JP", flag: "\u{1F1EF}\u{1F1F5}", name: "Japon" },
  { code: "MX", flag: "\u{1F1F2}\u{1F1FD}", name: "Mexique" },
  { code: "ES", flag: "\u{1F1EA}\u{1F1F8}", name: "Espagne" },
  { code: "IT", flag: "\u{1F1EE}\u{1F1F9}", name: "Italie" },
  { code: "NO", flag: "\u{1F1F3}\u{1F1F4}", name: "Norvege" },
  { code: "DK", flag: "\u{1F1E9}\u{1F1F0}", name: "Danemark" },
  { code: "AU", flag: "\u{1F1E6}\u{1F1FA}", name: "Australie" },
] as const;

export function useRegionFilter() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Fetch raw regions then normalize them
  const { data: regions = [] } = useQuery({
    queryKey: ["regions", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const { data } = await supabase
        .from("beers")
        .select("region")
        .eq("country_code", selectedCountry)
        .eq("is_active", true)
        .not("region", "is", null);

      if (!data) return [];
      const rawRegions = data.map((d) => d.region as string).filter(Boolean);
      // Normalise les adresses/codes postaux en noms de régions
      return normalizeRegions(rawRegions, selectedCountry);
    },
    enabled: !!selectedCountry,
    staleTime: 10 * 60 * 1000,
  });

  const handleSetCountry = (code: string | null) => {
    setSelectedCountry(code);
    setSelectedRegion(null);
  };

  return {
    countries: COUNTRIES,
    regions,
    selectedCountry,
    setSelectedCountry: handleSetCountry,
    selectedRegion,
    setSelectedRegion,
  };
}
