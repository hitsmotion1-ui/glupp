import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yuymwggxnaaoxlshwwyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM"
);

// ═══════════════════════════════════════
// 1. STYLE MAPPING — 47 styles → ~12
// ═══════════════════════════════════════

const STYLE_MAP = {
  // Blonde / Lager
  "Lager": "Blonde / Lager",
  "Helles Lager": "Blonde / Lager",
  "Mexican Lager": "Blonde / Lager",
  "Japanese Lager": "Blonde / Lager",
  "Czech Lager": "Blonde / Lager",
  "Blonde Ale": "Blonde / Lager",
  "Belgian Blonde": "Blonde / Lager",
  "Kölsch": "Blonde / Lager",

  // Pilsner
  "Pilsner": "Pilsner",
  "Czech Pilsner": "Pilsner",

  // Blanche / Wheat
  "Wheat Beer": "Blanche",
  "Witbier": "Blanche",
  "Hefeweizen": "Blanche",

  // IPA
  "IPA": "IPA",
  "American IPA": "IPA",
  "Double IPA": "IPA",
  "New England IPA": "IPA",

  // Pale Ale
  "Pale Ale": "Pale Ale",
  "American Pale Ale": "Pale Ale",
  "English Pale Ale": "Pale Ale",
  "Belgian Pale Ale": "Pale Ale",
  "ESB": "Pale Ale",
  "Bitter": "Pale Ale",

  // Ambrée
  "Amber Ale": "Ambrée",
  "Red Ale": "Ambrée",
  "Altbier": "Ambrée",
  "Scotch Ale": "Ambrée",

  // Brune / Stout / Porter
  "Stout": "Stout / Porter",
  "Porter": "Stout / Porter",
  "Imperial Stout": "Stout / Porter",
  "Oatmeal Stout": "Stout / Porter",
  "Brown Ale": "Stout / Porter",
  "Smoked Beer": "Stout / Porter",
  "Rauchbier": "Stout / Porter",

  // Triple / Strong
  "Tripel": "Triple",
  "Strong Ale": "Strong Ale",
  "Belgian Strong Pale": "Triple",
  "Belgian Strong Dark": "Strong Ale",
  "Barleywine": "Strong Ale",
  "Quadrupel": "Quadrupel",

  // Abbaye / Trappiste
  "Abbey Ale": "Abbaye",
  "Dubbel": "Abbaye",
  "Trappist": "Abbaye",

  // Saison / Sour / Spéciale
  "Saison": "Saison / Spéciale",
  "Sour": "Saison / Spéciale",
  "Fruit Beer": "Saison / Spéciale",

  // Fallback for "Bière" (generic) - will stay as is, cleaned below
  "Bière": "Bière",
};

// ═══════════════════════════════════════
// 2. NAME CLEANING FUNCTION
// ═══════════════════════════════════════

