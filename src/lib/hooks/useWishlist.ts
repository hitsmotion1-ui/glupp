"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

interface WishlistBeer {
  id: string;
  beer_id: string;
  created_at: string;
  beer: {
    id: string;
    name: string;
    brewery: string;
    country: string;
    style: string;
    rarity: string;
    avg_rating: number | null;
  };
}

export function useWishlist() {
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("beer_wishlist")
        .select("id, beer_id, created_at, beers!inner(id, name, brewery, country, style, rarity, avg_rating)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return [];
      return (data || []).map((item: any) => ({
        id: item.id,
        beer_id: item.beer_id,
        created_at: item.created_at,
        beer: item.beers,
      })) as WishlistBeer[];
    },
    staleTime: 30 * 1000,
  });

  const wishlistBeerIds = new Set(wishlist.map((w) => w.beer_id));

  const addMutation = useMutation({
    mutationFn: async (beerId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");
      const { error } = await supabase.from("beer_wishlist").insert({ user_id: user.id, beer_id: beerId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (beerId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");
      const { error } = await supabase.from("beer_wishlist").delete().eq("user_id", user.id).eq("beer_id", beerId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return {
    wishlist,
    wishlistBeerIds,
    isLoading,
    addToWishlist: addMutation.mutateAsync,
    removeFromWishlist: removeMutation.mutateAsync,
    adding: addMutation.isPending,
    removing: removeMutation.isPending,
  };
}

export type { WishlistBeer };
