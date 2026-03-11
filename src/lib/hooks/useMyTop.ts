"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer } from "@/types";

export interface MyTopBeer extends Beer {
  wins: number;
  duels: number;
  glupps: number;
  score: number;
}

export function useMyTop() {
  const { data, isLoading: loading } = useQuery({
    queryKey: [...queryKeys.duel.tastedBeers, "my-top"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. Récupérer l'historique de consommation (les glupps / re-glupps)
      const { data: userBeers } = await supabase
        .from("user_beers")
        .select("beer_id, glupp_count")
        .eq("user_id", user.id);

      // 2. Récupérer l'historique des duels
      const { data: duels } = await supabase
        .from("duels")
        .select("beer_a_id, beer_b_id, winner_id")
        .eq("user_id", user.id);

      // On combine les deux sources de données
      const beerStats = new Map<string, { wins: number; duels: number; glupps: number }>();

      // Initialisation avec les bières goûtées (la vraie vie)
      if (userBeers) {
        for (const ub of userBeers) {
          beerStats.set(ub.beer_id, {
            wins: 0,
            duels: 0,
            glupps: ub.glupp_count ?? 1, // On récupère le nombre de re-glupps
          });
        }
      }

      // Ajout des statistiques de duels
      if (duels) {
        for (const d of duels) {
          for (const beerId of [d.beer_a_id, d.beer_b_id]) {
            const s = beerStats.get(beerId) || { wins: 0, duels: 0, glupps: 0 };
            s.duels++;
            if (beerId === d.winner_id) s.wins++;
            beerStats.set(beerId, s);
          }
        }
      }

      if (beerStats.size === 0) return [];

      const beerIds = Array.from(beerStats.keys());

      // 3. Récupérer les détails complets des bières
      const { data: beers } = await supabase
        .from("beers")
        .select("*")
        .in("id", beerIds)
        .eq("is_active", true);

      if (!beers) return [];

      // 4. L'ALGORITHME : Calculer le score composite pour chaque bière
      const results: MyTopBeer[] = (beers as Beer[]).map((beer) => {
        const s = beerStats.get(beer.id) || { wins: 0, duels: 0, glupps: 0 };

        // --- A. Taux de victoire lissé (Moyenne bayésienne) ---
        // On simule 2 duels fantômes (1 V, 1 D) pour éviter les aberrations statistiques (1 duel = 100%)
        const winRateScore = ((s.wins + 1) / (s.duels + 2)) * 100;

        // --- B. Bonus de fidélité dans la vraie vie ---
        // Chaque re-glupp a un impact lourd (+10 points par consommation)
        const gluppBonus = s.glupps * 10; 

        // --- C. Bonus d'engagement in-app ---
        // Jouer souvent une bière en duel prouve qu'on l'aime bien
        const duelBonus = s.duels * 2; 

        // Score final
        const score = winRateScore + gluppBonus + duelBonus;

        return { 
          ...beer, 
          wins: s.wins, 
          duels: s.duels, 
          glupps: s.glupps,
          score 
        };
      });

      // 5. Trier par notre nouveau score décroissant
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // En cas d'égalité de score parfait, on départage par le nombre de victoires pures
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