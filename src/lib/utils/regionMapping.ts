/**
 * Mapping code postal français (2 premiers chiffres) → Région administrative
 */
const FR_DEPT_TO_REGION: Record<string, string> = {
  "01": "Auvergne-Rhone-Alpes",
  "02": "Hauts-de-France",
  "03": "Auvergne-Rhone-Alpes",
  "04": "Provence-Alpes-Cote d'Azur",
  "05": "Provence-Alpes-Cote d'Azur",
  "06": "Provence-Alpes-Cote d'Azur",
  "07": "Auvergne-Rhone-Alpes",
  "08": "Grand Est",
  "09": "Occitanie",
  "10": "Grand Est",
  "11": "Occitanie",
  "12": "Occitanie",
  "13": "Provence-Alpes-Cote d'Azur",
  "14": "Normandie",
  "15": "Auvergne-Rhone-Alpes",
  "16": "Nouvelle-Aquitaine",
  "17": "Nouvelle-Aquitaine",
  "18": "Centre-Val de Loire",
  "19": "Nouvelle-Aquitaine",
  "20": "Corse",
  "21": "Bourgogne-Franche-Comte",
  "22": "Bretagne",
  "23": "Nouvelle-Aquitaine",
  "24": "Nouvelle-Aquitaine",
  "25": "Bourgogne-Franche-Comte",
  "26": "Auvergne-Rhone-Alpes",
  "27": "Normandie",
  "28": "Centre-Val de Loire",
  "29": "Bretagne",
  "30": "Occitanie",
  "31": "Occitanie",
  "32": "Occitanie",
  "33": "Nouvelle-Aquitaine",
  "34": "Occitanie",
  "35": "Bretagne",
  "36": "Centre-Val de Loire",
  "37": "Centre-Val de Loire",
  "38": "Auvergne-Rhone-Alpes",
  "39": "Bourgogne-Franche-Comte",
  "40": "Nouvelle-Aquitaine",
  "41": "Centre-Val de Loire",
  "42": "Auvergne-Rhone-Alpes",
  "43": "Auvergne-Rhone-Alpes",
  "44": "Pays de la Loire",
  "45": "Centre-Val de Loire",
  "46": "Occitanie",
  "47": "Nouvelle-Aquitaine",
  "48": "Occitanie",
  "49": "Pays de la Loire",
  "50": "Normandie",
  "51": "Grand Est",
  "52": "Grand Est",
  "53": "Pays de la Loire",
  "54": "Grand Est",
  "55": "Grand Est",
  "56": "Bretagne",
  "57": "Grand Est",
  "58": "Bourgogne-Franche-Comte",
  "59": "Hauts-de-France",
  "60": "Hauts-de-France",
  "61": "Normandie",
  "62": "Hauts-de-France",
  "63": "Auvergne-Rhone-Alpes",
  "64": "Nouvelle-Aquitaine",
  "65": "Occitanie",
  "66": "Occitanie",
  "67": "Grand Est",
  "68": "Grand Est",
  "69": "Auvergne-Rhone-Alpes",
  "70": "Bourgogne-Franche-Comte",
  "71": "Bourgogne-Franche-Comte",
  "72": "Pays de la Loire",
  "73": "Auvergne-Rhone-Alpes",
  "74": "Auvergne-Rhone-Alpes",
  "75": "Ile-de-France",
  "76": "Normandie",
  "77": "Ile-de-France",
  "78": "Ile-de-France",
  "79": "Nouvelle-Aquitaine",
  "80": "Hauts-de-France",
  "81": "Occitanie",
  "82": "Occitanie",
  "83": "Provence-Alpes-Cote d'Azur",
  "84": "Provence-Alpes-Cote d'Azur",
  "85": "Pays de la Loire",
  "86": "Nouvelle-Aquitaine",
  "87": "Nouvelle-Aquitaine",
  "88": "Grand Est",
  "89": "Bourgogne-Franche-Comte",
  "90": "Bourgogne-Franche-Comte",
  "91": "Ile-de-France",
  "92": "Ile-de-France",
  "93": "Ile-de-France",
  "94": "Ile-de-France",
  "95": "Ile-de-France",
  // DOM-TOM
  "97": "Outre-Mer",
  "98": "Outre-Mer",
};

/**
 * Mapping code postal français (2 premiers chiffres) → Département
 */
