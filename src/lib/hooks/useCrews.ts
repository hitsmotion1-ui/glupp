"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Crew } from "@/types";

interface CrewWithMembers extends Omit<Crew, "members"> {
  members: Array<{
    user_id: string;
    role: string;
    joined_at: string;
    profile: {
      username: string;
      display_name: string;
      avatar_url: string | null;
      xp: number;
    };
  }>;
  member_count: number;
}

export function useCrews() {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  // Fetch user's crews
  const { data: crews = [], isLoading } = useQuery({
    queryKey: queryKeys.crews.all,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get crew IDs where user is member
      const { data: memberships } = await supabase
        .from("crew_members")
        .select("crew_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return [];

      const crewIds = memberships.map((m) => m.crew_id);

      // Get crew details with members
      const { data: crewsData, error } = await supabase
        .from("crews")
        .select("*")
        .in("id", crewIds);

      if (error || !crewsData) return [];

      // Get members for each crew
      const result: CrewWithMembers[] = [];
      for (const crew of crewsData) {
        const { data: members } = await supabase
          .from("crew_members")
          .select("user_id, role, joined_at, profiles(username, display_name, avatar_url, xp)")
          .eq("crew_id", crew.id);

        result.push({
          ...crew,
          members: (members || []).map((m: Record<string, unknown>) => ({
            user_id: m.user_id as string,
            role: m.role as string,
            joined_at: m.joined_at as string,
            profile: m.profiles as { username: string; display_name: string; avatar_url: string | null; xp: number },
          })),
          member_count: members?.length || 0,
        });
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create crew
  const createCrewMutation = useMutation({
    mutationFn: async ({
      name,
      memberIds,
    }: {
      name: string;
      memberIds: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // Create crew
      const { data: crew, error: crewError } = await supabase
        .from("crews")
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (crewError) throw new Error(crewError.message);

      // Add creator as admin
      await supabase
        .from("crew_members")
        .insert({ crew_id: crew.id, user_id: user.id, role: "admin" });

      // Add invited members
      if (memberIds.length > 0) {
        const memberInserts = memberIds.map((uid) => ({
          crew_id: crew.id,
          user_id: uid,
          role: "member",
        }));
        await supabase.from("crew_members").insert(memberInserts);
      }

      return crew;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crews.all });
      showXPToast(0, "Crew créé !");
    },
  });

  const createCrew = async (name: string, memberIds: string[] = []) => {
    return createCrewMutation.mutateAsync({ name, memberIds });
  };

  return {
    crews,
    isLoading,
    createCrew,
    creatingCrew: createCrewMutation.isPending,
  };
}
