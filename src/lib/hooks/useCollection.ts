"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Beer, UserBeer, Rarity } from "@/types";

interface CollectionFilter {
  rarity: Rarity | "all";
  search: string;
}

interface CollectionData {
  allBeers: Beer[];
  collection: UserBeer[];
}

export function useCollection() {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  const [filter, setFilter] = useState<CollectionFilter>({
    rarity: "all",
    search: "",
  });

  const {
    data,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.collection.all,
    queryFn: async (): Promise<CollectionData> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch ALL beers with pagination (Supabase default limit = 1000)
      let allBeers: Beer[] = [];
      const PAGE_SIZE = 1000;
      let page = 0;

      while (true) {
        const { data: beersData } = await supabase
          .from("beers")
          .select("*")
          .eq("is_active", true)
          .order("name")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!beersData || beersData.length === 0) break;
        allBeers = allBeers.concat(beersData as Beer[]);
        if (beersData.length < PAGE_SIZE) break;
        page++;
      }

      // Fetch user's collection (also paginated)
      let collection: UserBeer[] = [];
      if (user) {
        let collPage = 0;
        while (true) {
          const { data: collectionData } = await supabase
            .from("user_beers")
            .select("*, beers(*)")
            .eq("user_id", user.id)
            .range(collPage * PAGE_SIZE, (collPage + 1) * PAGE_SIZE - 1);

          if (!collectionData || collectionData.length === 0) break;
          collection = collection.concat(collectionData as UserBeer[]);
          if (collectionData.length < PAGE_SIZE) break;
          collPage++;
        }
      }

      return { allBeers, collection };
    },
    staleTime: 5 * 60 * 1000,
  });

  const allBeers = data?.allBeers || [];
  const collection = data?.collection || [];

  const tastedIds = useMemo(
    () => new Set(collection.map((ub) => ub.beer_id)),
    [collection]
  );

  const filteredBeers = useMemo(() => {
    let filtered = allBeers;

    if (filter.rarity !== "all") {
      filtered = filtered.filter((b) => b.rarity === filter.rarity);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.brewery.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [allBeers, filter]);

  const stats = useMemo(() => {
    const total = allBeers.length;
    const tasted = tastedIds.size;
    const byRarity = (["common", "rare", "epic", "legendary"] as Rarity[]).reduce(
      (acc, r) => {
        const all = allBeers.filter((b) => b.rarity === r);
        const t = all.filter((b) => tastedIds.has(b.id));
        acc[r] = { total: all.length, tasted: t.length };
        return acc;
      },
      {} as Record<Rarity, { total: number; tasted: number }>
    );

    return {
      total,
      tasted,
      percentage: total > 0 ? Math.round((tasted / total) * 100) : 0,
      byRarity,
    };
  }, [allBeers, tastedIds]);

  // Glupp mutation with cascade invalidation
  const gluppMutation = useMutation({
    mutationFn: async ({
      beerId,
      barName,
    }: {
      beerId: string;
      barName?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non connecte");

      const { data, error } = await supabase.rpc("register_glupp", {
        p_user_id: user.id,
        p_beer_id: beerId,
        p_bar_name: barName || null,
      });

      if (error) throw new Error(error.message);
      return data as { xp_gained: number };
    },
    onSuccess: (result) => {
      showXPToast(result.xp_gained, "Glupp !");
      // Cascade invalidation: all related data
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.duel.tastedBeers });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
    },
  });

  const registerGlupp = async (beerId: string, barName?: string) => {
    await gluppMutation.mutateAsync({ beerId, barName });
  };

  return {
    collection,
    allBeers,
    filteredBeers,
    tastedIds,
    loading,
    stats,
    filter,
    setFilter,
    registerGlupp,
  };
}
