"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer, Bar, Profile, Rarity, Trophy, GluppOfWeek, Activity, UserAdminDetail } from "@/types";

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
  admin_note: string | null;
  created_at: string;
  // Joined
  user?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

// 🆕 Le Hook pour le graphique des 30 derniers jours (Corrigé)
export function useAdminDailyStats() {
  return useQuery({
    queryKey: ["admin", "daily_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_daily_stats");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
} // <-- Il manquait cette accolade !

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
// Hook Principal
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
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // ─── Beers CRUD ──────────────────────────

  function useAdminBeers(search?: string, rarity?: string) {
    return useQuery({
      queryKey: queryKeys.admin.beers({ search, rarity }),
      queryFn: async () => {
        let query = supabase
          .from("beers")
          .select("*", { count: "exact" })
          .eq("is_active", true)
          .eq("status", "approved")
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

  // ─── Pending Beers (moderation) ──────────

  function useAdminPendingBeers() {
    return useQuery({
      queryKey: ["admin", "beers", "pending"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("beers")
          .select("*")
          .eq("status", "pending")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) return [];

        // Fetch profiles for proposers
        const addedByIds = [...new Set(data.map((b) => b.added_by).filter(Boolean))];
        let profileMap = new Map<string, Pick<Profile, "id" | "username" | "display_name">>();

        if (addedByIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, display_name")
            .in("id", addedByIds);

          if (profiles) {
            profileMap = new Map(profiles.map((p) => [p.id, p]));
          }
        }

        return (data as Beer[]).map((beer) => ({
          ...beer,
          proposer: beer.added_by ? profileMap.get(beer.added_by) || null : null,
        }));
      },
      staleTime: 15 * 1000,
    });
  }

  const approveBeerMutation = useMutation({
    mutationFn: async (beerId: string) => {
      // Use RPC with SECURITY DEFINER to bypass RLS for cross-user operations
      const { data, error } = await supabase.rpc("approve_beer", {
        p_beer_id: beerId,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
    },
  });

  const rejectBeerMutation = useMutation({
    mutationFn: async ({ beerId, reason }: { beerId: string; reason?: string }) => {
      // Use RPC with SECURITY DEFINER to bypass RLS for cross-user operations
      const { data, error } = await supabase.rpc("reject_beer", {
        p_beer_id: beerId,
        p_reason: reason?.trim() || null,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
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

  const createBarMutation = useMutation({
    mutationFn: async (input: BarInput) => {
      const { data, error } = await supabase
        .from("bars")
        .insert({
          name: input.name,
          address: input.address ?? null,
          city: input.city ?? null,
          geo_lat: input.geo_lat ?? null,
          geo_lng: input.geo_lng ?? null,
          is_verified: false,
          rating: 0,
          total_votes: 0,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Bar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bars"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

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
    // Always fetch ALL submissions (single cache), then filter client-side
    return useQuery({
      queryKey: ["admin", "submissions", "all"],
      queryFn: async () => {
        // 1. Fetch from legacy submissions table
        const legacyQuery = supabase
          .from("submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        const { data: legacyData } = await legacyQuery;
        const legacySubmissions = legacyData || [];

        // 2. Fetch user-submitted beers from beers table (new flow)
        // Only show beers that were proposed by users (added_by IS NOT NULL)
        const beersQuery = supabase
          .from("beers")
          .select("*")
          .eq("is_active", true)
          .not("added_by", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        const { data: beerSubmissions } = await beersQuery;
        const pendingBeers = (beerSubmissions || []).filter((b) => b.added_by);

        // 3. Collect all user IDs
        const userIds = [
          ...new Set([
            ...legacySubmissions.map((s) => s.user_id),
            ...pendingBeers.map((b) => b.added_by).filter(Boolean),
          ]),
        ];

        let profileMap = new Map<string, Pick<Profile, "id" | "username" | "display_name" | "avatar_url">>();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", userIds);

          profileMap = new Map(
            (profiles || []).map((p) => [p.id, p])
          );
        }

        // 4. Convert pending beers to AdminSubmission format
        const beerAsSubmissions: AdminSubmission[] = pendingBeers.map((beer) => ({
          id: `beer-${beer.id}`,
          user_id: beer.added_by!,
          type: "beer" as const,
          status: beer.status as "pending" | "approved" | "rejected",
          data: {
            name: beer.name,
            brewery: beer.brewery,
            style: beer.style,
            abv: beer.abv,
            country: beer.country,
            country_code: beer.country_code,
            region: beer.region,
            image_url: beer.image_url,
            beer_id: beer.id,
          },
          admin_note: null,
          created_at: beer.created_at,
          user: beer.added_by ? profileMap.get(beer.added_by) || undefined : undefined,
        }));

        // 5. Format legacy submissions
        const legacyFormatted = legacySubmissions.map((s) => ({
          ...s,
          user: profileMap.get(s.user_id) || null,
        })) as AdminSubmission[];

        // 6. Merge and sort by date (newest first)
        const allSubmissions = [...beerAsSubmissions, ...legacyFormatted].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return allSubmissions;
      },
      staleTime: 15 * 1000,
      select: (data) => {
        if (!status) return data;
        return data.filter((s) => s.status === status);
      },
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

  const updateSubmissionDataMutation = useMutation({
    mutationFn: async ({
      id,
      data: newData,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("submissions")
        .update({ data: newData })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
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

  // ─── Toggle Ban ──────────────────────────

  const toggleBanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("admin_toggle_ban", {
        p_user_id: userId,
      });
      if (error) throw new Error(error.message);
      return data as { success: boolean; is_banned: boolean; username: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  // ─── Award Trophy ─────────────────────────

  const awardTrophyMutation = useMutation({
    mutationFn: async ({ userId, trophyId }: { userId: string; trophyId: string }) => {
      const { data, error } = await supabase.rpc("admin_award_trophy", {
        p_user_id: userId,
        p_trophy_id: trophyId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
    },
  });

  // ─── Set GOTW ────────────────────────────

  const setGOTWMutation = useMutation({
    mutationFn: async ({
      beerId,
      weekStart,
      weekEnd,
      bonusXp,
    }: {
      beerId: string;
      weekStart: string;
      weekEnd: string;
      bonusXp: number;
    }) => {
      const { data, error } = await supabase.rpc("admin_set_gotw", {
        p_beer_id: beerId,
        p_week_start: weekStart,
        p_week_end: weekEnd,
        p_bonus_xp: bonusXp,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gotw"] });
    },
  });

  // ─── Trophies list ───────────────────────

  function useAdminTrophies() {
    return useQuery({
      queryKey: ["admin", "trophies"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("trophies")
          .select("*")
          .order("category", { ascending: true })
          .order("name", { ascending: true });
        if (error) throw new Error(error.message);
        return (data as Trophy[]) || [];
      },
      staleTime: 5 * 60 * 1000, // 5 min
    });
  }

  // ─── GOTW list ───────────────────────────

  function useAdminGOTW() {
    return useQuery({
      queryKey: ["admin", "gotw"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("glupp_of_week")
          .select("*, beer:beers(*)")
          .order("week_start", { ascending: false })
          .limit(10);
        if (error) throw new Error(error.message);
        return (data as (GluppOfWeek & { beer?: Beer })[]) || [];
      },
      staleTime: 30 * 1000,
    });
  }

  // ─── User admin detail ───────────────────

  function useUserAdminDetail(userId?: string | null) {
    return useQuery({
      queryKey: ["admin", "user-detail", userId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc("get_user_admin_detail", {
          p_user_id: userId!,
        });
        if (error) throw new Error(error.message);
        return data as UserAdminDetail;
      },
      enabled: !!userId,
      staleTime: 30 * 1000,
    });
  }

  // ─── Recent activities ───────────────────

  function useAdminActivities() {
    return useQuery({
      queryKey: ["admin", "activities"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("activities")
          .select("*, user:profiles!user_id(id, username, display_name, avatar_url), beer:beers!beer_id(id, name, brewery)")
          .in("type", ["glupp", "duel", "photo"])
          .order("created_at", { ascending: false })
          .limit(15);
        if (error) throw new Error(error.message);
        return (data as Activity[]) || [];
      },
      staleTime: 0,
      refetchOnWindowFocus: true,
    });
  }

  // ─── All glupps (modération photos) ─────

  const GLUPPS_PAGE_SIZE = 25;

  function useAdminGlupps({
    page = 0,
    onlyWithPhoto = false,
  }: { page?: number; onlyWithPhoto?: boolean } = {}) {
    return useQuery({
      queryKey: ["admin", "glupps", page, onlyWithPhoto],
      queryFn: async () => {
        let query = supabase
          .from("activities")
          .select(
            "id, user_id, beer_id, photo_url, created_at, metadata, user:profiles!user_id(id, username, display_name, avatar_url), beer:beers!beer_id(id, name, brewery, rarity)",
            { count: "exact" }
          )
          .eq("type", "glupp")
          .order("created_at", { ascending: false })
          .range(page * GLUPPS_PAGE_SIZE, (page + 1) * GLUPPS_PAGE_SIZE - 1);

        if (onlyWithPhoto) {
          query = query.not("photo_url", "is", null);
        }

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);
        return { glupps: data || [], total: count ?? 0 };
      },
      staleTime: 0,
      refetchOnWindowFocus: true,
    });
  }

  // ─── XP ──────────────────────────────────

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

    // Beer moderation
    useAdminPendingBeers,
    approveBeer: approveBeerMutation.mutateAsync,
    approvingBeer: approveBeerMutation.isPending,
    rejectBeer: (beerId: string, reason?: string) =>
      rejectBeerMutation.mutateAsync({ beerId, reason }),
    rejectingBeer: rejectBeerMutation.isPending,

    // Bars
    useAdminBars,
    createBar: createBarMutation.mutateAsync,
    creatingBar: createBarMutation.isPending,
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
    updateSubmissionData: (id: string, data: Record<string, unknown>) =>
      updateSubmissionDataMutation.mutateAsync({ id, data }),
    updatingSubmissionData: updateSubmissionDataMutation.isPending,

    // Users
    useAdminUsers,
    awardXP: (userId: string, amount: number, reason: string) =>
      awardXPMutation.mutateAsync({ userId, amount, reason }),
    awardingXP: awardXPMutation.isPending,
    toggleBan: toggleBanMutation.mutateAsync,
    togglingBan: toggleBanMutation.isPending,

    // Trophies
    useAdminTrophies,
    awardTrophy: (userId: string, trophyId: string) =>
      awardTrophyMutation.mutateAsync({ userId, trophyId }),
    awardingTrophy: awardTrophyMutation.isPending,

    // GOTW
    useAdminGOTW,
    setGOTW: (beerId: string, weekStart: string, weekEnd: string, bonusXp: number) =>
      setGOTWMutation.mutateAsync({ beerId, weekStart, weekEnd, bonusXp }),
    settingGOTW: setGOTWMutation.isPending,

    // User detail
    useUserAdminDetail,

    // Activities
    useAdminActivities,

    // Glupps (modération photos)
    useAdminGlupps,
    GLUPPS_PAGE_SIZE,
  };
}