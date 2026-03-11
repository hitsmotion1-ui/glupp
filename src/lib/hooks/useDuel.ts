"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

export function useDuel() {
  const queryClient = useQueryClient();
  const pathname = usePathname(); // 👈 NOUVEAU: Permet de savoir sur quel onglet on est
  const showXPToast = useAppStore((s) => s.showXPToast);

  const duelSessionCount = useAppStore((s) => s.duelSessionCount);
  const incrementDuelCount = useAppStore((s) => s.incrementDuelCount);

  // État local du duel en cours
  const [currentDuel, setCurrentDuel] = useState<{
    beerA: Beer | null;
    beerB: Beer | null;
    winnerId: string | null;
    prevEloA: number;
    prevEloB: number;
  }>({
    beerA: null, beerB: null, winnerId: null, prevEloA: 0, prevEloB: 0,
  });

  // 👈 NOUVEAU: Une "mémoire fantôme" pour retenir le duel affiché (immunisée aux re-rendus)
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
    staleTime: 2 * 60 * 1000,
  });

  // 2. Récupération de l'historique de la BDD
  const { data: pastDuels = [], isLoading: loadingPastDuels } = useQuery({
    queryKey: ["past_duels_history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("duels").select("beer_a_id, beer_b_id").eq("user_id", user.id);
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
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

    // A. Toutes les combinaisons
    const allPossiblePairs: [Beer, Beer][] = [];
    for (let i = 0; i < tastedBeers.length; i++) {
      for (let j = i + 1; j < tastedBeers.length; j++) {
        allPossiblePairs.push([tastedBeers[i], tastedBeers[j]]);
      }
    }

    // B. Filtrage strict !
    const unplayedPairs = allPossiblePairs.filter(([a, b]) => {
      const key = [a.id, b.id].sort().join("-");
      
      // 1. A-t-on déjà joué ce duel en vrai ?
      if (playedPairs.has(key)) return false;
      
      // 2. Est-ce le duel actuellement à l'écran ? (On l'interdit !)
      if (key === displayedPairRef.current && allPossiblePairs.length > 1) return false;

      return true;
    });

    let selectedPair: [Beer, Beer];

    if (unplayedPairs.length > 0) {
      // 🎯 Duel 100% inédit
      const randomIndex = Math.floor(Math.random() * unplayedPairs.length);
      selectedPair = unplayedPairs[randomIndex];
    } else {
      // ♻️ Plus aucun duel inédit dispo : on recycle un ancien (mais pas celui à l'écran)
      const recyclables = allPossiblePairs.filter(([a, b]) => {
        const key = [a.id, b.id].sort().join("-");
        return key !== displayedPairRef.current;
      });
      
      const safePool = recyclables.length > 0 ? recyclables : allPossiblePairs;
      selectedPair = safePool[Math.floor(Math.random() * safePool.length)];
    }

    // Mélange visuel (A/B ou B/A)
    const finalPair = Math.random() > 0.5 ? selectedPair : [selectedPair[1], selectedPair[0]];
    
    // On met à jour la mémoire fantôme pour le prochain clic
    displayedPairRef.current = [finalPair[0].id, finalPair[1].id].sort().join("-");

    setCurrentDuel({
      beerA: finalPair[0],
      beerB: finalPair[1],
      winnerId: null,
      prevEloA: finalPair[0].elo,
      prevEloB: finalPair[1].elo,
    });
    setDuelResult(null);
  }, [tastedBeers, playedPairs]);

  // 🧊 LE DÉGIVRANT NEXT.JS (S'exécute à chaque fois que tu cliques sur l'onglet "Duels")
  useEffect(() => {
    if (pathname === "/duels" && tastedBeers.length >= 2 && !loadingPastDuels) {
      // Dès que l'utilisateur atterrit sur la page, on génère un nouveau duel de force !
      generatePair();
    }
  }, [pathname, tastedBeers.length, loadingPastDuels, generatePair]);

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

  const eloDeltas = duelResult && currentDuel.beerA && currentDuel.beerB
      ? { a: duelResult.beer_a_elo - currentDuel.prevEloA, b: duelResult.beer_b_elo - currentDuel.prevEloB }
      : null;

  return {
    beerA: currentDuel.beerA,
    beerB: currentDuel.beerB,
    loading: loadingBeers || loadingPastDuels,
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