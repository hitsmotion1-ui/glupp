"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Beer } from "@/types";

export interface DuelResult {
  beer_a_elo: number;
  beer_b_elo: number;
  xp_gained: number;
}

// 🔥 LE SECRET EST ICI : Ces variables vivent EN DEHORS du composant React !
// Elles ne sont JAMAIS effacées, même quand tu changes d'onglet.
const sessionPlayedPairs = new Set<string>();
let lastDisplayedPairKey: string | null = null;

export function useDuel() {
  const queryClient = useQueryClient();
  const pathname = usePathname(); // 👈 Permet de savoir quand on revient sur l'onglet
  const showXPToast = useAppStore((s) => s.showXPToast);
  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

  const [currentDuel, setCurrentDuel] = useState<{
    beerA: Beer | null;
    beerB: Beer | null;
    winnerId: string | null;
    prevEloA: number;
    prevEloB: number;
  }>({
    beerA: null, beerB: null, winnerId: null, prevEloA: 0, prevEloB: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);

  // Récupération des bières goûtées
  const { data: tastedBeers = [], isLoading: loadingBeers } = useQuery({
    queryKey: queryKeys.duel.tastedBeers,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let all: Beer[] = [];
      let page = 0;
      while (true) {
        const { data } = await supabase
          .from("user_beers")
          .select("beer_id, beers(*)")
          .eq("user_id", user.id)
          .range(page * 1000, (page + 1) * 1000 - 1);

        if (!data || data.length === 0) break;
        const beers = (data as any[]).map((ub) => ub.beers).flat().filter(Boolean);
        all = all.concat(beers);
        if (data.length < 1000) break;
        page++;
      }
      return all;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Récupération de l'historique depuis la base de données
  const { data: pastDuels = [], isLoading: loadingPastDuels } = useQuery({
    queryKey: ["past_duels_history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("duels").select("beer_a_id, beer_b_id").eq("user_id", user.id);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const dbPlayedPairs = useMemo(() => {
    const set = new Set<string>();
    pastDuels.forEach((d) => set.add([d.beer_a_id, d.beer_b_id].sort().join("-")));
    return set;
  }, [pastDuels]);

  // 🧠 L'algorithme infaillible combinant base de données + session locale
  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    const allPossiblePairs: [Beer, Beer][] = [];
    for (let i = 0; i < tastedBeers.length; i++) {
      for (let j = i + 1; j < tastedBeers.length; j++) {
        allPossiblePairs.push([tastedBeers[i], tastedBeers[j]]);
      }
    }

    const unplayedPairs = allPossiblePairs.filter(([a, b]) => {
      const key = [a.id, b.id].sort().join("-");
      // 🛡️ REJET STRICT : Si c'est en BDD OU si ça a été joué à l'instant (sessionPlayedPairs)
      if (dbPlayedPairs.has(key) || sessionPlayedPairs.has(key)) return false;
      // Rejet si c'est exactement le duel qui était à l'écran
      if (key === lastDisplayedPairKey && allPossiblePairs.length > 1) return false;
      return true;
    });

    let selectedPair: [Beer, Beer];

    if (unplayedPairs.length > 0) {
      selectedPair = unplayedPairs[Math.floor(Math.random() * unplayedPairs.length)];
    } else {
      const recyclables = allPossiblePairs.filter(([a, b]) => {
        return [a.id, b.id].sort().join("-") !== lastDisplayedPairKey;
      });
      const safePool = recyclables.length > 0 ? recyclables : allPossiblePairs;
      selectedPair = safePool[Math.floor(Math.random() * safePool.length)];
    }

    const finalPair = Math.random() > 0.5 ? selectedPair : [selectedPair[1], selectedPair[0]];
    
    // On met à jour la mémoire hors-composant
    lastDisplayedPairKey = [finalPair[0].id, finalPair[1].id].sort().join("-");

    setCurrentDuel({
      beerA: finalPair[0],
      beerB: finalPair[1],
      winnerId: null,
      prevEloA: finalPair[0].elo,
      prevEloB: finalPair[1].elo,
    });
    setDuelResult(null);
    setSubmitting(false);
  }, [tastedBeers, dbPlayedPairs]);

  // 🧊 ANTI-GIVRE NEXT.JS : S'assure que rien n'est bloqué quand on revient sur l'onglet
  useEffect(() => {
    if (pathname === "/duels") {
      setSubmitting(false); // Débloque les cartes grisées de force
      if (currentDuel.winnerId) {
         generatePair(); // Si on s'est arrêté sur un résultat, on passe au suivant
      }
    }
  }, [pathname, currentDuel.winnerId, generatePair]);

  // Lancement automatique au chargement
  useEffect(() => {
    if (tastedBeers.length >= 2 && !currentDuel.beerA && !loadingPastDuels) {
      generatePair();
    }
  }, [tastedBeers.length, currentDuel.beerA, loadingPastDuels, generatePair]);

  const skipDuel = useCallback(() => {
    generatePair();
  }, [generatePair]);

  const voteMutation = useMutation({
    mutationFn: async (selectedWinnerId: string) => {
      if (!currentDuel.beerA || !currentDuel.beerB) throw new Error("Pas de duel");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.rpc("process_duel", {
        p_user_id: user.id,
        p_beer_a_id: currentDuel.beerA.id,
        p_beer_b_id: currentDuel.beerB.id,
        p_winner_id: selectedWinnerId,
      });

      if (error) throw new Error(error.message);
      return { result: data as DuelResult, winnerId: selectedWinnerId };
    },
    onSuccess: ({ result, winnerId: wId }) => {
      setDuelResult(result);
      setCurrentDuel((prev) => ({ ...prev, winnerId: wId }));
      incrementDuelCount();
      showXPToast(result.xp_gained, "Duel");

      // 🛡️ MÉMORISATION INSTANTANÉE : On l'ajoute à la liste noire globale
      if (currentDuel.beerA && currentDuel.beerB) {
        const currentKey = [currentDuel.beerA.id, currentDuel.beerB.id].sort().join("-");
        sessionPlayedPairs.add(currentKey);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: ["past_duels_history"] });

      setTimeout(() => {
        generatePair();
      }, 1200);
    },
    onError: () => setSubmitting(false),
  });

  const submitVote = async (selectedWinnerId: string) => {
    setSubmitting(true);
    voteMutation.mutate(selectedWinnerId);
  };

  const eloDeltas = duelResult && currentDuel.beerA && currentDuel.beerB
      ? { a: duelResult.beer_a_elo - currentDuel.prevEloA, b: duelResult.beer_b_elo - currentDuel.prevEloB }
      : null;

  const isLoading = (loadingBeers || loadingPastDuels) && !currentDuel.beerA;

  return {
    beerA: currentDuel.beerA,
    beerB: currentDuel.beerB,
    loading: isLoading,
    submitting,
    duelResult,
    winnerId: currentDuel.winnerId,
    eloDeltas,
    canDuel: tastedBeers.length >= 2,
    duelCount: duelSessionCount,
    tastedCount: tastedBeers.length,
    generatePair,
    submitVote,
    skipDuel,
  };
}