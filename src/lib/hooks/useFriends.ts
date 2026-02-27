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

  // Fetch all friendships (accepted + pending)
  const { data: allFriendships = [], isLoading } = useQuery({
    queryKey: queryKeys.friends.all,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_friends", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("get_friends error:", error.message);
        return [];
      }
      return (data as FriendEntry[]) || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Split into friends and requests
  const friends = useMemo(
    () => allFriendships.filter((f) => f.friendship_status === "accepted"),
    [allFriendships]
  );

  const requests = useMemo(
    () => allFriendships.filter((f) => f.friendship_status === "pending"),
    [allFriendships]
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      if (variables.action === "accept") {
        showXPToast(0, "Nouvel ami !");
      }
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

  const removeFriend = useCallback(
    (friendshipId: string) => removeFriendMutation.mutateAsync(friendshipId),
    [removeFriendMutation]
  );

  return {
    friends,
    requests,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    sendingRequest: sendRequestMutation.isPending,
  };
}