export const FR_DEPT_TO_NAME: Record<string, string> = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardeche",
  "08": "Ardennes",
  "09": "Ariege",
  "10": "Aube",
  "11": "Aude",
  "12": "Aveyron",
  "13": "Bouches-du-Rhone",
  "14": "Calvados",
  "15": "Cantal",
  "16": "Charente",
  "17": "Charente-Maritime",
  "18": "Cher",
  "19": "Correze",
  "20": "Corse",
  "21": "Cote-d'Or",
  "22": "Cotes-d'Armor",
  "23": "Creuse",
  "24": "Dordogne",
  "25": "Doubs",
  "26": "Drome",
  "27": "Eure",
  "28": "Eure-et-Loir",
  "29": "Finistere",
  "30": "Gard",
  "31": "Haute-Garonne",
  "32": "Gers",
  "33": "Gironde",
  "34": "Herault",
  "35": "Ille-et-Vilaine",
  "36": "Indre",
  "37": "Indre-et-Loire",
  "38": "Isere",
  "39": "Jura",
  "40": "Landes",
  "41": "Loir-et-Cher",
  "42": "Loire",
  "43": "Haute-Loire",
  "44": "Loire-Atlantique",
  "45": "Loiret",
  "46": "Lot",
  "47": "Lot-et-Garonne",
  "48": "Lozere",
  "49": "Maine-et-Loire",
  "50": "Manche",
  "51": "Marne",
  "52": "Haute-Marne",
  "53": "Mayenne",
  "54": "Meurthe-et-Moselle",
  "55": "Meuse",
  "56": "Morbihan",
  "57": "Moselle",
  "58": "Nievre",
  "59": "Nord",
  "60": "Oise",
  "61": "Orne",
  "62": "Pas-de-Calais",
  "63": "Puy-de-Dome",
  "64": "Pyrenees-Atlantiques",
  "65": "Hautes-Pyrenees",
  "66": "Pyrenees-Orientales",
  "67": "Bas-Rhin",
  "68": "Haut-Rhin",
  "69": "Rhone",
  "70": "Haute-Saone",
  "71": "Saone-et-Loire",
  "72": "Sarthe",
  "73": "Savoie",
  "74": "Haute-Savoie",
  "75": "Paris",
  "76": "Seine-Maritime",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "79": "Deux-Sevres",
  "80": "Somme",
  "81": "Tarn",
  "82": "Tarn-et-Garonne",
  "83": "Var",
  "84": "Vaucluse",
  "85": "Vendee",
  "86": "Vienne",
  "87": "Haute-Vienne",
  "88": "Vosges",
  "89": "Yonne",
  "90": "Territoire de Belfort",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise",
};

/**
 * Mapping inversé : région → départements (pour le mode département)
 */
export function getDepartmentsForRegion(region: string): string[] {
  const departments: string[] = [];
  for (const [code, regionName] of Object.entries(FR_DEPT_TO_REGION)) {
    if (regionName === region) {
      const deptName = FR_DEPT_TO_NAME[code];
      if (deptName) departments.push(deptName);
    }
  }
  return departments.sort();
}

/**
 * Mapping code postal belge (1er chiffre) → Province/Région
 */
const BE_PREFIX_TO_REGION: Record<string, string> = {
  "1": "Bruxelles / Brabant",
  "2": "Anvers",
  "3": "Brabant / Limbourg",
  "4": "Liege",
  "5": "Namur",
  "6": "Luxembourg / Hainaut",
  "7": "Hainaut",
  "8": "Flandre-Occidentale",
  "9": "Flandre-Orientale",
};

/**
 * Pays qui supportent le mode départements/provinces
 */
export const COUNTRIES_WITH_DEPARTMENTS = new Set(["FR"]);

/**
 * Noms de régions connus (déjà corrects dans le seed) — on les garde tels quels
 */
const KNOWN_REGIONS = new Set([
  // France
  "Paris", "Lyon", "Savoie", "Vendee", "Bretagne", "Alsace", "Normandie",
  "Bordeaux", "Lille", "Marseille", "Toulouse", "Strasbourg", "Nantes",
  "Ile-de-France", "Pays de la Loire", "Nouvelle-Aquitaine", "Occitanie",
  "Grand Est", "Auvergne-Rhone-Alpes", "Hauts-de-France", "Bretagne",
  "Bourgogne-Franche-Comte", "Centre-Val de Loire", "Corse",
  "Provence-Alpes-Cote d'Azur", "Normandie",
  // Belgique
  "Wallonie", "Flandre", "Ardennes", "Luxembourg", "Anvers",
  "Flandre-Occidentale", "Hainaut", "Bruxelles", "Liege", "Namur",
  "Brabant", "Limbourg",
  // Allemagne
  "Bavaria", "Munich", "Bamberg", "Berlin", "Cologne", "Hamburg",
  // UK/IE
  "Scotland", "Dublin", "London", "Oxfordshire", "Yorkshire", "Wales",
  // US
  "California", "Vermont", "Michigan", "Delaware", "Iowa", "Oregon",
  "Colorado", "New York", "Pennsylvania", "Texas", "Wisconsin",
  // Autres
  "Bohemia", "Tokyo", "Ibaraki", "Mexico City", "Grimstad", "Fremantle",
  "Udine", "Granada", "Copenhagen", "Jura", "Brabant", "Quebec",
]);

/**
 * Noms de départements FR connus — pour KNOWN_REGIONS auto-resolution
 */
const FR_DEPT_NAMES_SET = new Set(Object.values(FR_DEPT_TO_NAME));

/**
 * Extrait un code postal à 5 chiffres (FR) ou 4 chiffres (BE) d'une chaîne
 */
function extractPostalCode(str: string): string | null {
  // Code postal français : 5 chiffres
  const fr = str.match(/\b(\d{5})\b/);
  if (fr) return fr[1];

  // Code postal belge : 4 chiffres
  const be = str.match(/\b(\d{4})\b/);
  if (be) return be[1];

  return null;
}

