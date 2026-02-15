"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Beer } from "@/types";

interface DuelResult {
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const canDuel = tastedBeers.length >= 2;

  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    const shuffled = [...tastedBeers].sort(() => Math.random() - 0.5);
    setBeerA(shuffled[0]);
    setBeerB(shuffled[1]);
    setDuelResult(null);
  }, [tastedBeers]);

  // Auto-generate pair when tasted beers are loaded
  useEffect(() => {
    if (tastedBeers.length >= 2 && !beerA && !beerB) {
      generatePair();
    }
  }, [tastedBeers, generatePair, beerA, beerB]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (winnerId: string) => {
      if (!beerA || !beerB) throw new Error("Pas de duel en cours");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non connecte");

      const { data, error } = await supabase.rpc("process_duel", {
        p_user_id: user.id,
        p_beer_a_id: beerA.id,
        p_beer_b_id: beerB.id,
        p_winner_id: winnerId,
      });

      if (error) throw new Error(error.message);
      return data as DuelResult;
    },
    onSuccess: (result) => {
      setDuelResult(result);
      showXPToast(result.xp_gained, "Duel");

      // Invalidate ranking since ELOs changed
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });

      // Generate next pair after animation
      setTimeout(() => {
        generatePair();
        setSubmitting(false);
      }, 800);
    },
    onError: (err) => {
      console.error("Duel error:", err.message);
      setSubmitting(false);
    },
  });

  const submitVote = async (winnerId: string) => {
    setSubmitting(true);
    voteMutation.mutate(winnerId);
  };

  return {
    beerA,
    beerB,
    loading,
    submitting,
    duelResult,
    canDuel,
    generatePair,
    submitVote,
    refreshTasted: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.duel.tastedBeers }),
  };
}
