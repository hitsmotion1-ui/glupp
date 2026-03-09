"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";

interface FriendData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  beers_tasted: number;
  duels_played: number;
  photos_taken: number;
}

interface FriendEntry {
  friendship_id: string;
  friend_id: string;
  friendship_status: string;
  friend_since: string;
  initiated_by: string | null;
  friend_data: FriendData;
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  beers_tasted: number;
  friendship_status: string | null;
}

export function useFriends() {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch all friendships (accepted + pending)
  const { data: allFriendships = [], isLoading } = useQuery({
    queryKey: queryKeys.friends.all,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      setCurrentUserId(user.id);

      const { data, error } = await supabase.rpc("get_friends", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("get_friends error:", error.message);
        return [];
      }
      return (data as FriendEntry[]) || [];
    },
    staleTime: 30 * 1000,
  });

  // Split into friends and requests
  const friends = useMemo(
    () => allFriendships.filter((f) => f.friendship_status === "accepted"),
    [allFriendships]
  );

  // Only show RECEIVED requests (where current user is NOT the initiator)
  const requests = useMemo(
    () =>
      allFriendships.filter(
        (f) =>
          f.friendship_status === "pending" &&
          f.initiated_by !== currentUserId
      ),
    [allFriendships, currentUserId]
  );

  // Sent requests (where current user IS the initiator)
  const sentRequests = useMemo(
    () =>
      allFriendships.filter(
        (f) =>
          f.friendship_status === "pending" &&
          f.initiated_by === currentUserId
      ),
    [allFriendships, currentUserId]
  );

  // Search users
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: queryKeys.friends.search(searchQuery),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc("search_users", {
        p_query: searchQuery,
        p_current_user_id: user.id,
        p_limit: 20,
      });

      if (error) {
        console.error("search_users error:", error.message);
        return [];
      }
      return (data as SearchResult[]) || [];
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.rpc("send_friend_request", {
        p_from_user_id: user.id,
        p_to_user_id: targetUserId,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.search(searchQuery) });
    },
  });

  // Accept / reject request
  const updateRequestMutation = useMutation({
    mutationFn: async ({
      friendshipId,
      action,
    }: {
      friendshipId: string;
      action: "accept" | "reject";
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.rpc("update_friend_request", {
        p_friendship_id: friendshipId,
        p_user_id: user.id,
        p_action: action,
      });

      if (error) throw new Error(error.message);
      return { ...data, action };
    },
    onSuccess: async (_, variables) => {
      // Force immediate refetch (not just invalidation) for instant UI update
      await queryClient.refetchQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      if (variables.action === "accept") {
        showXPToast(5, "Nouvel ami !");
        // Refresh profile so the +5 XP appears immediately
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
        queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      }
    },
  });

  // Cancel a sent friend request (only initiator can cancel)
  const cancelRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.rpc("cancel_friend_request", {
        p_friendship_id: friendshipId,
        p_user_id: user.id,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.search(searchQuery) });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });

  const sendRequest = useCallback(
    (targetUserId: string) => sendRequestMutation.mutateAsync(targetUserId),
    [sendRequestMutation]
  );

  const acceptRequest = useCallback(
    (friendshipId: string) =>
      updateRequestMutation.mutateAsync({ friendshipId, action: "accept" }),
    [updateRequestMutation]
  );

  const rejectRequest = useCallback(
    (friendshipId: string) =>
      updateRequestMutation.mutateAsync({ friendshipId, action: "reject" }),
    [updateRequestMutation]
  );

  const cancelRequest = useCallback(
    (friendshipId: string) => cancelRequestMutation.mutateAsync(friendshipId),
    [cancelRequestMutation]
  );

  const removeFriend = useCallback(
    (friendshipId: string) => removeFriendMutation.mutateAsync(friendshipId),
    [removeFriendMutation]
  );

  return {
    friends,
    requests,
    sentRequests,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    sendingRequest: sendRequestMutation.isPending,
    cancellingRequest: cancelRequestMutation.isPending,
  };
}
