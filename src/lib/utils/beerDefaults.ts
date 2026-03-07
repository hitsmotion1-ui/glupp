// ═══════════════════════════════════════════
// GLUPP — Beer Defaults by Style
// Auto-fill color and taste profile when adding a beer
// ═══════════════════════════════════════════

/** Default hex color by beer style */
export const COLOR_BY_STYLE: Record<string, string> = {
  // Pale / Light
  "Lager": "#F5D76E",
  "Pilsner": "#F5D76E",
  "Czech Pilsner": "#F5D76E",
  "Helles": "#F5D76E",
  "Kolsch": "#F5D76E",
  "Kölsch": "#F5D76E",

  // Blonde / Belgian
  "Blonde Ale": "#F5D76E",
  "Belgian Blonde": "#F5A623",
  "Belgian Strong Pale": "#F5D76E",
  "Tripel": "#E8C838",
  "Saison": "#C4923A",

  // Amber / Red
  "Amber Ale": "#B8712D",
  "Red Ale": "#A0522D",
  "Biere de Garde": "#B8712D",
  "Scotch Ale": "#8B4513",
  "Bock": "#8B4513",

  // Brown / Dark
  "Brown Ale": "#6B4226",
  "Dubbel": "#5C2D1A",
  "Belgian Strong Dark": "#2D5F8A",
  "Quadrupel": "#8E3B2F",
  "Strong Ale": "#5C2D1A",
  "Barleywine": "#8E3B2F",

  // IPA
  "IPA": "#4ECDC4",
  "Double IPA": "#5B8C3E",
  "Session IPA": "#7BC67E",
  "New England IPA": "#3D8B6E",
  "NEIPA": "#3D8B6E",
  "American Pale Ale": "#D4952B",
  "Pale Ale": "#D4952B",
  "Belgian Pale Ale": "#D4952B",
  "Bitter": "#C4923A",

  // Wheat
  "Wheat Beer": "#E8D5A8",
  "Hefeweizen": "#D4952B",
  "Witbier": "#F0E8D0",
  "Blanche": "#F0E8D0",

  // Stout / Porter
  "Stout": "#6B4C3B",
  "Oatmeal Stout": "#2D1A0E",
  "Porter": "#3D2B1F",
  "Rauchbier": "#5C2D1A",

  // Sour / Fruity
  "Sour": "#E06050",
  "Lambic": "#D4A017",
  "Gueuze": "#D4A017",
  "Fruit Beer": "#C45B8A",

  // Default fallback
  "Autre": "#F59E0B",
};

