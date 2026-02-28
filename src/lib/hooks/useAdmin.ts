"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer, Bar, Profile, Rarity } from "@/types";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface AdminStats {
  total_users: number;
  total_beers: number;
  total_bars: number;
  total_duels: number;
  total_glupps: number;
  pending_submissions: number;
  active_today: number;
}

export interface AdminSubmission {
  id: string;
  user_id: string;
  type: "beer" | "bar" | "correction";
  status: "pending" | "approved" | "rejected";
  data: Record<string, unknown>;
  reject_reason: string | null;
  created_at: string;
  // Joined
  user?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

interface BeerInput {
  name: string;
  brewery: string;
  country: string;
  country_code: string;
  style: string;
  abv?: number | null;
  ibu?: number | null;
  color?: string;
  taste_bitter?: number;
  taste_sweet?: number;
  taste_fruity?: number;
  taste_body?: number;
  rarity?: Rarity;
  description?: string | null;
  image_url?: string | null;
  barcode?: string | null;
  fun_fact?: string | null;
  fun_fact_icon?: string;
  region?: string | null;
}

interface BarInput {
  name?: string;
  address?: string | null;
  city?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  is_verified?: boolean;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useAdmin() {
  const queryClient = useQueryClient();

  // ─── Stats ───────────────────────────────

  const {
    data: stats = null,
    isLoading: loadingStats,
  } = useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw new Error(error.message);
      return data as AdminStats;
    },
    staleTime: 30 * 1000,
  });

  // ─── Beers CRUD ──────────────────────────

  function useAdminBeers(search?: string, rarity?: string) {
    return useQuery({
      queryKey: queryKeys.admin.beers({ search, rarity }),
      queryFn: async () => {
        let query = supabase
          .from("beers")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(50);

        if (search && search.trim().length > 0) {
          query = query.or(
            `name.ilike.%${search}%,brewery.ilike.%${search}%`
          );
        }

        if (rarity) {
          query = query.eq("rarity", rarity);
        }

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);
        return { beers: (data as Beer[]) || [], total: count ?? 0 };
      },
      staleTime: 30 * 1000,
    });
  }

  const createBeerMutation = useMutation({
    mutationFn: async (input: BeerInput) => {
      const { data, error } = await supabase
        .from("beers")
        .insert({
          ...input,
          elo: 1000,
          total_votes: 0,
          is_active: true,
          color: input.color ?? "#F59E0B",
          taste_bitter: input.taste_bitter ?? 3,
          taste_sweet: input.taste_sweet ?? 3,
          taste_fruity: input.taste_fruity ?? 3,
          taste_body: input.taste_body ?? 3,
          rarity: input.rarity ?? "common",
          fun_fact_icon: input.fun_fact_icon ?? "🍺",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Beer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  const updateBeerMutation = useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<BeerInput> }) => {
      const { data, error } = await supabase
        .from("beers")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Beer;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.beers.detail(variables.id),
      });
    },
  });

  const deleteBeerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("beers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  // ─── Bars CRUD ───────────────────────────

  function useAdminBars(search?: string) {
    return useQuery({
      queryKey: queryKeys.admin.bars({ search }),
      queryFn: async () => {
        let query = supabase
          .from("bars")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(50);

        if (search && search.trim().length > 0) {
          query = query.or(
            `name.ilike.%${search}%,city.ilike.%${search}%`
          );
        }

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);
        return { bars: (data as Bar[]) || [], total: count ?? 0 };
      },
      staleTime: 30 * 1000,
    });
  }

  const updateBarMutation = useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<BarInput> }) => {
      const { data, error } = await supabase
        .from("bars")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Bar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bars"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bars.all });
    },
  });

  const deleteBarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bars")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bars"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch current state
      const { data: bar, error: fetchError } = await supabase
        .from("bars")
        .select("is_verified")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const { data, error } = await supabase
        .from("bars")
        .update({ is_verified: !bar.is_verified })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Bar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bars"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bars.all });
    },
  });

  // ─── Submissions ─────────────────────────

  function useAdminSubmissions(status?: string) {
    return useQuery({
      queryKey: queryKeys.admin.submissions(status),
      queryFn: async () => {
        let query = supabase
          .from("submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) return [];

        // Fetch profiles for submitters
        const userIds = [...new Set(data.map((s) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.id, p])
        );

        return data.map((s) => ({
          ...s,
          user: profileMap.get(s.user_id) || null,
        })) as AdminSubmission[];
      },
      staleTime: 30 * 1000,
    });
  }

  const approveSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("approve_submission", {
        p_submission_id: id,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "bars"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase.rpc("reject_submission", {
        p_submission_id: id,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  // ─── Users ───────────────────────────────

  function useAdminUsers(search?: string) {
    return useQuery({
      queryKey: queryKeys.admin.users(search),
      queryFn: async () => {
        let query = supabase
          .from("profiles")
          .select("*")
          .order("xp", { ascending: false })
          .limit(50);

        if (search && search.trim().length > 0) {
          query = query.or(
            `username.ilike.%${search}%,display_name.ilike.%${search}%`
          );
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data as Profile[]) || [];
      },
      staleTime: 30 * 1000,
    });
  }

  const awardXPMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      reason,
    }: {
      userId: string;
      amount: number;
      reason: string;
    }) => {
      const { data, error } = await supabase.rpc("admin_award_xp", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
    },
  });

  // ─── Public API ──────────────────────────

  return {
    // Stats
    stats,
    loadingStats,

    // Beers
    useAdminBeers,
    createBeer: createBeerMutation.mutateAsync,
    creatingBeer: createBeerMutation.isPending,
    updateBeer: (id: string, data: Partial<BeerInput>) =>
      updateBeerMutation.mutateAsync({ id, data }),
    updatingBeer: updateBeerMutation.isPending,
    deleteBeer: deleteBeerMutation.mutateAsync,
    deletingBeer: deleteBeerMutation.isPending,

    // Bars
    useAdminBars,
    updateBar: (id: string, data: Partial<BarInput>) =>
      updateBarMutation.mutateAsync({ id, data }),
    updatingBar: updateBarMutation.isPending,
    deleteBar: deleteBarMutation.mutateAsync,
    deletingBar: deleteBarMutation.isPending,
    toggleVerified: toggleVerifiedMutation.mutateAsync,
    togglingVerified: toggleVerifiedMutation.isPending,

    // Submissions
    useAdminSubmissions,
    approveSubmission: approveSubmissionMutation.mutateAsync,
    approvingSubmission: approveSubmissionMutation.isPending,
    rejectSubmission: (id: string, reason: string) =>
      rejectSubmissionMutation.mutateAsync({ id, reason }),
    rejectingSubmission: rejectSubmissionMutation.isPending,

    // Users
    useAdminUsers,
    awardXP: (userId: string, amount: number, reason: string) =>
      awardXPMutation.mutateAsync({ userId, amount, reason }),
    awardingXP: awardXPMutation.isPending,
  };
}
