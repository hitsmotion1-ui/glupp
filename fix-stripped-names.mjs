/**
 * ═══════════════════════════════════════════════════════════════
 * GLUPP — Réparer les noms trop agressivement nettoyés
 *
 * Le 1er run de clean-beer-names a retiré le nom de brasserie du début,
 * transformant "Rochefort 10" → "10", "Grimbergen Blonde" → "Blonde", etc.
 *
 * Ce script :
 *   1. Charge les bières avec barcode
 *   2. Pour les noms suspectement courts (< 4 car) ou trop génériques,
 *      re-fetch le nom original depuis OpenFoodFacts par barcode
 *   3. Applique un nettoyage CONSERVATIF (sans retirer la brasserie)
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuymwggxnaaoxlshwwyn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Noms trop génériques qui indiquent un strip trop agressif
const GENERIC_NAMES = new Set([
  "blonde", "brune", "blanche", "ambrée", "ambree", "rouge", "noire",
  "ipa", "stout", "porter", "lager", "pilsner", "helles",
  "pale ale", "triple", "tripel", "dubbel", "double", "quadrupel",
  "rauchbier", "imperial stout", "hefe", "weizen",
  "super dry", "original", "classique", "classic", "premium",
  "mini", "xl", "forte", "légère", "light", "zero", "sans alcool",
]);

function isNameSuspicious(name) {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  // Trop court
  if (lower.length <= 3) return true;
  // Nom générique (un style de bière tout seul)
  if (GENERIC_NAMES.has(lower)) return true;
  // Juste un chiffre
  if (/^\d+$/.test(lower)) return true;
  // Commence par ", " (nettoyage raté)
  if (lower.startsWith(",")) return true;
  // "er " au début (troncature d'un nom)
  if (lower.startsWith("er ")) return true;
  return false;
}

/**
 * Nettoyage conservatif — ne retire PAS le nom de brasserie
 */
function cleanBeerName(name) {
  if (!name) return name;
  let cleaned = name;

  // Préfixes volume
  cleaned = cleaned.replace(/^(?:BTE|BLE|BOUT|BTL)?\s*\d+\s*(?:CL|ML|L)\s+/i, "");
  // Suffixes volume
  cleaned = cleaned.replace(/,?\s*(?:pack\s+de\s+)?\d+\s*[x×]\s*\d+\s*(?:cl|ml|l)\b/gi, "");
  cleaned = cleaned.replace(/,?\s+\d+\s*(?:cl|ml|l)\b/gi, "");
  cleaned = cleaned.replace(/\s+\d+\s*(?:CL|ML|L)$/i, "");
  // Suffixes alcool
  cleaned = cleaned.replace(/[\s,-]+\d+[.,]\d+\s*%\s*(?:vol\.?|V|alc\.?)?$/gi, "");
  cleaned = cleaned.replace(/\s+\d+\s*%\s*V?$/gi, "");
  // Descripteurs après virgule
  cleaned = cleaned.replace(/,\s*bi[eè]re\s+(?:brune|blonde|blanche|ambr[eé]e|rouge|noire|forte|l[eé]g[eè]re|sans\s+alcool)/gi, "");
  // Trailing
  cleaned = cleaned.replace(/[,\s]+$/, "").trim();
  // Parenthèses %
  cleaned = cleaned.replace(/\s*\(\s*\d+[.,]?\d*\s*%?\s*\)/, "").trim();

  if (!cleaned || cleaned.length < 2) return name;
  return cleaned;
}

async function fetchOriginalName(barcode) {
  try {
    const resp = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_fr,brands`,
      { headers: { "User-Agent": "Glupp-Fix/1.0 (contact@glupp.app)" } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const originalName = p.product_name || p.product_name_fr || null;
    return originalName ? cleanBeerName(originalName) : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("🔧 GLUPP — Réparation des noms tronqués");
  console.log("═══════════════════════════════════════════\n");

  // Charger toutes les bières avec barcode
  let allBeers = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("beers")
      .select("id, name, brewery, barcode")
      .not("barcode", "is", null)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error("❌ Erreur:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allBeers = allBeers.concat(data);
    page++;
  }

  console.log(`📦 ${allBeers.length} bières avec barcode chargées`);

  // Filtrer les noms suspects
  const suspicious = allBeers.filter(b => isNameSuspicious(b.name));
  console.log(`🔍 ${suspicious.length} noms suspects détectés\n`);

  if (suspicious.length === 0) {
    console.log("✅ Aucun nom à réparer !");
    return;
  }

  // Exemples
  console.log("📋 Noms suspects :");
  suspicious.slice(0, 20).forEach(b => {
    console.log(`   "${b.name}" [${b.brewery}] (barcode: ${b.barcode})`);
  });
  console.log();

  // Re-fetch depuis OpenFoodFacts
  let fixed = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < suspicious.length; i++) {
    const beer = suspicious[i];
    const originalName = await fetchOriginalName(beer.barcode);

    if (originalName && originalName !== beer.name && originalName.length > beer.name.length) {
      console.log(`   ✅ "${beer.name}" → "${originalName}" [${beer.brewery}]`);

      const { error } = await supabase
        .from("beers")
        .update({ name: originalName })
        .eq("id", beer.id);

      if (error) {
        errors++;
        console.error(`      ❌ ${error.message}`);
      } else {
        fixed++;
      }
    } else {
      notFound++;
    }

    // Rate limit OpenFoodFacts
    if (i < suspicious.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }

    // Progress
    if ((i + 1) % 20 === 0) {
      console.log(`   ... ${i + 1}/${suspicious.length} traités`);
    }
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✅ Réparation terminée !`);
  console.log(`   Réparés :      ${fixed}`);
  console.log(`   Non trouvés :  ${notFound}`);
  console.log(`   Erreurs :      ${errors}`);
  console.log(`═══════════════════════════════════════════`);
}

main().catch(console.error);
