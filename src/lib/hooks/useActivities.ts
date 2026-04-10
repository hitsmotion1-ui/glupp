"use client";

import { useMemo, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";

export interface ActivityEntry {
  id: string;
  user_id: string;
  activity_type: string;
  beer_id: string | null;
  bar_id: string | null;
  crew_id: string | null;
  photo_url: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_data: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    xp: number;
  };
  beer_data: {
    id: string;
    name: string;
    brewery: string;
    rarity: string;
    style: string;
    country: string;
  } | null;
  tagged_users: Array<{
    id: string;
    username: string;
    display_name: string;
  }>;
}

const PAGE_SIZE = 20;

export function useActivities() {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.activities.feed,
    queryFn: async ({ pageParam = 0 }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: activities, error } = await supabase.rpc(
        "get_activity_feed",
        {
          p_user_id: user.id,
          p_limit: PAGE_SIZE,
          p_offset: pageParam,
        }
      );

      if (error) {
        console.error("get_activity_feed error:", error.message);
        return [];
      }
      return (activities as ActivityEntry[]) || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
    initialPageParam: 0,
    staleTime: 30 * 1000,
  });

// Real-time subscription (Uniquement pour les nouveaux posts)
  useEffect(() => {
    const channel = supabase
      .channel("new-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.activities.feed });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

// 🧹 FILTRAGE + REGROUPEMENT: On personnalise le flux
  const activities = useMemo(() => {
    const rawActivities = data?.pages.flatMap((page) => page) ?? [];
    
    // Séparer duels et non-duels
    const nonDuels: ActivityEntry[] = [];
    const duelsByUser = new Map<string, ActivityEntry[]>();

    for (const activity of rawActivities) {
      const meta = activity.metadata || {};
      
      // Cacher les reglupps
      if (activity.activity_type === "glupp" && meta.reglupp) continue;
      
      if (activity.activity_type === "duel") {
        // Ne garder que les duels du jour
        const isToday = new Date(activity.created_at).toDateString() === new Date().toDateString();
        if (!isToday) continue;
        // Regrouper les duels par user
        const key = activity.user_id;
        if (!duelsByUser.has(key)) duelsByUser.set(key, []);
        duelsByUser.get(key)!.push(activity);
      } else {
        nonDuels.push(activity);
      }
    }

    // Créer des entrées groupées pour les duels
    const groupedDuels: ActivityEntry[] = [];
    duelsByUser.forEach((duels, userId) => {
      if (duels.length === 0) return;
      // Prendre le duel le plus récent comme base et ajouter les infos de groupe dans metadata
      const mostRecent = duels[0]; // déjà trié par date DESC
      const groupedEntry: ActivityEntry = {
        ...mostRecent,
        activity_type: "duel_group",
        metadata: {
          ...mostRecent.metadata,
          duels: duels.slice(0, 3).map(d => ({
            beer_id: d.beer_id,
            beer_name: d.beer_data?.name || "?",
            beer_style: d.beer_data?.style || "",
            beer_country: d.beer_data?.country || "",
            loser_id: (d.metadata as any)?.loser,
          })),
          total_duels: duels.length,
        },
      };
      groupedDuels.push(groupedEntry);
    });

    // Fusionner : glupps/trophées/level_up d'abord, puis duels groupés intercalés
    const merged = [...nonDuels, ...groupedDuels];
    // Re-trier par date
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return merged;
  }, [data]);

  return {
    activities,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
  };
}