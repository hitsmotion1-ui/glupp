"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { getLevel, getNextLevel, getLevelProgress } from "@/lib/utils/xp";
import type { Profile } from "@/types";

export function useProfile() {
  const queryClient = useQueryClient();

  const {
    data: profile = null,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: async (): Promise<Profile | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) return data as Profile;

      // Profil absent (inscription avant schema) -> auto-creation
      if (error?.code === "PGRST116") {
        const username =
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "user";
        const displayName =
          user.user_metadata?.display_name || username;

        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username,
            display_name: displayName,
            avatar_url: user.user_metadata?.avatar_url || null,
          });

        if (!insertError) {
          const { data: retryData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (retryData) return retryData as Profile;
        }
      }

      return null;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const level = profile ? getLevel(profile.xp) : getLevel(0);
  const nextLevel = profile ? getNextLevel(profile.xp) : getNextLevel(0);
  const progress = profile ? getLevelProgress(profile.xp) : 0;

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
  };

  return {
    profile,
    loading,
    level,
    nextLevel,
    progress,
    refetch,
  };
}
