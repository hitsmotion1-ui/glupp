"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { WeeklyRecapModal, type WeeklyRecapData } from "@/components/social/WeeklyRecapModal";
import { Beer } from "lucide-react";
import { motion } from "framer-motion";

export default function WeeklyRecapPage() {
  const router = useRouter();
  const [data, setData] = useState<WeeklyRecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecap = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: recap, error: rpcError } = await supabase.rpc("get_weekly_recap", {
        p_user_id: user.id,
      });

      if (rpcError) {
        setError(rpcError.message);
      } else if (recap) {
        setData(recap as WeeklyRecapData);
      }
      setLoading(false);
    };

    fetchRecap();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#16130E] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Beer className="w-8 h-8 text-[#E08840]" />
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#16130E] flex items-center justify-center text-center px-6">
        <div>
          <p className="text-[#A89888] text-sm mb-4">{error || "Pas de donnees pour cette semaine."}</p>
          <button onClick={() => router.replace("/duel")} className="text-sm text-[#E08840] hover:underline">
            Retour a l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#16130E]">
      <WeeklyRecapModal
        isOpen={true}
        onClose={() => router.replace("/duel")}
        data={data}
      />
    </div>
  );
}
