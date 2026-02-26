/**
 * ═══════════════════════════════════════════════════════════════
 * GLUPP — Rééquilibrage de la rareté des bières
 *
 * Distribution cible :
 *   common     ~35%   → Bières très connues / grandes marques
 *   rare       ~40%   → Bières artisanales / régionales
 *   epic       ~20%   → Bières rares / peu distribuées
 *   legendary  ~5%    → Bières exceptionnelles / introuvables
 *
 * Usage : node rebalance-rarity.mjs
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuymwggxnaaoxlshwwyn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Styles considérés comme "premium" (plus rares naturellement) ───
const PREMIUM_STYLES = new Set([
  "Trappist", "Barleywine", "Quadrupel", "Scotch Ale", "Smoked Beer",
  "Imperial Stout", "Double IPA", "Sour", "Saison", "Bock",
]);

const CRAFT_STYLES = new Set([
  "IPA", "New England IPA", "Stout", "Porter", "Tripel", "Dubbel",
  "Pale Ale", "Brown Ale", "Red Ale", "Abbey Ale", "Altbier",
  "Kölsch", "Bitter", "Session Beer", "Fruit Beer",
]);

// Grandes marques industrielles → common
const INDUSTRIAL_BREWERIES = [
  "heineken", "kronenbourg", "1664", "carlsberg", "jupiler", "leffe",
  "grimbergen", "affligem", "stella artois", "budweiser", "corona",
  "beck's", "paulaner", "erdinger", "warsteiner", "bitburger",
  "guinness", "amstel", "desperados", "pelforth", "meteor",
  "fischer", "kanterbräu", "33 export", "skol", "foster",
  "san miguel", "mahou", "estrella", "peroni", "moretti",
  "asahi", "kirin", "sapporo", "tsing tao", "tiger",
  "hoegaarden", "delirium", "chimay", "orval", "rochefort",
  "duvel", "la chouffe", "kwak", "karmeliet", "westmalle",
];

/**
 * Calcule un score de rareté pour une bière (0-100)
 * Plus le score est élevé, plus la bière est rare
 */
function computeRarityScore(beer) {
  let score = 50; // Score de base neutre

  const breweryLower = (beer.brewery || "").toLowerCase();
  const nameLower = (beer.name || "").toLowerCase();

  // ─── Critère 1 : Marque industrielle → score bas ───
  const isIndustrial = INDUSTRIAL_BREWERIES.some(b =>
    breweryLower.includes(b) || nameLower.includes(b)
  );
  if (isIndustrial) score -= 30;

  // ─── Critère 2 : Style premium → score haut ───
  if (PREMIUM_STYLES.has(beer.style)) score += 20;
  else if (CRAFT_STYLES.has(beer.style)) score += 5;
  else if (beer.style === "Bière" || beer.style === "Lager") score -= 10;

  // ─── Critère 3 : ABV élevé → plus rare ───
  const abv = parseFloat(beer.abv) || 0;
  if (abv >= 10) score += 15;
  else if (abv >= 8) score += 10;
  else if (abv >= 6) score += 3;
  else if (abv > 0 && abv < 4) score -= 5;

  // ─── Critère 4 : Pays exotique → plus rare ───
  const commonCountries = new Set(["🇫🇷", "🇩🇪", "🇧🇪", "🇬🇧", "🇪🇸", "🇮🇹", "🇳🇱"]);
  if (beer.country && !commonCountries.has(beer.country) && beer.country !== "🍺") {
    score += 10;
  }

  // ─── Critère 5 : A une image → légèrement plus "documentée" ───
  if (!beer.image_url) score += 5; // Pas d'image = plus obscure

  // ─── Critère 6 : Nom long / complexe → souvent artisanale ───
  if (beer.name && beer.name.length > 25) score += 5;

  // ─── Critère 7 : Région renseignée → plus traçable ───
  if (beer.region) score += 3;

  // Clamp entre 0 et 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Convertit un score en rareté avec distribution cible
 */
function scoreToRarity(score) {
  if (score >= 80) return "legendary";  // ~5%
  if (score >= 60) return "epic";       // ~20%
  if (score >= 40) return "rare";       // ~40%
  return "common";                       // ~35%
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("✨ GLUPP — Rééquilibrage de la rareté");
  console.log("═══════════════════════════════════════════\n");

  // Charger toutes les bières
  console.log("🔍 Chargement des bières...");

  // Supabase limite à 1000 par défaut, on pagine
  let allBeers = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("beers")
      .select("id, name, brewery, style, abv, country, image_url, region, rarity")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("❌ Erreur:", error.message);
      return;
    }

    allBeers = allBeers.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`  ✅ ${allBeers.length} bières chargées\n`);

  // Distribution actuelle
  const currentDist = { common: 0, rare: 0, epic: 0, legendary: 0 };
  allBeers.forEach(b => currentDist[b.rarity]++);
  console.log("📊 Distribution actuelle :");
  Object.entries(currentDist).forEach(([r, c]) =>
    console.log(`   ${r.padEnd(12)} ${c} (${(c / allBeers.length * 100).toFixed(1)}%)`)
  );

  // Calculer les nouveaux scores et raretés
  const updates = { common: [], rare: [], epic: [], legendary: [] };
  const newDist = { common: 0, rare: 0, epic: 0, legendary: 0 };

  for (const beer of allBeers) {
    const score = computeRarityScore(beer);
    const newRarity = scoreToRarity(score);
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

  // Appliquer les mises à jour par rareté
  for (const [rarity, ids] of Object.entries(updates)) {
    if (ids.length === 0) continue;

    console.log(`  📤 Mise à jour ${ids.length} bières → ${rarity}...`);

    // Update par batch de 100 IDs
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from("beers")
        .update({ rarity, updated_at: new Date().toISOString() })
        .in("id", batch);

      if (error) {
        console.error(`  ❌ Erreur batch ${rarity} ${i}-${i + 100}:`, error.message);
      }
    }
  }

  // Vérification finale
  const { data: verify } = await supabase
    .from("beers")
    .select("rarity");

  const finalDist = { common: 0, rare: 0, epic: 0, legendary: 0 };
  verify.forEach(b => finalDist[b.rarity]++);

  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Rééquilibrage terminé !");
  console.log("📊 Distribution finale :");
  Object.entries(finalDist).forEach(([r, c]) =>
    console.log(`   ${r.padEnd(12)} ${c} (${(c / verify.length * 100).toFixed(1)}%)`)
  );
  console.log("═══════════════════════════════════════════");
}

main().catch(console.error);
