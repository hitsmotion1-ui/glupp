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

  const [beerA, setBeerA] = useState<Beer | null>(null);
  const [beerB, setBeerB] = useState<Beer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [duelCount, setDuelCount] = useState(0);

  // Store previous ELOs to compute delta
  const [prevEloA, setPrevEloA] = useState(0);
  const [prevEloB, setPrevEloB] = useState(0);

  // Fetch tasted beers via React Query
  const {
    data: tastedBeers = [],
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.duel.tastedBeers,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data } = await supabase
        .from("user_beers")
        .select("beer_id, beers(*)")
        .eq("user_id", user.id);

      if (!data) return [];

      return (data as any[])
        .map((ub) => ub.beers)
        .flat()
        .filter((b): b is Beer => b !== null);
    },
    staleTime: 2 * 60 * 1000,
  });

  const canDuel = tastedBeers.length >= 2;

  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    const shuffled = [...tastedBeers].sort(() => Math.random() - 0.5);
    setBeerA(shuffled[0]);
    setBeerB(shuffled[1]);
    setPrevEloA(shuffled[0].elo);
    setPrevEloB(shuffled[1].elo);
    setDuelResult(null);
    setWinnerId(null);
  }, [tastedBeers]);

  // Auto-generate pair when tasted beers are loaded
  useEffect(() => {
    if (tastedBeers.length >= 2 && !beerA && !beerB) {
      generatePair();
    }
  }, [tastedBeers, generatePair, beerA, beerB]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (selectedWinnerId: string) => {
      if (!beerA || !beerB) throw new Error("Pas de duel en cours");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non connecte");

      const { data, error } = await supabase.rpc("process_duel", {
        p_user_id: user.id,
        p_beer_a_id: beerA.id,
        p_beer_b_id: beerB.id,
        p_winner_id: selectedWinnerId,
      });

      if (error) throw new Error(error.message);
      return { result: data as DuelResult, winnerId: selectedWinnerId };
    },
    onSuccess: ({ result, winnerId: wId }) => {
      setDuelResult(result);
      setWinnerId(wId);
      setDuelCount((c) => c + 1);
      showXPToast(result.xp_gained, "Duel");

      // Invalidate ranking since ELOs changed
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });

      // Generate next pair after animation
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

  // Compute ELO deltas
  const eloDeltas = duelResult && beerA && beerB
    ? {
        a: duelResult.beer_a_elo - prevEloA,
        b: duelResult.beer_b_elo - prevEloB,
      }
    : null;

  return {
    beerA,
    beerB,
    loading,
    submitting,
    duelResult,
    winnerId,
    eloDeltas,
    canDuel,
    duelCount,
    tastedCount: tastedBeers.length,
    generatePair,
    submitVote,
    refreshTasted: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.duel.tastedBeers }),
  };
}
