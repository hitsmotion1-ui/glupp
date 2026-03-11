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
  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

  // 1. ÉTAT LOCAL STRICT : Si on change d'onglet, le duel est nettoyé ! Plus de cartes grisées bloquées.
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

  // 2. MÉMOIRES ANTI-DOUBLONS INSTANTANÉES : Pour palier aux lenteurs de la base de données
  const displayedPairRef = useRef<string | null>(null);
  const localPlayedPairsRef = useRef<Set<string>>(new Set());
  const generatePairRef = useRef<() => void>();

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

  // Récupération de l'historique
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
    pastDuels.forEach((d) => set.add([d.beer_a_id, d.beer_b_id].sort().join("-")));
    return set;
  }, [pastDuels]);

  // 🧠 L'ALGORITHME INFAILLIBLE
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
      // Triple sécurité :
      if (playedPairs.has(key)) return false; // 1. Déjà joué en base de données
      if (localPlayedPairsRef.current.has(key)) return false; // 2. Vient tout juste d'être joué
      if (key === displayedPairRef.current && allPossiblePairs.length > 1) return false; // 3. Est à l'écran
      return true;
    });

    let selectedPair: [Beer, Beer];

    if (unplayedPairs.length > 0) {
      selectedPair = unplayedPairs[Math.floor(Math.random() * unplayedPairs.length)];
    } else {
      // Recyclage si tout a été joué
      const recyclables = allPossiblePairs.filter(([a, b]) => {
        return [a.id, b.id].sort().join("-") !== displayedPairRef.current;
      });
      const safePool = recyclables.length > 0 ? recyclables : allPossiblePairs;
      selectedPair = safePool[Math.floor(Math.random() * safePool.length)];
    }

    const finalPair = Math.random() > 0.5 ? selectedPair : [selectedPair[1], selectedPair[0]];
    
    displayedPairRef.current = [finalPair[0].id, finalPair[1].id].sort().join("-");

    setCurrentDuel({
      beerA: finalPair[0],
      beerB: finalPair[1],
      winnerId: null,
      prevEloA: finalPair[0].elo,
      prevEloB: finalPair[1].elo,
    });
    setDuelResult(null);
    setSubmitting(false); // On force le déblocage des cartes !
  }, [tastedBeers, playedPairs]);

  // Astuce pour que le setTimeout appelle toujours la dernière version de la fonction
  useEffect(() => {
    generatePairRef.current = generatePair;
  }, [generatePair]);

  // Lancement automatique au chargement de la page
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

      // 🛡️ SÉCURITÉ ABSOLUE : On blackliste immédiatement ce duel localement !
      if (currentDuel.beerA && currentDuel.beerB) {
        const currentKey = [currentDuel.beerA.id, currentDuel.beerB.id].sort().join("-");
        localPlayedPairsRef.current.add(currentKey);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: ["past_duels_history"] });

      setTimeout(() => {
        if (generatePairRef.current) generatePairRef.current();
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