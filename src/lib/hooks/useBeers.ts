"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Beer } from "@/types";

export function useBeers() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBeers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("beers")
      .select("*")
      .eq("is_active", true)
      .order("elo", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setBeers((data as Beer[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBeers();
  }, [fetchBeers]);

  const search = async (query: string): Promise<Beer[]> => {
    const { data } = await supabase.rpc("search_beers", {
      p_query: query,
      p_limit: 20,
    });

    return (data as Beer[]) || [];
  };

  const getBeer = (id: string): Beer | undefined => {
    return beers.find((b) => b.id === id);
  };

  return { beers, loading, error, search, getBeer, refetch: fetchBeers };
}
