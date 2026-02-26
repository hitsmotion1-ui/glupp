/**
 * ═══════════════════════════════════════════════════════════════
 * GLUPP — Import bières depuis Open Food Facts
 * 
 * Usage :
 *   1. npm install @supabase/supabase-js node-fetch
 *   2. Configurer les variables SUPABASE_URL et SUPABASE_KEY ci-dessous
 *   3. node import-openfoodfacts.mjs
 * 
 * Ce script :
 *   - Requête l'API Open Food Facts (catégorie bières)
 *   - Filtre les produits avec un nom et une marque
 *   - Mappe les champs vers le schéma Glupp
 *   - Insère dans Supabase (skip les doublons via barcode)
 *   - Assigne automatiquement la rareté et le profil gustatif
 * ═══════════════════════════════════════════════════════════════
 */

// ─── CONFIGURATION ───
const SUPABASE_URL = "https://yuymwggxnaaoxlshwwyn.supabase.co";        // ← Remplace
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM";          // ← Remplace (service_role key)
const MAX_PAGES = 50;          // Nombre de pages à importer (100 produits/page)
const PRODUCTS_PER_PAGE = 100;
const DRY_RUN = false;        // true = affiche sans insérer dans Supabase

// ─── IMPORTS ───
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── MAPPING PAYS ───
const COUNTRY_MAP = {
  "en:france": { code: "FR", flag: "🇫🇷" },
  "en:belgium": { code: "BE", flag: "🇧🇪" },
  "en:germany": { code: "DE", flag: "🇩🇪" },
  "en:united-kingdom": { code: "GB", flag: "🇬🇧" },
  "en:united-states": { code: "US", flag: "🇺🇸" },
  "en:netherlands": { code: "NL", flag: "🇳🇱" },
  "en:ireland": { code: "IE", flag: "🇮🇪" },
  "en:switzerland": { code: "CH", flag: "🇨🇭" },
  "en:spain": { code: "ES", flag: "🇪🇸" },
  "en:italy": { code: "IT", flag: "🇮🇹" },
  "en:czech-republic": { code: "CZ", flag: "🇨🇿" },
  "en:austria": { code: "AT", flag: "🇦🇹" },
  "en:denmark": { code: "DK", flag: "🇩🇰" },
  "en:norway": { code: "NO", flag: "🇳🇴" },
  "en:sweden": { code: "SE", flag: "🇸🇪" },
  "en:poland": { code: "PL", flag: "🇵🇱" },
  "en:portugal": { code: "PT", flag: "🇵🇹" },
  "en:japan": { code: "JP", flag: "🇯🇵" },
  "en:mexico": { code: "MX", flag: "🇲🇽" },
  "en:canada": { code: "CA", flag: "🇨🇦" },
  "en:australia": { code: "AU", flag: "🇦🇺" },
  "en:scotland": { code: "GB", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  "en:brazil": { code: "BR", flag: "🇧🇷" },
  "en:china": { code: "CN", flag: "🇨🇳" },
  "en:india": { code: "IN", flag: "🇮🇳" },
  "en:luxembourg": { code: "LU", flag: "🇱🇺" },
};

// ─── MAPPING STYLE (catégories OFF → style Glupp) ───
const STYLE_MAP = [
  // Ordre important : du plus spécifique au plus générique
  { match: ["ipa", "india-pale"], style: "IPA" },
  { match: ["double-ipa", "imperial-ipa"], style: "Double IPA" },
  { match: ["neipa", "new-england"], style: "New England IPA" },
  { match: ["stout"], style: "Stout" },
  { match: ["porter"], style: "Porter" },
  { match: ["pilsner", "pils"], style: "Pilsner" },
  { match: ["lager", "lagers"], style: "Lager" },
  { match: ["wheat", "weizen", "weiss", "wit", "blanche"], style: "Wheat Beer" },
  { match: ["tripel", "triple"], style: "Tripel" },
  { match: ["dubbel", "double"], style: "Dubbel" },
  { match: ["quadrupel", "quad"], style: "Quadrupel" },
  { match: ["saison", "farmhouse"], style: "Saison" },
  { match: ["sour", "lambic", "gueuze", "gose"], style: "Sour" },
  { match: ["amber", "ambree", "ambrée"], style: "Amber Ale" },
  { match: ["pale-ale", "pale ale"], style: "Pale Ale" },
  { match: ["blonde", "blond"], style: "Blonde Ale" },
  { match: ["brown", "brune"], style: "Brown Ale" },
  { match: ["red", "rouge"], style: "Red Ale" },
  { match: ["scotch", "scottish"], style: "Scotch Ale" },
  { match: ["barley-wine", "barleywine"], style: "Barleywine" },
  { match: ["bock", "doppelbock", "maibock"], style: "Bock" },
  { match: ["trappist", "trappiste"], style: "Trappist" },
  { match: ["abbey", "abbaye"], style: "Abbey Ale" },
  { match: ["fruit", "fruits"], style: "Fruit Beer" },
  { match: ["smoked", "rauch", "fumee", "fumée"], style: "Smoked Beer" },
  { match: ["strong", "forte"], style: "Strong Ale" },
  { match: ["session"], style: "Session Beer" },
  { match: ["helles"], style: "Helles" },
  { match: ["kolsch", "kölsch"], style: "Kölsch" },
  { match: ["altbier", "alt"], style: "Altbier" },
  { match: ["bitter", "esb"], style: "Bitter" },
];

// ─── PROFIL GUSTATIF PAR STYLE ───
const TASTE_DEFAULTS = {
  "IPA":           { bitter: 4, sweet: 1, fruity: 3, body: 3 },
  "Double IPA":    { bitter: 5, sweet: 1, fruity: 4, body: 3 },
  "New England IPA": { bitter: 2, sweet: 1, fruity: 5, body: 3 },
  "Stout":         { bitter: 4, sweet: 3, fruity: 1, body: 5 },
  "Porter":        { bitter: 3, sweet: 3, fruity: 1, body: 4 },
  "Pilsner":       { bitter: 3, sweet: 1, fruity: 1, body: 2 },
  "Lager":         { bitter: 2, sweet: 2, fruity: 1, body: 2 },
  "Wheat Beer":    { bitter: 1, sweet: 3, fruity: 4, body: 2 },
  "Tripel":        { bitter: 2, sweet: 3, fruity: 3, body: 4 },
  "Dubbel":        { bitter: 2, sweet: 4, fruity: 3, body: 4 },
  "Quadrupel":     { bitter: 2, sweet: 5, fruity: 3, body: 5 },
  "Saison":        { bitter: 3, sweet: 2, fruity: 3, body: 2 },
  "Sour":          { bitter: 2, sweet: 2, fruity: 4, body: 2 },
  "Amber Ale":     { bitter: 3, sweet: 3, fruity: 2, body: 3 },
  "Pale Ale":      { bitter: 3, sweet: 1, fruity: 2, body: 2 },
  "Blonde Ale":    { bitter: 2, sweet: 2, fruity: 2, body: 2 },
  "Brown Ale":     { bitter: 3, sweet: 3, fruity: 2, body: 4 },
  "Red Ale":       { bitter: 3, sweet: 3, fruity: 2, body: 3 },
  "Scotch Ale":    { bitter: 2, sweet: 4, fruity: 2, body: 5 },
  "Barleywine":    { bitter: 3, sweet: 4, fruity: 3, body: 5 },
  "Bock":          { bitter: 2, sweet: 4, fruity: 1, body: 5 },
  "Trappist":      { bitter: 2, sweet: 4, fruity: 3, body: 5 },
  "Abbey Ale":     { bitter: 2, sweet: 3, fruity: 2, body: 4 },
  "Fruit Beer":    { bitter: 1, sweet: 4, fruity: 5, body: 2 },
  "Smoked Beer":   { bitter: 3, sweet: 1, fruity: 1, body: 4 },
  "Strong Ale":    { bitter: 3, sweet: 3, fruity: 2, body: 4 },
  "Session Beer":  { bitter: 2, sweet: 1, fruity: 2, body: 1 },
  "Helles":        { bitter: 2, sweet: 2, fruity: 1, body: 2 },
  "Kölsch":        { bitter: 2, sweet: 1, fruity: 2, body: 1 },
  "Altbier":       { bitter: 3, sweet: 2, fruity: 1, body: 3 },
  "Bitter":        { bitter: 4, sweet: 2, fruity: 2, body: 3 },
};

const DEFAULT_TASTE = { bitter: 3, sweet: 3, fruity: 2, body: 3 };

// Barcodes déjà en base (chargés au démarrage)
let existingBarcodes = new Set();

// ─── COULEURS PAR STYLE ───
const COLOR_MAP = {
  "IPA": "#7BAD5E", "Double IPA": "#5B8C3E", "New England IPA": "#F0C460",
  "Stout": "#1A1A1A", "Porter": "#2D1A0E",
  "Pilsner": "#F5D76E", "Lager": "#F5D76E", "Helles": "#F5D76E",
  "Wheat Beer": "#F0E8D0", "Kölsch": "#F0E8D0",
  "Tripel": "#E8C838", "Dubbel": "#8E3B2F", "Quadrupel": "#5C2D1A",
  "Saison": "#C4923A", "Sour": "#E05252",
  "Amber Ale": "#B8712D", "Red Ale": "#B8712D",
  "Pale Ale": "#D4952B", "Blonde Ale": "#F5A623",
  "Brown Ale": "#6B4226", "Scotch Ale": "#5C2D1A",
  "Barleywine": "#8E3B2F", "Bock": "#5C2D1A",
  "Trappist": "#8E3B2F", "Abbey Ale": "#B8712D",
  "Fruit Beer": "#C45B8A", "Smoked Beer": "#5C2D1A",
  "Strong Ale": "#D4952B", "Bitter": "#B8712D",
};

// ═══════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════

/**
 * Détecte le style de bière à partir des catégories OFF
 */
function detectStyle(categories) {
  if (!categories || !Array.isArray(categories)) return "Bière";
  const joined = categories.join(" ").toLowerCase();
  for (const { match, style } of STYLE_MAP) {
    if (match.some(m => joined.includes(m))) return style;
  }
  return "Bière";
}

/**
 * Détecte le pays principal à partir des tags OFF
 */
function detectCountry(countriesTags, manufacturingPlaces) {
  // Priorité : lieu de fabrication, puis pays de vente
  if (manufacturingPlaces) {
    const mfg = manufacturingPlaces.toLowerCase();
    for (const [tag, data] of Object.entries(COUNTRY_MAP)) {
      const name = tag.replace("en:", "").replace(/-/g, " ");
      if (mfg.includes(name)) return data;
    }
  }
  
  if (countriesTags && Array.isArray(countriesTags)) {
    for (const tag of countriesTags) {
      if (COUNTRY_MAP[tag]) return COUNTRY_MAP[tag];
    }
  }
  
  return { code: "XX", flag: "🍺" };
}

/**
 * Extrait la région depuis manufacturing_places
 */
function extractRegion(manufacturingPlaces) {
  if (!manufacturingPlaces) return null;
  // Format typique : "Brasserie d'Achouffe, Achouffe, 6666, Belgique"
  const parts = manufacturingPlaces.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    // Retourne la ville/lieu (2e élément généralement)
    return parts[1] || parts[0];
  }
  return parts[0] || null;
}

