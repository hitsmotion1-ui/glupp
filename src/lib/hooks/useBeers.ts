"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer } from "@/types";

export function useBeers() {
  const {
    data: beers = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.beers.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beers")
        .select("*")
        .eq("is_active", true)
        .order("elo", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Beer[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

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

  return {
    beers,
    loading,
    error: error?.message || null,
    search,
    getBeer,
  };
}
