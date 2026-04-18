"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { beerEmoji, RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";
import { Crown } from "lucide-react";

interface TopBeer {
  id: string;
  name: string;
  brewery: string;
  style: string;
  country: string;
  rarity: string;
  elo: number;
}

export function TopBeerWidget({ userId }: { userId: string }) {
  const { data: topBeer, isLoading } = useQuery({
    queryKey: ["top-beer", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_top_beer", { p_user_id: userId });
      return data as TopBeer | null;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="h-16 bg-glupp-card rounded-glupp animate-pulse" />
    );
  }

  if (!topBeer) return null;

  const rarityConfig = RARITY_CONFIG[topBeer.rarity as Rarity];

  return (
    <div
      className="relative overflow-hidden rounded-glupp-lg border p-4"
      style={{
        borderColor: `${rarityConfig?.color || "#E08840"}30`,
        backgroundColor: `${rarityConfig?.color || "#E08840"}08`,
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2">
        <Crown size={12} className="text-[#F0C460]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F0C460]">
          Ma biere #1
        </span>
      </div>

      {/* Beer info */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{beerEmoji(topBeer.style)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-glupp-cream truncate">{topBeer.name}</p>
          <p className="text-[10px] text-glupp-text-muted truncate">{topBeer.brewery} · {topBeer.country}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black font-mono" style={{ color: rarityConfig?.color || "#E08840" }}>
            {topBeer.elo}
          </p>
          <p className="text-[8px] text-glupp-text-muted uppercase">ELO</p>
        </div>
      </div>

      {/* Decorative glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10"
        style={{ backgroundColor: rarityConfig?.color || "#E08840" }}
      />
    </div>
  );
}
