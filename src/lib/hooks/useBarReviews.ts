"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import { XP_GAINS } from "@/lib/utils/xp";
import type { BarReview } from "@/types";

interface ReviewInput {
  bar_id: string;
  ambiance: number;
  beer_selection: number;
  price: number;
  service: number;
  comment?: string;
}

interface BarReviewStats {
  total_reviews: number;
  avg_ambiance: number;
  avg_beer_selection: number;
  avg_price: number;
  avg_service: number;
  avg_overall: number;
}

export function useBarReviews(barId: string | null) {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  // Fetch reviews for a bar
  const {
    data: reviews = [],
    isLoading: loadingReviews,
  } = useQuery({
    queryKey: queryKeys.barReviews.bar(barId || ""),
    queryFn: async () => {
      if (!barId) return [];
      const { data, error } = await supabase
        .from("bar_reviews")
        .select("*")
        .eq("bar_id", barId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching bar reviews:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Fetch profiles for all reviewers
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return data.map((r) => ({
        ...r,
        user: profileMap.get(r.user_id) || null,
      })) as BarReview[];
    },
    enabled: !!barId,
    staleTime: 30 * 1000,
  });

  // Fetch user's review for this bar
  const {
    data: userReview,
    isLoading: loadingUserReview,
  } = useQuery({
    queryKey: queryKeys.barReviews.user(barId || ""),
    queryFn: async () => {
      if (!barId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("bar_reviews")
        .select("*")
        .eq("bar_id", barId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user review:", error.message);
        return null;
      }
      return data as BarReview | null;
    },
    enabled: !!barId,
    staleTime: 30 * 1000,
  });

  // Compute stats from reviews
  const stats: BarReviewStats = reviews.length > 0
    ? {
        total_reviews: reviews.length,
        avg_ambiance: reviews.reduce((sum, r) => sum + r.ambiance, 0) / reviews.length,
        avg_beer_selection: reviews.reduce((sum, r) => sum + r.beer_selection, 0) / reviews.length,
        avg_price: reviews.reduce((sum, r) => sum + r.price, 0) / reviews.length,
        avg_service: reviews.reduce((sum, r) => sum + r.service, 0) / reviews.length,
        avg_overall:
          reviews.reduce(
            (sum, r) => sum + (r.ambiance + r.beer_selection + r.price + r.service) / 4,
            0
          ) / reviews.length,
      }
    : {
        total_reviews: 0,
        avg_ambiance: 0,
        avg_beer_selection: 0,
        avg_price: 0,
        avg_service: 0,
        avg_overall: 0,
      };

  // Submit or update review
  const submitReview = useMutation({
    mutationFn: async (input: ReviewInput): Promise<{ review: BarReview; isNew: boolean }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecte");

      // Check if user already reviewed this bar
      const { data: existing } = await supabase
        .from("bar_reviews")
        .select("id")
        .eq("bar_id", input.bar_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing review
        const { data, error } = await supabase
          .from("bar_reviews")
          .update({
            ambiance: input.ambiance,
            beer_selection: input.beer_selection,
            price: input.price,
            service: input.service,
            comment: input.comment || null,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return { review: data as BarReview, isNew: false };
      } else {
        // Insert new review
        const { data, error } = await supabase
          .from("bar_reviews")
          .insert({
            user_id: user.id,
            bar_id: input.bar_id,
            ambiance: input.ambiance,
            beer_selection: input.beer_selection,
            price: input.price,
            service: input.service,
            comment: input.comment || null,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        // Award XP for first review on this bar (best-effort)
        try {
          await supabase.rpc("award_xp", {
            p_user_id: user.id,
            p_amount: XP_GAINS.bar_review,
            p_reason: "bar_review",
          });
        } catch {
          // XP award is best-effort, don't fail the review
        }

        return { review: data as BarReview, isNew: true };
      }
    },
    onSuccess: (result) => {
      if (barId) {
        // Force immediate refetch (not just invalidation)
        queryClient.refetchQueries({ queryKey: queryKeys.barReviews.bar(barId) });
        queryClient.refetchQueries({ queryKey: queryKeys.barReviews.user(barId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.bars.all });

      // Show XP toast for first review
      if (result.isNew) {
        showXPToast(XP_GAINS.bar_review, "Avis de bar");
      }
    },
  });

  return {
    reviews,
    userReview,
    stats,
    loadingReviews,
    loadingUserReview,
    submitReview: submitReview.mutateAsync,
    submitting: submitReview.isPending,
  };
}