/**
 * Normalise une valeur de region brute en nom de région lisible
 *
 * @param region La valeur brute du champ region (adresse, code postal, ou nom)
 * @param countryCode Le code pays ISO 2
 * @returns Le nom de région normalisé, ou null si non résolvable
 */
export function normalizeRegion(
  region: string | null,
  countryCode: string
): string | null {
  if (!region) return null;

  const trimmed = region.trim();
  if (!trimmed) return null;

  // Si c'est déjà un nom de région connu, le retourner directement
  if (KNOWN_REGIONS.has(trimmed)) return trimmed;

  // Essayer d'extraire un code postal
  const postalCode = extractPostalCode(trimmed);

  if (countryCode === "FR" && postalCode && postalCode.length === 5) {
    const dept = postalCode.substring(0, 2);
    return FR_DEPT_TO_REGION[dept] || null;
  }

  if (countryCode === "BE") {
    if (postalCode && postalCode.length === 4) {
      const prefix = postalCode[0];
      return BE_PREFIX_TO_REGION[prefix] || null;
    }
  }

  // Si c'est juste un nombre (code postal seul)
  if (/^\d{4,5}$/.test(trimmed)) {
    if (countryCode === "FR" && trimmed.length === 5) {
      const dept = trimmed.substring(0, 2);
      return FR_DEPT_TO_REGION[dept] || null;
    }
    if (countryCode === "BE" && trimmed.length === 4) {
      return BE_PREFIX_TO_REGION[trimmed[0]] || null;
    }
  }

  // Si c'est une chaîne qui contient un tiret + ville (ex: "27140 - GISORS")
  const dashMatch = trimmed.match(/(\d{4,5})\s*[-–]\s*(.+)/);
  if (dashMatch) {
    const code = dashMatch[1];
    if (countryCode === "FR" && code.length === 5) {
      return FR_DEPT_TO_REGION[code.substring(0, 2)] || null;
    }
  }

  // Pour les autres pays, si c'est une adresse (contient "rue", "avenue", etc.),
  // on ne peut pas résoudre → retourner null
  if (/\b(rue|avenue|boulevard|impasse|chemin|place|allee|route|voie|passage)\b/i.test(trimmed)) {
    return null;
  }

  // Sinon, retourner la valeur telle quelle (peut être un nom de ville/région valide)
  return trimmed;
}

/**
 * Normalise vers un département (France uniquement)
 */
export function normalizeToDepartment(
  region: string | null,
  countryCode: string
): string | null {
  if (!region || countryCode !== "FR") return null;

  const trimmed = region.trim();
  if (!trimmed) return null;

  // Si c'est déjà un nom de département connu
  if (FR_DEPT_NAMES_SET.has(trimmed)) return trimmed;

  // Essayer d'extraire un code postal
  const postalCode = extractPostalCode(trimmed);
  if (postalCode && postalCode.length === 5) {
    const dept = postalCode.substring(0, 2);
    return FR_DEPT_TO_NAME[dept] || null;
  }

  // Si c'est juste un code postal seul
  if (/^\d{5}$/.test(trimmed)) {
    return FR_DEPT_TO_NAME[trimmed.substring(0, 2)] || null;
  }

  // Format "27140 - GISORS"
  const dashMatch = trimmed.match(/(\d{5})\s*[-–]\s*(.+)/);
  if (dashMatch) {
    return FR_DEPT_TO_NAME[dashMatch[1].substring(0, 2)] || null;
  }

  return null;
}

/**
 * Normalise un tableau de regions brutes et retourne les régions uniques triées
 */
export function normalizeRegions(
  rawRegions: string[],
  countryCode: string
): string[] {
  const normalized = new Set<string>();
  for (const raw of rawRegions) {
    const n = normalizeRegion(raw, countryCode);
    if (n) normalized.add(n);
  }
  return Array.from(normalized).sort();
}

/**
 * Normalise un tableau de regions brutes vers départements (FR uniquement)
 */
export function normalizeToDepartments(
  rawRegions: string[],
  countryCode: string
): string[] {
  if (countryCode !== "FR") return [];
  const normalized = new Set<string>();
  for (const raw of rawRegions) {
    const n = normalizeToDepartment(raw, countryCode);
    if (n) normalized.add(n);
  }
  return Array.from(normalized).sort();
}

/**
 * Vérifie si un beer.region brut correspond à une région normalisée sélectionnée
 */
export function matchesNormalizedRegion(
  beerRegion: string | null,
  selectedRegion: string,
  countryCode: string
): boolean {
  if (!beerRegion) return false;
  const normalized = normalizeRegion(beerRegion, countryCode);
  return normalized === selectedRegion;
}

/**
 * Vérifie si un beer.region brut correspond à un département sélectionné (FR)
 */
export function matchesNormalizedDepartment(
  beerRegion: string | null,
  selectedDepartment: string,
  countryCode: string
): boolean {
  if (!beerRegion || countryCode !== "FR") return false;
  const normalized = normalizeToDepartment(beerRegion, countryCode);
  return normalized === selectedDepartment;
}
