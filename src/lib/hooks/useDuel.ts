"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Beer } from "@/types";

export interface DuelResult {
  beer_a_elo: number;
  beer_b_elo: number;
  xp_gained: number;
}

export function useDuel() {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  // On ne garde que les compteurs de session dans Zustand
  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

  // 💥 LA CLÉ : On utilise un état local au lieu de Zustand !
  // Ainsi, changer d'onglet réinitialise naturellement le duel.
  const [currentDuel, setCurrentDuel] = useState<{
    beerA: Beer | null;
    beerB: Beer | null;
    winnerId: string | null;
    prevEloA: number;
    prevEloB: number;
  }>({
    beerA: null,
    beerB: null,
    winnerId: null,
    prevEloA: 0,
    prevEloB: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);

  // 1. Récupération des bières goûtées
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

        const beers = (data as any[])
          .map((ub) => ub.beers)
          .flat()
          .filter((b): b is Beer => b !== null);

        all = all.concat(beers);
        if (data.length < 1000) break;
        page++;
      }
      return all;
    },
    staleTime: 2 * 60 * 1000,
  });

  // 2. Récupération de l'historique
  const { data: pastDuels = [], isLoading: loadingPastDuels } = useQuery({
    queryKey: ["past_duels_history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("duels")
        .select("beer_a_id, beer_b_id")
        .eq("user_id", user.id);

      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const playedPairs = useMemo(() => {
    const set = new Set<string>();
    pastDuels.forEach((d) => {
      const [a, b] = [d.beer_a_id, d.beer_b_id].sort();
      set.add(`${a}-${b}`);
    });
    return set;
  }, [pastDuels]);

  const loading = loadingBeers || loadingPastDuels;
  const canDuel = tastedBeers.length >= 2;

  // 🧠 L'ALGORITHME ULTIME : Mathématique et Infaillible
  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    // A. On liste TOUTES les combinaisons possibles (ex: 10 bières = 45 duels possibles)
    const allPossiblePairs: [Beer, Beer][] = [];
    for (let i = 0; i < tastedBeers.length; i++) {
      for (let j = i + 1; j < tastedBeers.length; j++) {
        allPossiblePairs.push([tastedBeers[i], tastedBeers[j]]);
      }
    }

    // B. On retire celles que tu as déjà jouées
    const unplayedPairs = allPossiblePairs.filter(([a, b]) => {
      const key = [a.id, b.id].sort().join("-");
      return !playedPairs.has(key);
    });

    let selectedPair: [Beer, Beer];

    if (unplayedPairs.length > 0) {
      // 🎯 Il reste des duels inédits ! On en prend un au hasard
      const randomIndex = Math.floor(Math.random() * unplayedPairs.length);
      selectedPair = unplayedPairs[randomIndex];
    } else {
      // ♻️ Option de secours : tu as joué ABSOLUMENT tous les duels possibles de ta collection.
      // Au lieu de faire planter l'appli, on te repropose un ancien duel au hasard.
      const randomIndex = Math.floor(Math.random() * allPossiblePairs.length);
      selectedPair = allPossiblePairs[randomIndex];
    }

    // On mélange A et B pour que la même bière ne soit pas toujours affichée en haut/à gauche
    const finalPair = Math.random() > 0.5 ? selectedPair : [selectedPair[1], selectedPair[0]];

    setCurrentDuel({
      beerA: finalPair[0],
      beerB: finalPair[1],
      winnerId: null,
      prevEloA: finalPair[0].elo,
      prevEloB: finalPair[1].elo,
    });
    setDuelResult(null);
  }, [tastedBeers, playedPairs]);

  useEffect(() => {
    // On génère un duel uniquement si on n'en a pas et que tout est chargé
    if (tastedBeers.length >= 2 && !currentDuel.beerA && !loadingPastDuels) {
      generatePair();
    }
  }, [tastedBeers, currentDuel.beerA, loadingPastDuels, generatePair]);

  const skipDuel = useCallback(() => {
    generatePair();
  }, [generatePair]);

  const voteMutation = useMutation({
    mutationFn: async (selectedWinnerId: string) => {
      if (!currentDuel.beerA || !currentDuel.beerB) throw new Error("Pas de duel en cours");

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

      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: ["past_duels_history"] });

      setTimeout(() => {
        generatePair();
        setSubmitting(false);
      }, 1200);
    },
    onError: (err) => {
      console.error("Duel error:", err.message);
      setSubmitting(false);
    },
  });

  const submitVote = async (selectedWinnerId: string) => {
    setSubmitting(true);
    voteMutation.mutate(selectedWinnerId);
  };

  const eloDeltas = duelResult && currentDuel.beerA && currentDuel.beerB
      ? { a: duelResult.beer_a_elo - currentDuel.prevEloA, b: duelResult.beer_b_elo - currentDuel.prevEloB }
      : null;

  return {
    beerA: currentDuel.beerA,
    beerB: currentDuel.beerB,
    loading,
    submitting,
    duelResult,
    winnerId: currentDuel.winnerId,
    eloDeltas,
    canDuel,
    duelCount: duelSessionCount,
    tastedCount: tastedBeers.length,
    generatePair,
    submitVote,
    skipDuel,
    refreshTasted: () => queryClient.invalidateQueries({ queryKey: queryKeys.duel.tastedBeers }),
  };
}