/** Taste profile defaults (1-5) by style */
export const TASTE_BY_STYLE: Record<string, { bitter: number; sweet: number; fruity: number; body: number }> = {
  // Light lagers
  "Lager": { bitter: 2, sweet: 2, fruity: 1, body: 2 },
  "Pilsner": { bitter: 3, sweet: 1, fruity: 1, body: 2 },
  "Czech Pilsner": { bitter: 3, sweet: 1, fruity: 1, body: 2 },
  "Helles": { bitter: 2, sweet: 2, fruity: 1, body: 2 },
  "Kolsch": { bitter: 2, sweet: 2, fruity: 1, body: 2 },
  "Kölsch": { bitter: 2, sweet: 2, fruity: 1, body: 2 },

  // Blondes
  "Blonde Ale": { bitter: 2, sweet: 2, fruity: 2, body: 3 },
  "Belgian Blonde": { bitter: 2, sweet: 3, fruity: 2, body: 3 },
  "Belgian Strong Pale": { bitter: 3, sweet: 2, fruity: 2, body: 3 },

  // Belgian strong
  "Tripel": { bitter: 3, sweet: 3, fruity: 3, body: 4 },
  "Dubbel": { bitter: 2, sweet: 4, fruity: 3, body: 4 },
  "Quadrupel": { bitter: 2, sweet: 5, fruity: 3, body: 5 },
  "Belgian Strong Dark": { bitter: 3, sweet: 4, fruity: 3, body: 5 },
  "Strong Ale": { bitter: 3, sweet: 3, fruity: 2, body: 4 },
  "Barleywine": { bitter: 4, sweet: 4, fruity: 2, body: 5 },

  // Amber / Brown
  "Amber Ale": { bitter: 3, sweet: 3, fruity: 2, body: 3 },
  "Red Ale": { bitter: 3, sweet: 3, fruity: 2, body: 3 },
  "Brown Ale": { bitter: 2, sweet: 3, fruity: 2, body: 4 },
  "Scotch Ale": { bitter: 2, sweet: 4, fruity: 2, body: 5 },
  "Bock": { bitter: 2, sweet: 4, fruity: 2, body: 5 },
  "Biere de Garde": { bitter: 2, sweet: 3, fruity: 2, body: 3 },

  // IPA family
  "IPA": { bitter: 4, sweet: 1, fruity: 3, body: 2 },
  "Double IPA": { bitter: 5, sweet: 1, fruity: 4, body: 3 },
  "Session IPA": { bitter: 3, sweet: 1, fruity: 3, body: 2 },
  "New England IPA": { bitter: 2, sweet: 2, fruity: 5, body: 3 },
  "NEIPA": { bitter: 2, sweet: 2, fruity: 5, body: 3 },
  "American Pale Ale": { bitter: 3, sweet: 1, fruity: 3, body: 2 },
  "Pale Ale": { bitter: 3, sweet: 1, fruity: 2, body: 2 },
  "Belgian Pale Ale": { bitter: 4, sweet: 2, fruity: 2, body: 3 },
  "Bitter": { bitter: 4, sweet: 1, fruity: 1, body: 3 },

  // Saison
  "Saison": { bitter: 3, sweet: 2, fruity: 3, body: 2 },

  // Wheat
  "Wheat Beer": { bitter: 1, sweet: 3, fruity: 3, body: 2 },
  "Hefeweizen": { bitter: 1, sweet: 3, fruity: 4, body: 3 },
  "Witbier": { bitter: 1, sweet: 3, fruity: 4, body: 2 },
  "Blanche": { bitter: 1, sweet: 3, fruity: 3, body: 2 },

  // Dark
  "Stout": { bitter: 4, sweet: 2, fruity: 1, body: 5 },
  "Oatmeal Stout": { bitter: 3, sweet: 3, fruity: 2, body: 5 },
  "Porter": { bitter: 3, sweet: 3, fruity: 1, body: 4 },
  "Rauchbier": { bitter: 3, sweet: 1, fruity: 1, body: 4 },

  // Sour / Fruit
  "Sour": { bitter: 1, sweet: 2, fruity: 4, body: 2 },
  "Lambic": { bitter: 1, sweet: 2, fruity: 3, body: 2 },
  "Gueuze": { bitter: 2, sweet: 1, fruity: 3, body: 2 },
  "Fruit Beer": { bitter: 1, sweet: 4, fruity: 5, body: 2 },
};

/** Get default color for a style, with fallback */
export function getDefaultColor(style: string): string {
  return COLOR_BY_STYLE[style] || "#F59E0B";
}

/** Get default taste profile for a style, with fallback */
export function getDefaultTaste(style: string): { bitter: number; sweet: number; fruity: number; body: number } {
  return TASTE_BY_STYLE[style] || { bitter: 3, sweet: 3, fruity: 3, body: 3 };
}

/** Complete list of beer styles for the AddBeerModal dropdown */
export const BEER_STYLES = [
  "IPA",
  "Double IPA",
  "Session IPA",
  "New England IPA",
  "American Pale Ale",
  "Pale Ale",
  "Belgian Pale Ale",
  "Blonde Ale",
  "Belgian Blonde",
  "Belgian Strong Pale",
  "Amber Ale",
  "Red Ale",
  "Brown Ale",
  "Stout",
  "Oatmeal Stout",
  "Porter",
  "Lager",
  "Pilsner",
  "Czech Pilsner",
  "Helles",
  "Hefeweizen",
  "Witbier",
  "Tripel",
  "Dubbel",
  "Quadrupel",
  "Belgian Strong Dark",
  "Saison",
  "Sour",
  "Lambic",
  "Gueuze",
  "Fruit Beer",
  "Wheat Beer",
  "Rauchbier",
  "Barleywine",
  "Bock",
  "Strong Ale",
  "Scotch Ale",
  "Biere de Garde",
  "Bitter",
  "Kolsch",
  "Autre",
] as const;
