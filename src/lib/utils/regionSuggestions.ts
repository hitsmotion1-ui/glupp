// ═══════════════════════════════════════════
// GLUPP — Region Suggestions by Country
// Shows clickable pills when user selects a country
// ═══════════════════════════════════════════

export const REGION_SUGGESTIONS: Record<string, string[]> = {
  FR: [
    "Ile-de-France",
    "Pays de la Loire",
    "Bretagne",
    "Normandie",
    "Grand Est",
    "Auvergne-Rhone-Alpes",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Hauts-de-France",
    "Provence-Alpes-Cote d'Azur",
    "Bourgogne-Franche-Comte",
    "Centre-Val de Loire",
    "Corse",
    "Vendee",
  ],
  BE: ["Wallonie", "Flandre", "Bruxelles", "Ardennes", "Hainaut", "Anvers", "Flandre-Occidentale"],
  DE: ["Baviere", "Berlin", "Rhenanie", "Bade-Wurtemberg", "Hambourg", "Franconie"],
  GB: ["Ecosse", "Londres", "Angleterre", "Pays de Galles"],
  US: ["Californie", "Cote Est", "Midwest", "Colorado", "Oregon", "Vermont"],
  NL: ["Brabant", "Hollande"],
  CZ: ["Boheme", "Moravie"],
  JP: ["Tokyo", "Osaka", "Ibaraki"],
  IT: ["Lombardie", "Piemont", "Venetie"],
  ES: ["Catalogne", "Andalousie", "Pays Basque"],
  DK: ["Copenhague"],
  CA: ["Quebec", "Ontario", "Colombie-Britannique"],
  IE: ["Dublin", "Cork", "Galway"],
  AT: ["Vienne", "Salzbourg", "Tyrol"],
  SE: ["Stockholm", "Goteborg"],
  NO: ["Oslo", "Bergen"],
  PT: ["Lisbonne", "Porto"],
  CH: ["Zurich", "Geneve", "Berne"],
  AU: ["Melbourne", "Sydney", "Brisbane"],
  NZ: ["Auckland", "Wellington"],
  BR: ["Sao Paulo", "Rio de Janeiro", "Minas Gerais"],
  MX: ["Mexico City", "Baja California", "Jalisco"],
  PL: ["Varsovie", "Cracovie"],
};

/** Get region suggestions for a country code. Returns empty array if none. */
export function getRegionSuggestions(countryCode: string): string[] {
  return REGION_SUGGESTIONS[countryCode] || [];
}