/**
 * Assigne la rareté basée sur le nombre de magasins, pays et scans
 * Distribution cible : ~35% common, ~40% rare, ~20% epic, ~5% legendary
 */
function assignRarity(product) {
  const stores = product.stores_tags?.length || 0;
  const countries = product.countries_tags?.length || 0;
  const scans = product.unique_scans_n || 0;

  // Score de disponibilité (plus c'est dispo = plus c'est commun)
  const availScore = stores * 2 + countries * 1.5 + (scans > 100 ? 3 : scans > 20 ? 2 : scans > 5 ? 1 : 0);

  if (availScore >= 8) return "common";      // Très distribuée → commune
  if (availScore >= 4) return "rare";        // Moyennement distribuée → rare
  if (availScore >= 1) return "epic";        // Peu distribuée → épique

  // Aucune donnée de distribution → distribution aléatoire pondérée
  // pour éviter que tout tombe en "epic"
  const rand = Math.random();
  if (rand < 0.30) return "common";
  if (rand < 0.70) return "rare";
  if (rand < 0.95) return "epic";
  return "legendary";
}

/**
 * Nettoie le nom du produit
 */
function cleanName(product) {
  let name = product.product_name || product.product_name_fr || "";
  // Enlever la marque du nom si elle est au début
  const brand = product.brands || "";
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    name = name.substring(brand.length).trim();
    if (name.startsWith("-") || name.startsWith("–")) {
      name = name.substring(1).trim();
    }
  }
  // Si le nom est vide après nettoyage, utiliser le nom complet
  if (!name) name = product.product_name || product.product_name_fr || "";
  return name.trim();
}

