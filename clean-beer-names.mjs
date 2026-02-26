/**
 * ═══════════════════════════════════════════════════════════════
 * GLUPP — Nettoyage des noms de bières en base
 *
 * Problème : les noms importés d'Open Food Facts contiennent souvent
 * des suffixes parasites : ", 4.3%", ", pack de 12x25cl",
 * ", bière brune", "0,0%", etc.
 *
 * IMPORTANT : On ne retire PAS le nom de brasserie du début !
 * "Rochefort 10" doit rester "Rochefort 10", pas "10"
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuymwggxnaaoxlshwwyn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN = false;

/**
 * Nettoie un nom de bière — CONSERVATIF, ne retire pas la brasserie
 */
function cleanBeerName(name) {
  if (!name) return name;
  let cleaned = name;

  // 1. Retirer les préfixes volume : "33CL ", "BTE 50CL ", "BLE 75CL ", "BLE 33CL "
  cleaned = cleaned.replace(/^(?:BTE|BLE|BOUT|BTL)?\s*\d+\s*(?:CL|ML|L)\s+/i, "");

  // 2. Retirer les suffixes volume : ", 33cl", ", 75 cl", ", 33 cl, pack de 12 × 25 cl"
  cleaned = cleaned.replace(/,?\s*(?:pack\s+de\s+)?\d+\s*[x×]\s*\d+\s*(?:cl|ml|l)\b/gi, "");
  cleaned = cleaned.replace(/,?\s+\d+\s*(?:cl|ml|l)\b/gi, "");
  // "MORETTI 33 CL" → "MORETTI"
  cleaned = cleaned.replace(/\s+\d+\s*(?:CL|ML|L)$/i, "");

  // 3. Retirer les suffixes alcool en fin : "-4,2%", ", 5%", " 8.4%V", " 5.90%", "0,0%"
  cleaned = cleaned.replace(/[\s,-]+\d+[.,]\d+\s*%\s*(?:vol\.?|V|alc\.?)?$/gi, "");
  // Aussi le pattern "8%V"
  cleaned = cleaned.replace(/\s+\d+\s*%\s*V?$/gi, "");

  // 4. Si le nom entier est juste un pourcentage, garder l'original
  if (/^\d+[.,]\d+\s*%?$/.test(cleaned.trim())) return name;

  // 5. Retirer les descripteurs génériques après virgule : ", bière brune", ", bière blonde"
  cleaned = cleaned.replace(/,\s*bi[eè]re\s+(?:brune|blonde|blanche|ambr[eé]e|rouge|noire|forte|l[eé]g[eè]re|sans\s+alcool|de\s+\w+|aromatisée?\s+\w+)/gi, "");

  // 6. Retirer virgules et espaces trailing
  cleaned = cleaned.replace(/[,\s]+$/, "").trim();

  // 7. Retirer les parenthèses avec juste un chiffre ou %
  cleaned = cleaned.replace(/\s*\(\s*\d+[.,]?\d*\s*%?\s*\)/, "").trim();

  // 8. Capitaliser la première lettre si tout en minuscule
  if (cleaned && cleaned === cleaned.toLowerCase() && cleaned.length > 1) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 9. Si le nom nettoyé est vide ou trop court (< 2 car), garder l'original
  if (!cleaned || cleaned.length < 2) return name;

  return cleaned;
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("🧹 GLUPP — Nettoyage des noms de bières");
  console.log("═══════════════════════════════════════════\n");

  if (DRY_RUN) console.log("🧪 MODE DRY RUN\n");

  // Charger toutes les bières
  let allBeers = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("beers")
      .select("id, name, brewery")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error("❌ Erreur:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allBeers = allBeers.concat(data);
    page++;
  }

  console.log(`📦 ${allBeers.length} bières chargées\n`);

  // Nettoyer les noms
  const updates = [];
  const examples = [];

  for (const beer of allBeers) {
    const cleanedName = cleanBeerName(beer.name);
    if (cleanedName !== beer.name) {
      updates.push({ id: beer.id, name: cleanedName });
      if (examples.length < 40) {
        examples.push({ before: beer.name, after: cleanedName, brewery: beer.brewery });
      }
    }
  }

  console.log(`🔄 ${updates.length} noms à nettoyer sur ${allBeers.length}\n`);

  if (examples.length > 0) {
    console.log("📋 Exemples de nettoyage :");
    for (const ex of examples) {
      console.log(`   "${ex.before}" → "${ex.after}"  [${ex.brewery}]`);
    }
    console.log();
  }

  if (DRY_RUN) {
    console.log("🧪 DRY RUN — Aucune mise à jour effectuée");
    return;
  }

  // Mettre à jour en batch
  let updated = 0;
  let errors = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from("beers")
      .update({ name: update.name })
      .eq("id", update.id);

    if (error) {
      errors++;
      if (errors <= 5) console.error(`   ❌ ${update.id}: ${error.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✅ Nettoyage terminé !`);
  console.log(`   Mis à jour : ${updated}`);
  console.log(`   Erreurs :    ${errors}`);
  console.log(`   Inchangés :  ${allBeers.length - updates.length}`);
  console.log(`═══════════════════════════════════════════`);
}

main().catch(console.error);
