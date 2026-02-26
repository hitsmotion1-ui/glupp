/**
 * ═══════════════════════════════════════════════════════════════
 * GLUPP — Rééquilibrage de la rareté des bières
 *
 * Distribution cible :
 *   common     ~30%   → Bières très connues / grandes marques
 *   rare       ~40%   → Bières artisanales / régionales
 *   epic       ~22%   → Bières rares / peu distribuées
 *   legendary  ~8%    → Bières exceptionnelles / introuvables
 *
 * Usage : node rebalance-rarity.mjs
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuymwggxnaaoxlshwwyn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Styles premium (rares naturellement) ───
const PREMIUM_STYLES = new Set([
  "Trappist", "Barleywine", "Quadrupel", "Scotch Ale", "Smoked Beer",
]);

const CRAFT_STYLES = new Set([
  "IPA", "New England IPA", "Stout", "Porter", "Double IPA",
  "Tripel", "Dubbel", "Sour", "Saison", "Bock",
  "Pale Ale", "Brown Ale", "Red Ale", "Abbey Ale", "Altbier",
  "Kölsch", "Bitter", "Session Beer", "Fruit Beer", "Helles",
]);

// Grandes marques INDUSTRIELLES pures → common
// NOTE : Chimay, Orval, Rochefort, Duvel, Chouffe, Kwak = craft belge, PAS industriel
const INDUSTRIAL_BREWERIES = [
  "heineken", "kronenbourg", "1664", "carlsberg", "jupiler",
  "stella artois", "budweiser", "corona", "beck's",
  "warsteiner", "bitburger", "amstel", "desperados",
  "pelforth", "meteor", "fischer", "kanterbräu", "kanterbrau",
  "33 export", "skol", "foster", "san miguel", "mahou",
  "estrella", "peroni", "moretti", "asahi", "kirin",
  "sapporo", "tsing tao", "tiger", "hoegaarden",
  "auchan", "carrefour", "leclerc", "lidl", "perlembourg",
  "faxe", "hollandia", "8.6", "bavaria",
];

// Brasseries craft connues → boost epic/legendary
const CRAFT_BREWERIES = [
  "chimay", "orval", "rochefort", "westmalle", "westvleteren",
  "duvel", "la chouffe", "chouffe", "kwak", "karmeliet",
  "delirium", "cantillon", "brasserie de la senne", "mikkeller",
  "brewdog", "ninkasi", "stone brewing", "founders",
  "sierra nevada", "lagunitas", "dogfish head", "toppling goliath",
  "three floyds", "tree house", "hill farmstead", "pliny",
  "unibroue", "dieu du ciel", "brasserie dupont", "saison dupont",
  "nøgne ø", "omnipollo", "to øl", "evil twin",
  "la trappe", "achel", "spencer", "mont des cats",
  "brasserie d'achouffe", "leffe", "grimbergen", "affligem",
];

/**
 * Calcule un score de rareté pour une bière (0-100)
 */
