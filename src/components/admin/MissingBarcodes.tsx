"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function MissingBarcodes() {
  const [missing, setMissing] = useState<any[]>([]);

  useEffect(() => {
    // Va chercher les 10 derniers codes non reconnus dans la base
    supabase.from('missing_barcodes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setMissing(data || []));
  }, []);

  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-5">
      <h3 className="text-lg font-bold text-[#F7F3EE] mb-4">Codes-barres orphelins (Scans ratés)</h3>
      {missing.length === 0 ? (
        <p className="text-sm text-[#8C8273]">Aucun scan raté pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {missing.map((m) => (
            <div key={m.id} className="flex justify-between items-center bg-[#14120F] border border-[#3A3530] p-3 rounded-lg">
              <span className="font-mono text-[#E08840] font-bold">{m.barcode}</span>
              <span className="text-xs text-[#8C8273]">
                {new Date(m.created_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}