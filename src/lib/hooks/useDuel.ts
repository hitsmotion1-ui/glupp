"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

  // 🛡️ ZUSTAND : On mémorise le duel globalement pour une fluidité parfaite (0 clignotement)
  const duel = useAppStore((s) => s.duel);
  const setDuel = useAppStore((s) => s.setDuel);
  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

  // Mémoire fantôme pour s'assurer qu'on ne retombe pas sur le même duel en cliquant sur "Passer"
  const displayedPairRef = useRef<string | null>(null);

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
        const beers = (data as any[]).map((ub) => ub.beers).flat().filter(Boolean);
        all = all.concat(beers);
        if (data.length < 1000) break;
        page++;
      }
      return all;
    },
    staleTime: 5 * 60 * 1000, // En cache pendant 5 minutes !
  });

  // 2. Récupération de l'historique
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

  const playedPairs = useMemo(() => {
    const set = new Set<string>();
    pastDuels.forEach((d) => {
      const key = [d.beer_a_id, d.beer_b_id].sort().join("-");
      set.add(key);
    });
    return set;
  }, [pastDuels]);

  // 🧠 L'ALGORITHME ANTI-DOUBLON STRICT
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
      if (playedPairs.has(key)) return false;
      if (key === displayedPairRef.current && allPossiblePairs.length > 1) return false;
      return true;
    });

    let selectedPair: [Beer, Beer];

    if (unplayedPairs.length > 0) {
      const randomIndex = Math.floor(Math.random() * unplayedPairs.length);
      selectedPair = unplayedPairs[randomIndex];
    } else {
      const recyclables = allPossiblePairs.filter(([a, b]) => {
        const key = [a.id, b.id].sort().join("-");
        return key !== displayedPairRef.current;
      });
      const safePool = recyclables.length > 0 ? recyclables : allPossiblePairs;
      selectedPair = safePool[Math.floor(Math.random() * safePool.length)];
    }

    const finalPair = Math.random() > 0.5 ? selectedPair : [selectedPair[1], selectedPair[0]];
    
    displayedPairRef.current = [finalPair[0].id, finalPair[1].id].sort().join("-");

    setDuel({
      beerA: finalPair[0],
      beerB: finalPair[1],
      winnerId: null,
      prevEloA: finalPair[0].elo,
      prevEloB: finalPair[1].elo,
    });
    setDuelResult(null);
  }, [tastedBeers, playedPairs, setDuel]);

  useEffect(() => {
    // On génère un duel SEULEMENT si on n'en a pas déjà un en mémoire
    if (tastedBeers.length >= 2 && !duel.beerA && !loadingPastDuels) {
      generatePair();
    }
  }, [tastedBeers.length, duel.beerA, loadingPastDuels, generatePair]);

  const skipDuel = useCallback(() => {
    generatePair();
  }, [generatePair]);

  const voteMutation = useMutation({
    mutationFn: async (selectedWinnerId: string) => {
      if (!duel.beerA || !duel.beerB) throw new Error("Pas de duel");
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
      queryClient.invalidateQueries({ queryKey: ["past_duels_history"] });

      setTimeout(() => {
        generatePair();
        setSubmitting(false);
      }, 1200);
    },
    onError: () => setSubmitting(false),
  });

  const submitVote = async (selectedWinnerId: string) => {
    setSubmitting(true);
    voteMutation.mutate(selectedWinnerId);
  };

  const eloDeltas = duelResult && duel.beerA && duel.beerB
      ? { a: duelResult.beer_a_elo - duel.prevEloA, b: duelResult.beer_b_elo - duel.prevEloB }
      : null;

  // 🚀 LE CORRECTIF EST ICI :
  // On ne montre l'écran de chargement (le squelette) QUE si on n'a VRAIMENT aucun duel en mémoire.
  const isLoading = (loadingBeers || loadingPastDuels) && !duel.beerA;

  return {
    beerA: duel.beerA,
    beerB: duel.beerB,
    loading: isLoading,
    submitting,
    duelResult,
    winnerId: duel.winnerId,
    eloDeltas,
    canDuel: tastedBeers.length >= 2,
    duelCount: duelSessionCount,
    tastedCount: tastedBeers.length,
    generatePair,
    submitVote,
    skipDuel,
  };
}