/**
 * Nettoie le nom de la brasserie
 */
function cleanBrewery(product) {
  let brand = product.brands || "";
  // Prendre la première marque si plusieurs (séparées par virgule)
  if (brand.includes(",")) {
    brand = brand.split(",")[0].trim();
  }
  return brand || "Brasserie inconnue";
}

/**
 * Transforme un produit OFF en entrée Glupp
 */
function transformProduct(product) {
  const style = detectStyle(product.categories_tags);
  const country = detectCountry(product.countries_tags, product.manufacturing_places);
  const taste = TASTE_DEFAULTS[style] || DEFAULT_TASTE;
  const rarity = assignRarity(product);
  const name = cleanName(product);
  const brewery = cleanBrewery(product);
  
  // Skip si pas de nom ou pas de marque
  if (!name || !brewery || brewery === "Brasserie inconnue") return null;
  // Skip si le nom est trop court ou générique
  if (name.length < 2) return null;
  
  return {
    name,
    brewery,
    country: country.flag,
    country_code: country.code,
    style,
    abv: product.nutriments?.alcohol_value || product.alcohol_value || null,
    ibu: null, // OFF n'a pas les IBU
    elo: 1500,
    total_votes: 0,
    color: COLOR_MAP[style] || "#E08840",
    taste_bitter: taste.bitter,
    taste_sweet: taste.sweet,
    taste_fruity: taste.fruity,
    taste_body: taste.body,
    rarity,
    description: product.quantity || null,
    image_url: product.image_front_url || product.image_front_small_url || null,
    barcode: product.code || null,
    fun_fact: null,
    fun_fact_icon: "💡",
    region: extractRegion(product.manufacturing_places),
    is_active: true,
  };
}

