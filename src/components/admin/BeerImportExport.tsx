"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  Download,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function BeerImportExport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── EXPORT ───
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const { data: beers, error: fetchError } = await supabase
        .from("beers")
        .select("name, brewery, country, country_code, style, abv, ibu, rarity, description, region, barcode, fun_fact, fun_fact_icon, taste_bitter, taste_sweet, taste_fruity, taste_body, is_active, status")
        .order("name");

      if (fetchError) throw new Error(fetchError.message);
      if (!beers || beers.length === 0) throw new Error("Aucune biere a exporter");

      // Build CSV (Excel-compatible with BOM for accents)
      const headers = [
        "name", "brewery", "country", "country_code", "style", "abv", "ibu",
        "rarity", "description", "region", "barcode", "fun_fact", "fun_fact_icon",
        "taste_bitter", "taste_sweet", "taste_fruity", "taste_body", "is_active", "status"
      ];

      const csvRows = [headers.join(";")];
      for (const beer of beers) {
        const row = headers.map((h) => {
          const val = (beer as Record<string, unknown>)[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          // Escape semicolons and quotes in values
          if (str.includes(";") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvRows.push(row.join(";"));
      }

      // BOM + CSV content
      const bom = "\uFEFF";
      const csvContent = bom + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `glupp-beers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur export");
    } finally {
      setExporting(false);
    }
  };

  // ─── IMPORT ───
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) throw new Error("Le fichier est vide ou ne contient pas de donnees");

      // Parse header
      const headerLine = lines[0].replace(/^\uFEFF/, ""); // Remove BOM
      const headers = parseCSVLine(headerLine, ";");

      // Validate required columns
      const requiredCols = ["name", "brewery", "country_code"];
      for (const col of requiredCols) {
        if (!headers.includes(col)) {
          throw new Error(`Colonne obligatoire manquante : "${col}". Colonnes trouvees : ${headers.join(", ")}`);
        }
      }

      const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, errors: [] };

      // Process rows
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i], ";");
        if (values.length < 3) continue;

        result.total++;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx]?.trim() || "";
        });

        if (!row.name || !row.brewery) {
          result.errors.push(`Ligne ${i + 1}: nom ou brasserie manquant`);
          result.skipped++;
          continue;
        }

        // Build beer data
        const beerData: Record<string, unknown> = {
          name: row.name,
          brewery: row.brewery,
          country: row.country || "🌍",
          country_code: row.country_code || "XX",
          style: row.style || "Other",
          abv: row.abv ? parseFloat(row.abv) : null,
          ibu: row.ibu ? parseInt(row.ibu) : null,
          rarity: ["common", "rare", "epic", "legendary"].includes(row.rarity) ? row.rarity : "common",
          description: row.description || null,
          region: row.region || null,
          barcode: row.barcode || null,
          fun_fact: row.fun_fact || null,
          fun_fact_icon: row.fun_fact_icon || "💡",
          taste_bitter: row.taste_bitter ? parseInt(row.taste_bitter) : 3,
          taste_sweet: row.taste_sweet ? parseInt(row.taste_sweet) : 3,
          taste_fruity: row.taste_fruity ? parseInt(row.taste_fruity) : 3,
          taste_body: row.taste_body ? parseInt(row.taste_body) : 3,
          status: "approved",
          is_active: row.is_active === "false" ? false : true,
        };

        // Check if beer already exists (by name + brewery)
        const { data: existing } = await supabase
          .from("beers")
          .select("id")
          .eq("name", beerData.name as string)
          .eq("brewery", beerData.brewery as string)
          .limit(1);

        if (existing && existing.length > 0) {
          // Update existing
          const { error: updateErr } = await supabase
            .from("beers")
            .update(beerData)
            .eq("id", existing[0].id);

          if (updateErr) {
            result.errors.push(`Ligne ${i + 1} (${row.name}): ${updateErr.message}`);
            result.skipped++;
          } else {
            result.updated++;
          }
        } else {
          // Create new
          const { error: insertErr } = await supabase
            .from("beers")
            .insert(beerData);

          if (insertErr) {
            result.errors.push(`Ligne ${i + 1} (${row.name}): ${insertErr.message}`);
            result.skipped++;
          } else {
            result.created++;
          }
        }
      }

      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur import");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-[#3A3530] bg-[#1E1B16] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileSpreadsheet size={16} className="text-[#E08840]" />
        <h3 className="text-sm font-bold text-[#F5E6D3]">Import / Export</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3A3530] text-[#F5E6D3] text-sm font-medium hover:bg-[#4A4540] disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Exporter (CSV)
        </button>

        {/* Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E08840]/15 text-[#E08840] text-sm font-medium hover:bg-[#E08840]/25 disabled:opacity-50 transition-colors"
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Importer (CSV)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Import tips */}
      <p className="text-[10px] text-[#6B6050] leading-relaxed">
        Format : CSV avec separateur point-virgule (;). Colonnes obligatoires : name, brewery, country_code.
        Exporte d&apos;abord pour avoir le modele. Les bieres existantes (meme nom + brasserie) seront mises a jour.
      </p>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="space-y-2 px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <p className="text-sm font-medium text-[#F5E6D3]">Import termine</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#A89888]">
            <span>{importResult.total} lignes traitees</span>
            <span className="text-green-400">{importResult.created} creees</span>
            <span className="text-[#E08840]">{importResult.updated} mises a jour</span>
            {importResult.skipped > 0 && (
              <span className="text-red-400">{importResult.skipped} ignorees</span>
            )}
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} className="text-yellow-400" />
                <p className="text-[10px] text-yellow-400 font-semibold">Erreurs :</p>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-400">{err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// CSV Parser (handles quoted fields)
// ═══════════════════════════════════════════

function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === separator) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