function computeRarityScore(beer) {
  let score = 45; // Score de base

  const breweryLower = (beer.brewery || "").toLowerCase();
  const nameLower = (beer.name || "").toLowerCase();
  const combined = breweryLower + " " + nameLower;

  // ─── Critère 1 : Marque industrielle → score bas ───
  const isIndustrial = INDUSTRIAL_BREWERIES.some(b => combined.includes(b));
  if (isIndustrial) score -= 25;

  // ─── Critère 1b : Brasserie craft reconnue → boost ───
  const isCraft = CRAFT_BREWERIES.some(b => combined.includes(b));
  if (isCraft) score += 15;

  // ─── Critère 2 : Style ───
  if (PREMIUM_STYLES.has(beer.style)) score += 25;
  else if (CRAFT_STYLES.has(beer.style)) score += 10;
  else if (beer.style === "Bière" || beer.style === "Lager") score -= 10;

  // ─── Critère 3 : ABV élevé → plus rare ───
  const abv = parseFloat(beer.abv) || 0;
  if (abv >= 12) score += 20;
  else if (abv >= 10) score += 15;
  else if (abv >= 8) score += 10;
  else if (abv >= 6.5) score += 5;
  else if (abv > 0 && abv < 3) score -= 5;

  // ─── Critère 4 : Pays exotique → plus rare ───
  const commonCountries = new Set(["🇫🇷", "🇩🇪", "🇧🇪", "🇬🇧", "🇪🇸", "🇮🇹", "🇳🇱"]);
  if (beer.country && !commonCountries.has(beer.country) && beer.country !== "🍺") {
    score += 10;
  }

  // ─── Critère 5 : Belgique = brassage noble ───
  if (beer.country === "🇧🇪") score += 5;

  // ─── Critère 6 : Pas d'image → plus obscure ───
  if (!beer.image_url) score += 3;

  // ─── Critère 7 : Région renseignée ───
  if (beer.region) score += 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Distribution par percentiles pour atteindre la cible
 * On trie par score, puis on assigne selon les percentiles
 */
function assignRarityByPercentile(beers) {
  // Calculer les scores
  const scored = beers.map(beer => ({
    ...beer,
    score: computeRarityScore(beer),
  }));

  // Trier par score croissant
  scored.sort((a, b) => a.score - b.score);

  const total = scored.length;
  const result = {};

  for (let i = 0; i < total; i++) {
    const percentile = i / total;
    let newRarity;

    if (percentile < 0.30) newRarity = "common";       // 30%
    else if (percentile < 0.70) newRarity = "rare";     // 40%
    else if (percentile < 0.92) newRarity = "epic";     // 22%
    else newRarity = "legendary";                        // 8%

    result[scored[i].id] = newRarity;
  }

  return result;
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("✨ GLUPP — Rééquilibrage de la rareté v2");
  console.log("═══════════════════════════════════════════\n");

  // Charger toutes les bières
  let allBeers = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("beers")
      .select("id, name, brewery, style, abv, country, image_url, region, rarity")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) { console.error("❌", error.message); return; }
    allBeers = allBeers.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`📦 ${allBeers.length} bières chargées\n`);

  // Distribution actuelle
  const currentDist = { common: 0, rare: 0, epic: 0, legendary: 0 };
  allBeers.forEach(b => { currentDist[b.rarity] = (currentDist[b.rarity] || 0) + 1; });
  console.log("📊 Distribution actuelle :");
  Object.entries(currentDist).forEach(([r, c]) =>
    console.log(`   ${r.padEnd(12)} ${c} (${(c / allBeers.length * 100).toFixed(1)}%)`)
  );

  // Assigner par percentiles pour garantir la distribution
  const assignments = assignRarityByPercentile(allBeers);

  // Compter les changements
  const updates = { common: [], rare: [], epic: [], legendary: [] };
  const newDist = { common: 0, rare: 0, epic: 0, legendary: 0 };

  for (const beer of allBeers) {
    const newRarity = assignments[beer.id];
    newDist[newRarity]++;
    if (newRarity !== beer.rarity) {
      updates[newRarity].push(beer.id);
    }
  }

  console.log("\n📊 Nouvelle distribution :");
  Object.entries(newDist).forEach(([r, c]) =>
    console.log(`   ${r.padEnd(12)} ${c} (${(c / allBeers.length * 100).toFixed(1)}%)`)
  );

  const totalChanges = Object.values(updates).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`\n🔄 ${totalChanges} bières à mettre à jour\n`);

  if (totalChanges === 0) {
    console.log("✅ Aucun changement nécessaire !");
    return;
  }

  // Appliquer
  for (const [rarity, ids] of Object.entries(updates)) {
    if (ids.length === 0) continue;
    console.log(`  📤 ${ids.length} → ${rarity}`);

    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from("beers")
        .update({ rarity, updated_at: new Date().toISOString() })
        .in("id", batch);

      if (error) console.error(`  ❌ batch ${rarity}:`, error.message);
    }
  }

  // Exemples de legendary
  const legendaryIds = Object.entries(assignments)
    .filter(([, r]) => r === "legendary")
    .map(([id]) => id);

  if (legendaryIds.length > 0) {
    const sample = legendaryIds.slice(0, 20);
    const { data: legends } = await supabase
      .from("beers")
      .select("name, brewery, style, abv, country")
      .in("id", sample);

    console.log("\n🏆 Exemples de Legendary :");
    legends?.forEach(b => console.log(`   ${b.country} ${b.name} — ${b.brewery} (${b.style}, ${b.abv || "?"}%)`));
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Rééquilibrage terminé !");
  console.log("═══════════════════════════════════════════");
}

main().catch(console.error);
