/**
 * ═══════════════════════════════════════════════════════════════
 * GLUPP — Purge des bières poubelles + nettoyage agressif des noms
 *
 * Deux passes :
 *   1. SUPPRIME les bières avec des noms invalides (0,0%, packs, etc.)
 *   2. NETTOIE les noms qui restent sales
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuymwggxnaaoxlshwwyn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Décide si une bière doit être SUPPRIMÉE (nom totalement inutilisable)
 */
function shouldDelete(name, brewery) {
  const n = name.trim().toLowerCase();

  // Nom vide ou quasi-vide
  if (n.length < 2) return "trop court";

  // Nom qui est juste un pourcentage : "0,0%", "4,3%", "5%"
  if (/^\d+[.,]?\d*\s*%?\s*(?:vol\.?|alc\.?|v)?$/.test(n)) return "juste un %";

  // Nom qui est juste "bière" ou "beer" tout seul
  if (/^(?:bi[eè]re|beer|bier|birra|cerveza|cerveja)s?$/i.test(n)) return "juste 'bière'";

  // Nom qui est juste un format de packaging
  if (/^\d+\s*[x×]\s*\d+\s*(?:cl|ml|l)?\s*$/i.test(n)) return "juste un pack format";

  // Nom qui commence par un code EAN / numérique pur
  if (/^\d{8,}$/.test(n)) return "code barre";

  // Nom = "n/p", "n/a", "na", "--", "..."
  if (/^(?:n\/[ap]|na|--|\.{2,}|xxx|\?\?+|test)$/i.test(n)) return "placeholder";

  // Nom qui contient uniquement des tags HTML ou caractères spéciaux
  if (/^[^a-zA-Z0-9\u00C0-\u024F]+$/.test(n)) return "pas de lettres";

  // Nom = brewery seul (le nom apporte rien)
  if (n === brewery.trim().toLowerCase()) return "nom = brasserie";

  return false;
}

/**
 * Nettoyage agressif des noms
 */
function cleanName(name) {
  let c = name;

  // Préfixes de code produit : "BTE", "BLE", "BOUT", "BTL", "PK", "FUT"
  c = c.replace(/^(?:BTE|BLE|BOUT|BTL|MINI\s+FUT)\s+/i, "");

  // Préfixes volume : "33CL", "50CL", "75CL", "12X25", "6X33"
  c = c.replace(/^\d+\s*(?:CL|ML|L)\s+/i, "");
  c = c.replace(/^\d+\s*[X×]\s*\d+\s*(?:CL|ML|L)?\s*/i, "");

  // Suffixes volume : " 33 CL", " 75 cl", ", 33cl"
  c = c.replace(/[,\s]+\d+\s*(?:CL|ML|L)$/i, "");
  c = c.replace(/[,\s]+(?:pack\s+de\s+)?\d+\s*[x×]\s*\d+\s*(?:cl|ml|l)?/gi, "");

  // Suffixes pourcentage : " 5%V", " 8.4%V", "-4,2%", ", 5%", " 0,0%", " 5.90%"
  c = c.replace(/[\s,\-–]+\d+[.,]\d+\s*%?\s*(?:vol\.?|V|alc\.?)?$/gi, "");
  c = c.replace(/\s+\d+\s*%\s*V?$/gi, "");

  // "BIERE" ou "BIÈRE" au début suivi d'une marque connue — garder la marque
  // Ex: "BIERE BLONDE CHOUFFE" → "Chouffe Blonde"
  c = c.replace(/^BI[EÈ]RE\s+/i, "");

  // Suffixes descripteurs après virgule
  c = c.replace(/,\s*(?:bi[eè]re\s+)?(?:brune|blonde|blanche|ambr[eé]e|rouge|noire|forte|sans\s+alcool|de\s+garde|de\s+table|l[eé]g[eè]re|aromatisée?\s*(?:au|aux|à)?\s*\w*)/gi, "");

  // "PK" seul en fin (code pack)
  c = c.replace(/\s+PK$/i, "");

  // "7SUL" ou autres codes
  c = c.replace(/\s+\d+SUL\s*/i, " ");

  // Doubles espaces
  c = c.replace(/\s{2,}/g, " ");

  // Trailing commas, espaces, tirets
  c = c.replace(/[\s,\-–]+$/, "").trim();
  // Leading commas, espaces
  c = c.replace(/^[\s,\-–]+/, "").trim();

  // Si tout en majuscules et > 3 char, mettre en Title Case
  if (c.length > 3 && c === c.toUpperCase()) {
    c = c.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    // Re-capitaliser les mots courts connus
    c = c.replace(/\b(De|Du|Le|La|Les|Des|Au|Aux|Et|En)\b/g, m => m.toLowerCase());
    c = c.replace(/\bIpa\b/g, "IPA");
  }

  // Première lettre majuscule
  if (c && /^[a-z]/.test(c)) {
    c = c.charAt(0).toUpperCase() + c.slice(1);
  }

  if (!c || c.length < 2) return name;
  return c;
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("🧹 GLUPP — Purge + nettoyage agressif");
  console.log("═══════════════════════════════════════════\n");

  // Charger toutes les bières
  let allBeers = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("beers")
      .select("id, name, brewery")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.error("❌", error.message); break; }
    if (!data || data.length === 0) break;
    allBeers = allBeers.concat(data);
    page++;
  }

  console.log(`📦 ${allBeers.length} bières chargées\n`);

  // ── PASSE 1 : Identifier les bières à supprimer ──
  const toDelete = [];
  const toClean = [];

  for (const beer of allBeers) {
    const reason = shouldDelete(beer.name, beer.brewery);
    if (reason) {
      toDelete.push({ ...beer, reason });
    } else {
      const cleaned = cleanName(beer.name);
      if (cleaned !== beer.name) {
        toClean.push({ id: beer.id, before: beer.name, after: cleaned, brewery: beer.brewery });
      }
    }
  }

  console.log(`🗑️  ${toDelete.length} bières à SUPPRIMER :`);
  toDelete.slice(0, 30).forEach(b => {
    console.log(`   ❌ "${b.name}" [${b.brewery}] — ${b.reason}`);
  });
  if (toDelete.length > 30) console.log(`   ... et ${toDelete.length - 30} autres`);

  console.log(`\n🔄 ${toClean.length} noms à NETTOYER :`);
  toClean.slice(0, 40).forEach(b => {
    console.log(`   "${b.before}" → "${b.after}" [${b.brewery}]`);
  });
  if (toClean.length > 40) console.log(`   ... et ${toClean.length - 40} autres`);

  // ── EXÉCUTER ──
  console.log("\n── Suppression ──");
  let deleted = 0;
  for (const beer of toDelete) {
    const { error } = await supabase.from("beers").delete().eq("id", beer.id);
    if (error) {
      console.error(`   ❌ ${beer.name}: ${error.message}`);
    } else {
      deleted++;
    }
  }
  console.log(`   ✅ ${deleted} bières supprimées`);

  console.log("\n── Nettoyage ──");
  let cleaned = 0;
  for (const update of toClean) {
    const { error } = await supabase.from("beers").update({ name: update.after }).eq("id", update.id);
    if (error) {
      console.error(`   ❌ ${update.before}: ${error.message}`);
    } else {
      cleaned++;
    }
  }
  console.log(`   ✅ ${cleaned} noms nettoyés`);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✅ Terminé ! ${deleted} supprimées, ${cleaned} nettoyées`);
  console.log(`   Bières restantes : ~${allBeers.length - deleted}`);
  console.log(`═══════════════════════════════════════════`);
}

main().catch(console.error);
