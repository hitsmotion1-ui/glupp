"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer } from "@/types";

type SortBy = "elo" | "name" | "votes";

export function useRanking() {
  const [sortBy, setSortBy] = useState<SortBy>("elo");
  const [filterStyle, setFilterStyle] = useState<string | null>(null);

  const {
    data: beers = [],
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.ranking.all,
    queryFn: async () => {
      // Fetch ALL beers with pagination (Supabase default limit = 1000)
      let allBeers: Beer[] = [];
      const PAGE_SIZE = 1000;
      let page = 0;

      while (true) {
        const { data } = await supabase
          .from("beers")
          .select("*")
          .eq("is_active", true)
          .order("elo", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!data || data.length === 0) break;
        allBeers = allBeers.concat(data as Beer[]);
        if (data.length < PAGE_SIZE) break;
        page++;
      }

      return allBeers;
    },
    staleTime: 5 * 60 * 1000,
  });

  const availableStyles = useMemo(() => {
    const styles = new Set(beers.map((b) => b.style));
    return Array.from(styles).sort();
  }, [beers]);

  const rankings = useMemo(() => {
    let filtered = [...beers];

    if (filterStyle) {
      filtered = filtered.filter((b) =>
        b.style.toLowerCase().includes(filterStyle.toLowerCase())
      );
    }

    switch (sortBy) {
      case "elo":
        filtered.sort((a, b) => b.elo - a.elo);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "votes":
        filtered.sort((a, b) => b.total_votes - a.total_votes);
        break;
    }

    return filtered;
  }, [beers, sortBy, filterStyle]);

  return {
    rankings,
    loading,
    sortBy,
    setSortBy,
    filterStyle,
    setFilterStyle,
    availableStyles,
  };
}
