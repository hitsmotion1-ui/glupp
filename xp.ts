// ═══════════════════════════════════════════
// GLUPP — XP System Constants & Utilities
// ═══════════════════════════════════════════

export const XP_LEVELS = [
  { level: 1, title: "Néophyte Curieux", icon: "🌱", min: 0 },
  { level: 2, title: "Apprenti Goûteur", icon: "🍺", min: 500 },
  { level: 3, title: "Hop Voyageur", icon: "🧭", min: 1500 },
  { level: 4, title: "Maître Brasseur", icon: "⚗️", min: 3500 },
  { level: 5, title: "Sommelier Houblon", icon: "🎓", min: 7000 },
  { level: 6, title: "Légende Mousseuse", icon: "👑", min: 12000 },
  { level: 7, title: "Dieu de la Bière", icon: "⚡", min: 20000 },
] as const;

export const XP_GAINS = {
  duel: 15,
  scan: 5,
  photo: 20,
  photo_geo: 40,
  tag_friend: 10,
  rare_beer: 10,
  epic_beer: 30,
  legendary_beer: 50,
  trophy: 200,
  challenge: 500,
  gotw: 50,
  passport_complete: 100,
} as const;

export const RARITY_CONFIG = {
  common: { label: "Commune", color: "#8D7C6C", xpBonus: 0 },
  rare: { label: "Rare", color: "#4ECDC4", xpBonus: 10 },
  epic: { label: "Épique", color: "#A78BFA", xpBonus: 30 },
  legendary: { label: "Légendaire", color: "#F0C460", xpBonus: 50 },
} as const;

export type Rarity = keyof typeof RARITY_CONFIG;
export type XPLevel = (typeof XP_LEVELS)[number];

/** Get the current level for a given XP total */
export function getLevel(xp: number): XPLevel {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].min) return XP_LEVELS[i];
  }
  return XP_LEVELS[0];
}

/** Get the next level (or null if max) */
export function getNextLevel(xp: number): XPLevel | null {
  const current = getLevel(xp);
  const idx = XP_LEVELS.findIndex((l) => l.level === current.level);
  return idx < XP_LEVELS.length - 1 ? XP_LEVELS[idx + 1] : null;
}

/** Get progress percentage toward next level (0-100) */
export function getLevelProgress(xp: number): number {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  return Math.round(((xp - current.min) / (next.min - current.min)) * 100);
}

/** Calculate ELO expected score */
export function eloExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/** Calculate new ELO ratings after a duel (client-side preview) */
export function eloUpdate(
  eloA: number,
  eloB: number,
  aWins: boolean,
  K: number = 32
): { newEloA: number; newEloB: number } {
  const expectedA = eloExpected(eloA, eloB);
  const expectedB = eloExpected(eloB, eloA);
  const scoreA = aWins ? 1 : 0;
  const scoreB = aWins ? 0 : 1;
  return {
    newEloA: Math.round(eloA + K * (scoreA - expectedA)),
    newEloB: Math.round(eloB + K * (scoreB - expectedB)),
  };
}

/** Format large numbers (1234 → "1.2K") */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString("fr-FR");
}

/** Get beer emoji by style */
export function beerEmoji(style: string): string {
  const s = style.toLowerCase();
  if (s.includes("ipa")) return "🍺";
  if (s.includes("stout") || s.includes("porter")) return "🍫";
  if (s.includes("wheat") || s.includes("weizen") || s.includes("wit") || s.includes("blanche")) return "🌾";
  if (s.includes("sour") || s.includes("lambic") || s.includes("gueuze")) return "🍋";
  if (s.includes("lager") || s.includes("pilsner") || s.includes("helles")) return "🍻";
  if (s.includes("saison") || s.includes("farmhouse")) return "🌿";
  if (s.includes("fruit")) return "🍓";
  if (s.includes("amber") || s.includes("red")) return "🔴";
  if (s.includes("belgian") || s.includes("tripel") || s.includes("dubbel") || s.includes("quad")) return "🏰";
  return "🍺";
}