function cleanName(name, brewery) {
  let n = name;

  // Remove HTML entities
  n = n.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '');

  // Remove ABV patterns: 4.5%, 8.5%V, 5°, 6%V, 9%, etc
  n = n.replace(/[\s,]*\d+[.,]?\d*\s*%\s*(vol\.?|v\.?|alc\.?|ABV)?/gi, '');
  n = n.replace(/[\s,]*\d+°/g, '');

  // Remove volume: 33cl, 75cl, 0,33LT, 1L, etc
  n = n.replace(/[\s,]*\d+[.,]?\d*\s*(cl|ml|lt?r?|litre?s?)\b[^a-z]*/gi, '');
  n = n.replace(/[\s,]*\(?\d+\s*x\s*\d+[.,]?\d*\s*(cl|ml|l)\)?/gi, '');

  // Remove "Pack", "Fût", "Bouteille", "Canette", "Dose", "Flasche"
  n = n.replace(/\b(pack|fût|bouteille|canette|la cannette de|dose|flasche|bidon)\b/gi, '');

  // Remove "Bier.", "Bière", "Beer", "Cerveza", "Cerveja" prefix
  n = n.replace(/^(bier\.|bière|beer|cerveza|cerveja|pivo)\s*/i, '');

  // Remove "sans alcool", "sin alcohol", "alkoholfrei", "0,0%", "0.0%"
  // Keep these as they are real variants - but clean the formatting
  n = n.replace(/\b(sans gluten|gluten[ -]?free|s\s*\/\s*retorno)\b/gi, '');

  // Remove "Premium", "Quality", "Original" noise words at start/end
  n = n.replace(/\b(premium quality|premium lager|premium)\b/gi, '').trim();

  // Remove trailing "- GRF", "- Alc.", "- beer", etc
  n = n.replace(/\s*-\s*(GRF|Alc\.?|beer|bière|pils|lager)\s*$/i, '');

  // Remove leading brewery name if it duplicates
  const brewLower = brewery.toLowerCase();
  const nameLower = n.toLowerCase();
  if (nameLower.startsWith(brewLower + ' ') || nameLower.startsWith(brewLower + ',')) {
    n = n.substring(brewery.length).replace(/^[\s,]+/, '');
  }

  // Clean parentheses with useless content (but keep meaningful ones like "(Trappist)")
  n = n.replace(/\((\d+x\d+|dose|naturtrüb|tostada)\)/gi, '');

  // Remove "Lidl", "Auchan", "Carrefour", "Intermarché", "U" distributor suffixes
  n = n.replace(/\s+(Lidl|Auchan|Carrefour|Intermarché)\s*$/i, '');

  // Clean up spaces
  n = n.replace(/\s+/g, ' ').trim();

  // Remove trailing punctuation
  n = n.replace(/[\s,.\-:;]+$/, '').trim();

  // If name became empty or too short (< 2 chars), use brewery
  if (n.length < 2) {
    n = brewery;
  }

  // Capitalize first letter
  if (n.length > 0) {
    n = n.charAt(0).toUpperCase() + n.slice(1);
  }

  return n;
}

// ═══════════════════════════════════════
// MAIN — Run all cleanups
// ═══════════════════════════════════════

