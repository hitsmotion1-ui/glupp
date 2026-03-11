"use client";

import { useState, useCallback, useEffect } from "react";
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

  // Persisted duel state in Zustand (survives tab changes)
  const duel = useAppStore((s) => s.duel);
  const setDuel = useAppStore((s) => s.setDuel);
  const clearDuel = useAppStore((s) => s.clearDuel);
  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

  const [submitting, setSubmitting] = useState(false);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);

  // Fetch tasted beers via React Query
  const { data: tastedBeers = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.duel.tastedBeers,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

  const canDuel = tastedBeers.length >= 2;

  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    let newBeerA: Beer;
    let newBeerB: Beer;
    let attempts = 0;

    // 🧠 Boucle intelligente : on cherche une paire valide
    do {
      const shuffled = [...tastedBeers].sort(() => Math.random() - 0.5);
      newBeerA = shuffled[0];
      newBeerB = shuffled[1];
      attempts++;

      // On s'assure que :
      // 1. A et B sont différentes (géré par le shuffle)
      // 2. Ce n'est pas EXACTEMENT la même paire que le duel actuel
      // On s'arrête si on a trouvé, ou si on a fait 10 tentatives (sécurité)
    } while (
      attempts < 10 &&
      duel.beerA && duel.beerB &&
      ((newBeerA.id === duel.beerA.id && newBeerB.id === duel.beerB.id) ||
       (newBeerA.id === duel.beerB.id && newBeerB.id === duel.beerA.id))
    );

    setDuel({
      beerA: newBeerA,
      beerB: newBeerB,
      winnerId: null,
      prevEloA: newBeerA.elo,
      prevEloB: newBeerB.elo,
    });
    setDuelResult(null);
  }, [tastedBeers, duel.beerA, duel.beerB, setDuel]);

  // Auto-generate pair when tasted beers are loaded AND no duel in progress
  useEffect(() => {
    if (tastedBeers.length >= 2 && !duel.beerA && !duel.beerB) {
      generatePair();
    }
  }, [tastedBeers, generatePair, duel.beerA, duel.beerB]);

  // 🆕 Nouvelle fonction : Passer le duel
  const skipDuel = useCallback(() => {
    generatePair();
  }, [generatePair]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (selectedWinnerId: string) => {
      if (!duel.beerA || !duel.beerB)
        throw new Error("Pas de duel en cours");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non connecte");

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

  const eloDeltas =
    duelResult && duel.beerA && duel.beerB
      ? {
          a: duelResult.beer_a_elo - duel.prevEloA,
          b: duelResult.beer_b_elo - duel.prevEloB,
        }
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
    skipDuel, // 👈 On expose la nouvelle fonction
    refreshTasted: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.duel.tastedBeers,
      }),
  };
}