/**
 * Fetch une page de bières depuis l'API OFF
 */
async function fetchPage(page) {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("action", "process");
  url.searchParams.set("tagtype_0", "categories");
  url.searchParams.set("tag_contains_0", "contains");
  url.searchParams.set("tag_0", "beers");
  url.searchParams.set("sort_by", "unique_scans_n"); // Les plus scannées d'abord
  url.searchParams.set("page_size", String(PRODUCTS_PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("json", "1");
  url.searchParams.set("fields", [
    "code",
    "product_name",
    "product_name_fr",
    "brands",
    "categories_tags",
    "countries_tags",
    "manufacturing_places",
    "stores_tags",
    "alcohol_value",
    "nutriments",
    "image_front_url",
    "image_front_small_url",
    "quantity",
    "link",
    "completeness",
    "unique_scans_n",
  ].join(","));
  
  console.log(`  📡 Fetching page ${page}...`);
  
  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Glupp-Import/1.0 (contact@glupp.app)",
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.products || [];
}

/**
 * Insert un batch de bières dans Supabase (insert classique, doublons filtrés en amont)
 */
async function insertBatch(beers) {
  if (DRY_RUN) {
    console.log(`  🧪 DRY RUN: ${beers.length} bières à insérer`);
    beers.slice(0, 3).forEach(b => console.log(`     → ${b.name} (${b.brewery}) ${b.country} [${b.style}]`));
    return { inserted: beers.length, errors: 0, skipped: 0 };
  }

  // Filtrer les bières dont le barcode existe déjà en base
  const newBeers = beers.filter(b => {
    if (b.barcode && existingBarcodes.has(b.barcode)) return false;
    return true;
  });

  const skipped = beers.length - newBeers.length;
  if (skipped > 0) {
    console.log(`  ⏭️  ${skipped} bières déjà en base (barcode existant)`);
  }

  if (newBeers.length === 0) {
    return { inserted: 0, errors: 0, skipped };
  }

  // Insert par batch de 50
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < newBeers.length; i += 50) {
    const batch = newBeers.slice(i, i + 50);
    const { error } = await supabase
      .from("beers")
      .insert(batch);

    if (error) {
      console.error(`  ❌ Erreur batch ${i}-${i+50}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      // Ajouter les barcodes insérés au set pour éviter les doublons intra-import
      batch.forEach(b => { if (b.barcode) existingBarcodes.add(b.barcode); });
    }

    // Petit délai entre les batchs pour ne pas surcharger
    if (i + 50 < newBeers.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { inserted, errors, skipped };
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("🍺 GLUPP — Import Open Food Facts");
  console.log("═══════════════════════════════════════════\n");

  if (DRY_RUN) {
    console.log("🧪 MODE DRY RUN — Aucune donnée ne sera insérée\n");
  }

  // ─── Charger les barcodes existants pour éviter les doublons ───
  if (!DRY_RUN) {
    console.log("🔍 Chargement des barcodes existants...");
    const { data: existing, error: existErr } = await supabase
      .from("beers")
      .select("barcode")
      .not("barcode", "is", null);

    if (existErr) {
      console.error("  ❌ Erreur chargement barcodes:", existErr.message);
    } else {
      existingBarcodes = new Set(existing.map(b => b.barcode));
      console.log(`  ✅ ${existingBarcodes.size} barcodes existants chargés\n`);
    }
  }
  
  const allBeers = [];
  const seenBarcodes = new Set();
  const seenNames = new Set();
  let totalRaw = 0;
  let totalSkipped = 0;
  
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const products = await fetchPage(page);
      totalRaw += products.length;
      
      if (products.length === 0) {
        console.log(`  ✅ Fin des résultats à la page ${page}`);
        break;
      }
      
      for (const product of products) {
        const beer = transformProduct(product);
        
        if (!beer) {
          totalSkipped++;
          continue;
        }
        
        // Dédupliquer par barcode
        if (beer.barcode && seenBarcodes.has(beer.barcode)) {
          totalSkipped++;
          continue;
        }
        
        // Dédupliquer par nom + brasserie
        const key = `${beer.name.toLowerCase()}|${beer.brewery.toLowerCase()}`;
        if (seenNames.has(key)) {
          totalSkipped++;
          continue;
        }
        
        if (beer.barcode) seenBarcodes.add(beer.barcode);
        seenNames.add(key);
        allBeers.push(beer);
      }
      
      console.log(`  📦 Page ${page}: ${products.length} produits → ${allBeers.length} bières valides`);
      
      // Rate limiting : 1 requête/seconde (respect des CGU OFF)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Erreur page ${page}:`, error.message);
      // Continue avec la page suivante
    }
  }
  
  console.log(`\n───────────────────────────────────────────`);
  console.log(`📊 Résumé de l'extraction :`);
  console.log(`   Produits bruts scannés : ${totalRaw}`);
  console.log(`   Produits ignorés :       ${totalSkipped}`);
  console.log(`   Bières valides :         ${allBeers.length}`);
  console.log(`───────────────────────────────────────────\n`);
  
  // Stats par style
  const styleStats = {};
  const countryStats = {};
  const rarityStats = { common: 0, rare: 0, epic: 0, legendary: 0 };
  
  for (const beer of allBeers) {
    styleStats[beer.style] = (styleStats[beer.style] || 0) + 1;
    countryStats[beer.country] = (countryStats[beer.country] || 0) + 1;
    rarityStats[beer.rarity]++;
  }
  
  console.log("🎨 Par style :");
  Object.entries(styleStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([style, count]) => console.log(`   ${style}: ${count}`));
  
  console.log("\n🌍 Par pays :");
  Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count]) => console.log(`   ${country} ${count}`));
  
  console.log("\n✨ Par rareté :");
  Object.entries(rarityStats).forEach(([r, c]) => console.log(`   ${r}: ${c}`));
  
  // Insérer dans Supabase
  console.log(`\n───────────────────────────────────────────`);
  console.log(`📤 Insertion dans Supabase...`);
  
  const { inserted, errors, skipped } = await insertBatch(allBeers);
  
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✅ Import terminé !`);
  console.log(`   Insérées :     ${inserted}`);
  console.log(`   Déjà en base : ${skipped || 0}`);
  console.log(`   Erreurs :      ${errors}`);
  console.log(`═══════════════════════════════════════════`);
}

main().catch(console.error);
