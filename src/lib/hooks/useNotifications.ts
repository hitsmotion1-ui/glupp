"use client";

import { useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";

// ─── Types ─────────────────────────────────────────────────────

/** Legacy notification from the get_notifications RPC (friend requests, activity tags) */
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

/** Persistent notification from the notifications table */
export interface PersistentNotification {
  id: string;
  user_id: string;
  type:
    | "submission_approved"
    | "submission_rejected"
    | "xp_reward"
    | "admin_new_submission"
    | "system";
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/** Unified notification entry for the UI */
export interface UnifiedNotification {
  id: string;
  kind: "legacy" | "persistent";
  type: string;
  created_at: string;
  is_read: boolean;
  // Legacy fields
  legacy?: LegacyNotification;
  // Persistent fields
  persistent?: PersistentNotification;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useNotifications() {
  const queryClient = useQueryClient();
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);
  const showXPToast = useAppStore((s) => s.showXPToast);
  const triggerCelebration = useAppStore((s) => s.triggerCelebration);

  // Track which notifications we've already celebrated (to avoid double toasts)
  const celebratedIds = useRef<Set<string>>(new Set());

  // ── 1. Legacy notifications (friend requests, activity tags) ──
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

  // ── 2. Persistent notifications (submissions, XP, system) ──
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

  // ── 3. Merge into unified list ──
  const notifications = useMemo(() => {
    const unified: UnifiedNotification[] = [];

    // Legacy notifications
    for (const n of legacyNotifs) {
      unified.push({
        id: n.notif_id,
        kind: "legacy",
        type: n.notif_type,
        created_at: n.created_at,
        is_read: false, // Legacy notifs are always unread (pending actions)
        legacy: n,
      });
    }

    // Persistent notifications
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

    // Sort by most recent first
    unified.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return unified;
  }, [legacyNotifs, persistentNotifs]);

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Friend requests only
  const friendRequests = useMemo(
    () =>
      notifications.filter(
        (n) => n.kind === "legacy" && n.type === "friend_request"
      ),
    [notifications]
  );

  // Activity tags only
  const activityTags = useMemo(
    () =>
      notifications.filter(
        (n) => n.kind === "legacy" && n.type === "activity_tag"
      ),
    [notifications]
  );

  // Sync badge count to store
  useEffect(() => {
    setNotificationCount(unreadCount);
  }, [unreadCount, setNotificationCount]);

  // Mark notification as read
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

  // Mark all persistent notifications as read
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

  // ── 4. Real-time subscriptions ──
  useEffect(() => {
    const channel = supabase
      .channel("notifications-live")
      // Listen to friendships changes (legacy)
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
      // Listen to new persistent notifications (submissions, XP, etc.)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as PersistentNotification;

          // Refetch persistent notifications
          queryClient.invalidateQueries({
            queryKey: ["notifications", "persistent"],
          });

          // 🎉 Show celebration for approved submissions
          if (
            newNotif.type === "submission_approved" &&
            !celebratedIds.current.has(newNotif.id)
          ) {
            celebratedIds.current.add(newNotif.id);
            const xp = (newNotif.metadata?.xp_gained as number) || 0;
            const name = (newNotif.metadata?.name as string) || "";

            // Trigger XP toast
            if (xp > 0) {
              showXPToast(xp, `${name} validé !`);
            }
            // Trigger celebration confetti
            triggerCelebration();
          }

          // Show XP toast for bonus XP
          if (
            newNotif.type === "xp_reward" &&
            !celebratedIds.current.has(newNotif.id)
          ) {
            celebratedIds.current.add(newNotif.id);
            const xp = (newNotif.metadata?.xp_amount as number) || 0;
            if (xp > 0) {
              showXPToast(xp, "Bonus admin");
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, showXPToast, triggerCelebration]);

  return {
    notifications,
    friendRequests,
    activityTags,
    persistentNotifs,
    isLoading: loadingLegacy || loadingPersistent,
    count: unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
