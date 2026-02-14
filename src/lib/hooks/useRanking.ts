"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Beer } from "@/types";

type SortBy = "elo" | "name" | "votes";

export function useRanking() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("elo");
  const [filterStyle, setFilterStyle] = useState<string | null>(null);

  const fetchBeers = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("beers")
      .select("*")
      .eq("is_active", true)
      .order("elo", { ascending: false });

    if (data) setBeers(data as Beer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBeers();
  }, [fetchBeers]);

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
    refetch: fetchBeers,
  };
}
