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

  const duel = useAppStore((s) => s.duel);
  const setDuel = useAppStore((s) => s.setDuel);
  const clearDuel = useAppStore((s) => s.clearDuel);
  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

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

  // 2. 🧠 NOUVEAU : Récupération de l'historique des duels joués !
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
    staleTime: 2 * 60 * 1000, // On garde ça en cache 2 minutes
  });

  // On crée un dictionnaire des paires déjà jouées pour une vérification ultra-rapide
  const playedPairs = useMemo(() => {
    const set = new Set<string>();
    pastDuels.forEach((d) => {
      // On trie les ID pour que A vs B et B vs A donnent la même clé
      const [a, b] = [d.beer_a_id, d.beer_b_id].sort();
      set.add(`${a}-${b}`);
    });
    return set;
  }, [pastDuels]);

  const loading = loadingBeers || loadingPastDuels;
  const canDuel = tastedBeers.length >= 2;

  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    let newBeerA: Beer;
    let newBeerB: Beer;
    let attempts = 0;
    let found = false;

    // 🛡️ Boucle de sécurité : on cherche une paire INÉDITE
    do {
      const shuffled = [...tastedBeers].sort(() => Math.random() - 0.5);
      newBeerA = shuffled[0];
      newBeerB = shuffled[1];
      attempts++;

      // Clé unique pour vérifier l'historique
      const [idA, idB] = [newBeerA.id, newBeerB.id].sort();
      const pairKey = `${idA}-${idB}`;

      // Est-ce le duel actuellement à l'écran ?
      const isCurrentDuel = duel.beerA && duel.beerB &&
        ((newBeerA.id === duel.beerA.id && newBeerB.id === duel.beerB.id) ||
         (newBeerA.id === duel.beerB.id && newBeerB.id === duel.beerA.id));

      // Si la paire n'a JAMAIS été jouée, on valide !
      if (!playedPairs.has(pairKey) && !isCurrentDuel) {
        found = true;
      }
      
    } while (!found && attempts < 50); 
    // Au bout de 50 essais (si tu as fait tous les duels possibles de ton beerdex), 
    // il recyclera un ancien duel plutôt que de bloquer l'app.

    setDuel({
      beerA: newBeerA,
      beerB: newBeerB,
      winnerId: null,
      prevEloA: newBeerA.elo,
      prevEloB: newBeerB.elo,
    });
    setDuelResult(null);
  }, [tastedBeers, playedPairs, duel.beerA, duel.beerB, setDuel]);

  useEffect(() => {
    if (tastedBeers.length >= 2 && !duel.beerA && !duel.beerB && !loadingPastDuels) {
      generatePair();
    }
  }, [tastedBeers, generatePair, duel.beerA, duel.beerB, loadingPastDuels]);

  const skipDuel = useCallback(() => {
    generatePair();
  }, [generatePair]);

  // 🧹 NOUVEAU : Fonction pour forcer l'oubli du duel
  const resetDuelState = useCallback(() => {
    clearDuel();
  }, [clearDuel]);

  const voteMutation = useMutation({
    mutationFn: async (selectedWinnerId: string) => {
      if (!duel.beerA || !duel.beerB) throw new Error("Pas de duel en cours");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.rpc("process_duel", {
        p_user_id: user.id,
        p_beer_a_id: duel.beerA.id,
        p_beer_b_id: duel.beerB.id,
        p_winner_id: selectedWinnerId,
      });

      if (error) throw new Error(error.message);
      return { result: data as DuelResult, winnerId: selectedWinnerId };
    },
    onSuccess: ({ result, winnerId: wId }) => {
      setDuelResult(result);
      setDuel({ ...duel, winnerId: wId });
      incrementDuelCount();
      showXPToast(result.xp_gained, "Duel");

      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      // On prévient React Query qu'on a un nouveau duel dans l'historique
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

  const eloDeltas = duelResult && duel.beerA && duel.beerB
      ? { a: duelResult.beer_a_elo - duel.prevEloA, b: duelResult.beer_b_elo - duel.prevEloB }
      : null;

  return {
    beerA: duel.beerA,
    beerB: duel.beerB,
    loading,
    submitting,
    duelResult,
    winnerId: duel.winnerId,
    eloDeltas,
    canDuel,
    duelCount: duelSessionCount,
    tastedCount: tastedBeers.length,
    generatePair,
    submitVote,
    skipDuel,
    resetDuelState, // 👈 Exporté pour nettoyer en quittant la page
    refreshTasted: () => queryClient.invalidateQueries({ queryKey: queryKeys.duel.tastedBeers }),
  };
}