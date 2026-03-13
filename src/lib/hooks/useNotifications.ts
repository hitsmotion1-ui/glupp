"use client";

import { useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";

export interface LegacyNotification {
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

export interface PersistentNotification {
  id: string;
  user_id: string;
  type:
    | "submission_approved"
    | "submission_rejected"
    | "xp_reward"
    | "admin_new_submission"
    | "system"
    | "trophy"
    | "ban_status"
    | "friend_accepted"
    | "reaction" 
    | "comment"; 
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface UnifiedNotification {
  id: string;
  kind: "legacy" | "persistent";
  type: string;
  created_at: string;
  is_read: boolean;
  legacy?: LegacyNotification;
  persistent?: PersistentNotification;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);
  const showXPToast = useAppStore((s) => s.showXPToast);
  const triggerCelebration = useAppStore((s) => s.triggerCelebration);

  const celebratedIds = useRef<Set<string>>(new Set());

  const { data: legacyNotifs = [], isLoading: loadingLegacy } = useQuery({
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
      return (data as LegacyNotification[]) || [];
    },
    staleTime: 30 * 1000,
  });

  const { data: persistentNotifs = [], isLoading: loadingPersistent } =
    useQuery({
      queryKey: ["notifications", "persistent"],
      queryFn: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("persistent notifications error:", error.message);
          return [];
        }
        return (data as PersistentNotification[]) || [];
      },
      staleTime: 30 * 1000,
    });

  const notifications = useMemo(() => {
    const unified: UnifiedNotification[] = [];

    for (const n of legacyNotifs) {
      unified.push({
        id: n.notif_id,
        kind: "legacy",
        type: n.notif_type,
        created_at: n.created_at,
        is_read: false, 
        legacy: n,
      });
    }

    for (const n of persistentNotifs) {
      unified.push({
        id: n.id,
        kind: "persistent",
        type: n.type,
        created_at: n.created_at,
        is_read: n.is_read,
        persistent: n,
      });
    }

    unified.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return unified;
  }, [legacyNotifs, persistentNotifs]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const friendRequests = useMemo(
    () =>
      notifications.filter(
        (n) => n.kind === "legacy" && n.type === "friend_request"
      ),
    [notifications]
  );

  const activityTags = useMemo(
    () =>
      notifications.filter(
        (n) => n.kind === "legacy" && n.type === "activity_tag"
      ),
    [notifications]
  );

  useEffect(() => {
    setNotificationCount(unreadCount);
  }, [unreadCount, setNotificationCount]);

  const markAsRead = useCallback(
    async (notifId: string) => {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId);

      queryClient.invalidateQueries({
        queryKey: ["notifications", "persistent"],
      });
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    queryClient.invalidateQueries({
      queryKey: ["notifications", "persistent"],
    });
  }, [queryClient]);

  // ── 4. Real-time subscriptions corrigées (Canal sécurisé) ──
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "friendships" },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
          }
        )
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "notifications",
          },
          (payload) => {
            console.log("🔔 Bip Bip ! Événement Temps Réel reçu :", payload);
            queryClient.invalidateQueries({ queryKey: ["notifications", "persistent"] });
          }
        )
        .subscribe((status) => {
          console.log("📡 Statut de la connexion Temps Réel :", status);
        });
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const celebrateUnreadApprovals = useCallback(async () => {
    const unreadApprovals = persistentNotifs.filter(
      (n) =>
        n.type === "submission_approved" &&
        !n.is_read &&
        !celebratedIds.current.has(n.id)
    );

    if (unreadApprovals.length === 0) return;

    for (const notif of unreadApprovals) {
      celebratedIds.current.add(notif.id);

      const xp = (notif.metadata?.xp_gained as number) || 0;
      const name = (notif.metadata?.name as string) || "";

      if (xp > 0) {
        showXPToast(xp, `${name} validé !`);
      }
      triggerCelebration();
    }

    const ids = unreadApprovals.map((n) => n.id);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    queryClient.invalidateQueries({
      queryKey: ["notifications", "persistent"],
    });
  }, [persistentNotifs, showXPToast, triggerCelebration, queryClient]);

  return {
    notifications,
    friendRequests,
    activityTags,
    persistentNotifs,
    isLoading: loadingLegacy || loadingPersistent,
    count: unreadCount,
    markAsRead,
    markAllAsRead,
    celebrateUnreadApprovals,
  };
}