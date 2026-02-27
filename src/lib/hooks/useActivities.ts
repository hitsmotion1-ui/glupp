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

  // Real-time subscription for new activities
  useEffect(() => {
    const channel = supabase
      .channel("activities-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.activities.feed,
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const activities = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data]
  );

  return {
    activities,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
  };
}
