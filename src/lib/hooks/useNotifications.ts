"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";

export interface NotificationEntry {
  notif_id: string;
  notif_type: "friend_request" | "activity_tag";
  created_at: string;
  data: {
    friendship_id?: string;
    activity_id?: string;
    from_user: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      xp?: number;
    };
    beer?: { id: string; name: string } | null;
  };
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_notifications", {
        p_user_id: user.id,
        p_limit: 50,
      });

      if (error) {
        console.error("get_notifications error:", error.message);
        return [];
      }
      return (data as NotificationEntry[]) || [];
    },
    staleTime: 30 * 1000,
  });

  // Friend requests only
  const friendRequests = useMemo(
    () => notifications.filter((n) => n.notif_type === "friend_request"),
    [notifications]
  );

  // Activity tags only
  const activityTags = useMemo(
    () => notifications.filter((n) => n.notif_type === "activity_tag"),
    [notifications]
  );

  // Sync badge count to store
  useEffect(() => {
    setNotificationCount(notifications.length);
  }, [notifications.length, setNotificationCount]);

  // Real-time: refresh when friendships change
  useEffect(() => {
    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.friends.all,
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  return {
    notifications,
    friendRequests,
    activityTags,
    isLoading,
    count: notifications.length,
  };
}
