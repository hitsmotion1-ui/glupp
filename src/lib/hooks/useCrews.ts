"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Crew } from "@/types";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface CrewMember {
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    xp: number;
  };
}

interface CrewWithMembers extends Omit<Crew, "members"> {
  members: CrewMember[];
  pending_members: CrewMember[];
  member_count: number;
  is_admin: boolean;
}

interface CrewInvite {
  crew_id: string;
  crew_name: string;
  invited_by: string;
  invited_by_username: string;
  member_count: number;
  created_at: string;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useCrews() {
  const queryClient = useQueryClient();

  // ─── Fetch user's crews (only accepted) ───
  const { data: crews = [], isLoading } = useQuery({
    queryKey: queryKeys.crews.all,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get crew IDs where user is accepted member
      const { data: memberships } = await supabase
        .from("crew_members")
        .select("crew_id, role")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (!memberships || memberships.length === 0) return [];

      const crewIds = memberships.map((m) => m.crew_id);
      const roleMap = new Map(memberships.map((m) => [m.crew_id, m.role]));

      // Get crew details
      const { data: crewsData, error } = await supabase
        .from("crews")
        .select("*")
        .in("id", crewIds);

      if (error || !crewsData) return [];

      // Get ALL members for each crew (accepted + pending for admin view)
      const result: CrewWithMembers[] = [];
      for (const crew of crewsData) {
        const { data: allMembers } = await supabase
          .from("crew_members")
          .select(
            "user_id, role, status, joined_at, profiles(username, display_name, avatar_url, xp)"
          )
          .eq("crew_id", crew.id)
          .in("status", ["accepted", "pending"]);

        const mapped = (allMembers || []).map((m: Record<string, unknown>) => ({
          user_id: m.user_id as string,
          role: m.role as string,
          status: m.status as string,
          joined_at: m.joined_at as string,
          profile: m.profiles as CrewMember["profile"],
        }));

        const accepted = mapped.filter((m) => m.status === "accepted");
        const pending = mapped.filter((m) => m.status === "pending");

        result.push({
          ...crew,
          members: accepted,
          pending_members: pending,
          member_count: accepted.length,
          is_admin: roleMap.get(crew.id) === "admin",
        });
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ─── Fetch pending invites for current user ───
  const { data: invites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ["crews", "invites"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: pending } = await supabase
        .from("crew_members")
        .select("crew_id, joined_at")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (!pending || pending.length === 0) return [];

      const crewIds = pending.map((p) => p.crew_id);

      const { data: crewsData } = await supabase
        .from("crews")
        .select("id, name, created_by, profiles!created_by(username)")
        .in("id", crewIds);

      if (!crewsData) return [];

      const result: CrewInvite[] = [];
      for (const crew of crewsData) {
        const { count } = await supabase
          .from("crew_members")
          .select("*", { count: "exact", head: true })
          .eq("crew_id", crew.id)
          .eq("status", "accepted");

        const profile = crew.profiles as unknown as { username: string } | null;

        result.push({
          crew_id: crew.id,
          crew_name: crew.name,
          invited_by: crew.created_by,
          invited_by_username: profile?.username || "Inconnu",
          member_count: count || 0,
          created_at:
            pending.find((p) => p.crew_id === crew.id)?.joined_at || "",
        });
      }

      return result;
    },
    staleTime: 30 * 1000,
  });

  // ─── Create crew (via RPC) ───
  const createCrewMutation = useMutation({
    mutationFn: async ({
      name,
      memberIds,
    }: {
      name: string;
      memberIds: string[];
    }) => {
      const { data, error } = await supabase.rpc("create_crew", {
        p_name: name,
        p_member_ids: memberIds,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crews.all });
    },
  });

  // ─── Invite to crew ───
  const inviteMutation = useMutation({
    mutationFn: async ({
      crewId,
      userId,
    }: {
      crewId: string;
      userId: string;
    }) => {
      const { error } = await supabase.rpc("invite_to_crew", {
        p_crew_id: crewId,
        p_user_id: userId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crews.all });
    },
  });

  // ─── Accept invite ───
  const acceptInviteMutation = useMutation({
    mutationFn: async (crewId: string) => {
      const { error } = await supabase.rpc("accept_crew_invite", {
        p_crew_id: crewId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crews.all });
      queryClient.invalidateQueries({ queryKey: ["crews", "invites"] });
    },
  });

  // ─── Decline invite ───
  const declineInviteMutation = useMutation({
    mutationFn: async (crewId: string) => {
      const { error } = await supabase.rpc("decline_crew_invite", {
        p_crew_id: crewId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews", "invites"] });
    },
  });

  // ─── Leave crew ───
  const leaveCrewMutation = useMutation({
    mutationFn: async (crewId: string) => {
      const { error } = await supabase.rpc("leave_crew", {
        p_crew_id: crewId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crews.all });
    },
  });

  // ─── Kick from crew (admin only) ───
  const kickMutation = useMutation({
    mutationFn: async ({
      crewId,
      userId,
    }: {
      crewId: string;
      userId: string;
    }) => {
      const { error } = await supabase.rpc("kick_from_crew", {
        p_crew_id: crewId,
        p_user_id: userId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crews.all });
    },
  });

  // ─── Public API ───
  return {
    crews,
    isLoading,

    invites,
    loadingInvites,

    createCrew: (name: string, memberIds: string[] = []) =>
      createCrewMutation.mutateAsync({ name, memberIds }),
    creatingCrew: createCrewMutation.isPending,

    inviteToCrew: (crewId: string, userId: string) =>
      inviteMutation.mutateAsync({ crewId, userId }),
    inviting: inviteMutation.isPending,

    acceptInvite: (crewId: string) =>
      acceptInviteMutation.mutateAsync(crewId),
    acceptingInvite: acceptInviteMutation.isPending,

    declineInvite: (crewId: string) =>
      declineInviteMutation.mutateAsync(crewId),
    decliningInvite: declineInviteMutation.isPending,

    leaveCrew: (crewId: string) =>
      leaveCrewMutation.mutateAsync(crewId),
    leavingCrew: leaveCrewMutation.isPending,

    kickFromCrew: (crewId: string, userId: string) =>
      kickMutation.mutateAsync({ crewId, userId }),
    kicking: kickMutation.isPending,
  };
}
