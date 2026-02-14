"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Beer, UserBeer, Rarity } from "@/types";

interface CollectionFilter {
  rarity: Rarity | "all";
  search: string;
}

export function useCollection() {
  const [collection, setCollection] = useState<UserBeer[]>([]);
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CollectionFilter>({
    rarity: "all",
    search: "",
  });

  const supabase = createClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch all beers
    const { data: beersData } = await supabase
      .from("beers")
      .select("*")
      .eq("is_active", true)
      .order("rarity")
      .order("name");

    if (beersData) setAllBeers(beersData as Beer[]);

    // Fetch user's collection
    if (user) {
      const { data: collectionData } = await supabase
        .from("user_beers")
        .select("*, beers(*)")
        .eq("user_id", user.id);

      if (collectionData) setCollection(collectionData as UserBeer[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const registerGlupp = async (beerId: string, barName?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase.rpc("register_glupp", {
      p_user_id: user.id,
      p_beer_id: beerId,
      p_bar_name: barName || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = data as { xp_gained: number };
    showXPToast(result.xp_gained, "Glupp !");

    // Refetch
    await fetchData();
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
    refetch: fetchData,
  };
}