async function main() {
  console.log("📦 Loading all beers...");

  let all = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from("beers")
      .select("id, name, style, brewery, elo, total_votes, is_active")
      .eq("is_active", true)
      .range(page * 1000, (page + 1) * 1000 - 1);
    all = all.concat(data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`   ${all.length} bières chargées\n`);

  // ─── STEP 1: Remap styles ───
  console.log("🎨 STEP 1: Remapping styles...");
  let styleUpdates = 0;
  for (const beer of all) {
    const newStyle = STYLE_MAP[beer.style];
    if (newStyle && newStyle !== beer.style) {
      const { error } = await supabase
        .from("beers")
        .update({ style: newStyle })
        .eq("id", beer.id);
      if (!error) {
        styleUpdates++;
        beer.style = newStyle; // update local copy
      }
    }
  }

  // Count new distribution
  const newStyles = {};
  all.forEach(b => { newStyles[b.style] = (newStyles[b.style] || 0) + 1; });
  const sortedNew = Object.entries(newStyles).sort((a,b) => b[1] - a[1]);
  console.log(`   ${styleUpdates} styles mis à jour`);
  console.log(`   Nouvelle distribution (${sortedNew.length} catégories):`);
  sortedNew.forEach(([s, c]) => console.log(`     ${String(c).padStart(5)}  ${s}`));

  // ─── STEP 2: Clean names ───
  console.log("\n🧹 STEP 2: Cleaning names...");
  let nameUpdates = 0;
  for (const beer of all) {
    const cleaned = cleanName(beer.name, beer.brewery);
    if (cleaned !== beer.name) {
      const { error } = await supabase
        .from("beers")
        .update({ name: cleaned })
        .eq("id", beer.id);
      if (!error) {
        if (nameUpdates < 30) {
          console.log(`   "${beer.name}" → "${cleaned}"`);
        }
        beer.name = cleaned; // update local copy
        nameUpdates++;
      }
    }
  }
  console.log(`   ${nameUpdates} noms nettoyés\n`);

  // ─── STEP 3: Remove exact duplicates ───
  console.log("🔄 STEP 3: Removing duplicates...");
  const byKey = {};
  for (const beer of all) {
    const key = (beer.brewery + "||" + beer.name).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(beer);
  }

  let deactivated = 0;
  let keptIds = new Set();
  for (const [key, beers] of Object.entries(byKey)) {
    if (beers.length < 2) continue;

    // Keep the one with most votes, deactivate others
    beers.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
    const keep = beers[0];
    keptIds.add(keep.id);

    for (let i = 1; i < beers.length; i++) {
      if (keptIds.has(beers[i].id)) continue;

      const { error } = await supabase
        .from("beers")
        .update({ is_active: false })
        .eq("id", beers[i].id);

      if (!error) {
        if (deactivated < 20) {
          console.log(`   DEDUP: "${beers[i].name}" [${beers[i].brewery}] (kept: ${keep.name})`);
        }
        deactivated++;
      }
    }
  }
  console.log(`   ${deactivated} doublons désactivés\n`);

  // ─── STEP 4: Handle "Bière" style — try to auto-detect real style ───
  console.log("🔍 STEP 4: Reclassifying 'Bière' generics...");
  const biereBeers = all.filter(b => b.style === "Bière" && b.is_active !== false);
  let reclassified = 0;

  for (const beer of biereBeers) {
    const n = (beer.name + " " + (beer.brewery || "")).toLowerCase();
    let newStyle = null;

    if (/\bipa\b|india pale/.test(n)) newStyle = "IPA";
    else if (/\bblanche\b|\bwit\b|\bwheat\b|\bweizen\b|\bwei[sß]\b/.test(n)) newStyle = "Blanche";
    else if (/\bstout\b|\bporter\b/.test(n)) newStyle = "Stout / Porter";
    else if (/\btriple\b|\btripel\b/.test(n)) newStyle = "Triple";
    else if (/\bambr[ée]e?\b|\bamber\b|\brouge\b|\bred\b/.test(n)) newStyle = "Ambrée";
    else if (/\bblonde\b|\bgold\b|\bdorée\b/.test(n)) newStyle = "Blonde / Lager";
    else if (/\bpils\b|\bpilsner\b/.test(n)) newStyle = "Pilsner";
    else if (/\babbaye\b|\babbey\b|\btrappist\b/.test(n)) newStyle = "Abbaye";
    else if (/\bsaison\b|\bfarmhouse\b/.test(n)) newStyle = "Saison / Spéciale";
    else if (/\bfruit\b|\bframboise\b|\bcerise\b|\bpeach\b|\bcitron\b/.test(n)) newStyle = "Saison / Spéciale";
    else if (/\bsour\b|\blambic\b|\bgueuze\b/.test(n)) newStyle = "Saison / Spéciale";
    else if (/\bpale\s*ale\b/.test(n)) newStyle = "Pale Ale";
    else if (/\bstrong\b|\bforte\b|\bextra\b/.test(n)) newStyle = "Strong Ale";

    if (newStyle) {
      const { error } = await supabase
        .from("beers")
        .update({ style: newStyle })
        .eq("id", beer.id);
      if (!error) {
        if (reclassified < 15) {
          console.log(`   "${beer.name}" [${beer.brewery}]: Bière → ${newStyle}`);
        }
        reclassified++;
      }
    }
  }
  console.log(`   ${reclassified} bières reclassifiées depuis "Bière"\n`);

  // ─── Final summary ───
  console.log("═══════════════════════════════════════");
  console.log("📊 RÉSUMÉ FINAL");
  console.log(`   Styles remappés: ${styleUpdates}`);
  console.log(`   Noms nettoyés: ${nameUpdates}`);
  console.log(`   Doublons désactivés: ${deactivated}`);
  console.log(`   Bières reclassifiées: ${reclassified}`);

  // Final style count
  let finalAll = [];
  page = 0;
  while (true) {
    const { data } = await supabase
      .from("beers")
      .select("style")
      .eq("is_active", true)
      .range(page * 1000, (page + 1) * 1000 - 1);
    finalAll = finalAll.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  const finalStyles = {};
  finalAll.forEach(b => { finalStyles[b.style] = (finalStyles[b.style] || 0) + 1; });
  const sortedFinal = Object.entries(finalStyles).sort((a,b) => b[1] - a[1]);
  console.log(`\n   Distribution finale (${finalAll.length} bières, ${sortedFinal.length} styles):`);
  sortedFinal.forEach(([s, c]) => console.log(`     ${String(c).padStart(5)}  ${s}`));
}

main().catch(console.error);
