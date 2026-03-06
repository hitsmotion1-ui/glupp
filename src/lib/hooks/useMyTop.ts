"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer } from "@/types";

interface MyTopBeer extends Beer {
  wins: number;
  duels: number;
}

export function useMyTop() {
  const { data, isLoading: loading } = useQuery({
    queryKey: [...queryKeys.duel.tastedBeers, "my-top"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all duels for this user
      const { data: duels } = await supabase
        .from("duels")
        .select("beer_a_id, beer_b_id, winner_id")
        .eq("user_id", user.id);

      if (!duels || duels.length === 0) return [];

      // Count wins & duels per beer
      const beerStats = new Map<string, { wins: number; duels: number }>();
      for (const d of duels) {
        for (const beerId of [d.beer_a_id, d.beer_b_id]) {
          const s = beerStats.get(beerId) || { wins: 0, duels: 0 };
          s.duels++;
          if (beerId === d.winner_id) s.wins++;
          beerStats.set(beerId, s);
        }
      }

      // Get beer details for all beer IDs
      const beerIds = Array.from(beerStats.keys());
      const { data: beers } = await supabase
        .from("beers")
        .select("*")
        .in("id", beerIds)
        .eq("is_active", true);

      if (!beers) return [];

      // Merge and sort by win rate then wins
      const results: MyTopBeer[] = (beers as Beer[]).map((beer) => {
        const s = beerStats.get(beer.id) || { wins: 0, duels: 0 };
        return { ...beer, wins: s.wins, duels: s.duels };
      });

      results.sort((a, b) => {
        const rateA = a.duels > 0 ? a.wins / a.duels : 0;
        const rateB = b.duels > 0 ? b.wins / b.duels : 0;
        if (rateB !== rateA) return rateB - rateA;
        return b.wins - a.wins;
      });

      return results;
    },
    staleTime: 2 * 60 * 1000,
  });

  const myTopBeers = useMemo(() => data || [], [data]);
  const topBeer = myTopBeers[0] || null;

  return { myTopBeers, topBeer, loading };
}
