"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Search, ArchiveX } from "lucide-react";

export function MissingBarcodesList() {
  const [missing, setMissing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('missing_barcodes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setMissing(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="text-[#EF4444]" size={20} />
        <h2 className="text-xl font-semibold text-[#F7F3EE]">Scans Orphelins (Codes non trouvés)</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse bg-[#3A3530]/40 rounded-lg" />
          <div className="h-10 w-full animate-pulse bg-[#3A3530]/40 rounded-lg" />
        </div>
      ) : missing.length === 0 ? (
        <div className="text-center py-6">
          <ArchiveX className="w-8 h-8 text-[#6B6050] mx-auto mb-2" />
          <p className="text-sm text-[#8C8273]">Aucun code orphelin pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {missing.map((m) => (
            <div key={m.id} className="flex justify-between items-center text-sm p-3 bg-[#14120F] border border-[#3A3530] rounded-lg">
              <span className="font-mono font-bold text-[#F0C460]">{m.barcode}</span>
              <span className="text-xs text-[#6B6050]">
                {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}