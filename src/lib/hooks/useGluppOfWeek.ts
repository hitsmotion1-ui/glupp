"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { GluppOfWeek, Beer } from "@/types";

interface GOTWData {
  gotw: (GluppOfWeek & { beer: Beer }) | null;
  hasParticipated: boolean;
  daysLeft: number;
}

export function useGluppOfWeek() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.gluppOfWeek.current,
    queryFn: async (): Promise<GOTWData> => {
      const now = new Date().toISOString();

      // Fetch current GOTW
      const { data: gotwData, error } = await supabase
        .from("glupp_of_week")
        .select("*, beer:beers(*)")
        .lte("week_start", now)
        .gte("week_end", now)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !gotwData) {
        return { gotw: null, hasParticipated: false, daysLeft: 0 };
      }

      const gotw = gotwData as GluppOfWeek & { beer: Beer };

      // Check if user has participated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let hasParticipated = false;
      if (user && gotw.beer) {
        const { data: ub } = await supabase
          .from("user_beers")
          .select("id")
          .eq("user_id", user.id)
          .eq("beer_id", gotw.beer_id)
          .maybeSingle();
        hasParticipated = !!ub;
      }

      // Days left
      const endDate = new Date(gotw.week_end);
      const msLeft = endDate.getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

      return { gotw, hasParticipated, daysLeft };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Participate (register glupp for this beer)
  const participateMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !data?.gotw) throw new Error("Non connecté");

      const { error } = await supabase.rpc("register_glupp", {
        p_user_id: user.id,
        p_beer_id: data.gotw.beer_id,
        p_photo_url: null,
        p_geo_lat: null,
        p_geo_lng: null,
        p_bar_name: null,
        p_tagged_users: [],
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gluppOfWeek.current });
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });

  return {
    gotw: data?.gotw ?? null,
    hasParticipated: data?.hasParticipated ?? false,
    daysLeft: data?.daysLeft ?? 0,
    loading,
    participate: participateMutation.mutateAsync,
    participating: participateMutation.isPending,
  };
}
