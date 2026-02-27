"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Trophy, UserTrophy } from "@/types";

export function useTrophies() {
  // All trophy definitions
  const { data: trophies = [], isLoading: loadingTrophies } = useQuery({
    queryKey: queryKeys.trophies.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trophies")
        .select("*")
        .order("xp_reward", { ascending: true });

      if (error) {
        console.error("trophies error:", error.message);
        return [];
      }
      return (data as Trophy[]) || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // User's trophy progress
  const { data: userTrophies = [], isLoading: loadingUserTrophies } = useQuery({
    queryKey: queryKeys.trophies.user("me"),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_trophies")
        .select("*, trophies(*)")
        .eq("user_id", user.id);

      if (error) {
        console.error("user_trophies error:", error.message);
        return [];
      }
      return (data as (UserTrophy & { trophies: Trophy })[]) || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Merge trophies with user progress
  const trophiesWithProgress = useMemo(() => {
    const userMap = new Map(
      userTrophies.map((ut) => [ut.trophy_id, ut])
    );

    return trophies.map((trophy) => {
      const userTrophy = userMap.get(trophy.id);
      const conditionValue = trophy.condition_value as { count?: number };
      const target = conditionValue?.count || 1;

      return {
        ...trophy,
        progress: userTrophy?.progress ?? 0,
        target,
        completed: userTrophy?.completed ?? false,
        completedAt: userTrophy?.completed_at ?? null,
        percentage: Math.min(
          100,
          Math.round(((userTrophy?.progress ?? 0) / target) * 100)
        ),
      };
    });
  }, [trophies, userTrophies]);

  // Stats
  const stats = useMemo(() => {
    const total = trophies.length;
    const unlocked = trophiesWithProgress.filter((t) => t.completed).length;
    const inProgress = trophiesWithProgress.filter(
      (t) => !t.completed && t.progress > 0
    ).length;

    return { total, unlocked, inProgress };
  }, [trophies, trophiesWithProgress]);

  // Group by category
  const byCategory = useMemo(() => {
    const groups: Record<string, typeof trophiesWithProgress> = {};
    for (const t of trophiesWithProgress) {
      const cat = t.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [trophiesWithProgress]);

  return {
    trophies: trophiesWithProgress,
    byCategory,
    stats,
    isLoading: loadingTrophies || loadingUserTrophies,
  };
}
