"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Beer } from "@/types";

interface DuelResult {
  beer_a_elo: number;
  beer_b_elo: number;
  xp_gained: number;
}

export function useDuel() {
  const [beerA, setBeerA] = useState<Beer | null>(null);
  const [beerB, setBeerB] = useState<Beer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [canDuel, setCanDuel] = useState(false);
  const [tastedBeers, setTastedBeers] = useState<Beer[]>([]);

  const supabase = createClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  const fetchTastedBeers = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_beers")
      .select("beer_id, beers(*)")
      .eq("user_id", user.id);

    if (data) {
      const beers = (data as any[])
        .map((ub) => ub.beers)
        .flat()
        .filter((b): b is Beer => b !== null);
      setTastedBeers(beers);
      setCanDuel(beers.length >= 2);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTastedBeers();
  }, [fetchTastedBeers]);

  const generatePair = useCallback(() => {
    if (tastedBeers.length < 2) return;

    const shuffled = [...tastedBeers].sort(() => Math.random() - 0.5);
    setBeerA(shuffled[0]);
    setBeerB(shuffled[1]);
    setDuelResult(null);
  }, [tastedBeers]);

  useEffect(() => {
    if (tastedBeers.length >= 2) {
      generatePair();
    }
  }, [tastedBeers, generatePair]);

  const submitVote = async (winnerId: string) => {
    if (!beerA || !beerB) return;

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.rpc("process_duel", {
      p_user_id: user.id,
      p_beer_a_id: beerA.id,
      p_beer_b_id: beerB.id,
      p_winner_id: winnerId,
    });

    if (error) {
      console.error("Duel error:", error.message);
      setSubmitting(false);
      return;
    }

    const result = data as DuelResult;
    setDuelResult(result);
    showXPToast(result.xp_gained, "Duel");

    // Generate next pair after animation
    setTimeout(() => {
      generatePair();
      setSubmitting(false);
    }, 800);
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
    refreshTasted: fetchTastedBeers,
  };
}
