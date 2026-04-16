"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";

interface Challenge {
  id: string;
  challenge_type_id: string;
  completed: boolean;
  completed_at: string | null;
  xp_awarded: number;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: Record<string, unknown>;
}

interface DailyChallengesData {
  challenges: Challenge[];
  streak: number;
  all_completed: boolean;
}

interface CheckResult {
  newly_completed: string[];
  xp_earned: number;
  all_completed: boolean;
  streak: number;
}

export function useDailyChallenges() {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  const { data, isLoading } = useQuery({
    queryKey: ["daily-challenges"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc("get_daily_challenges", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("get_daily_challenges error:", error.message);
        return null;
      }

      return data as DailyChallengesData;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh toutes les minutes pour détecter les progrès
  });

  const checkMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.rpc("check_daily_challenges", {
        p_user_id: user.id,
      });

      if (error) throw new Error(error.message);
      return data as CheckResult;
    },
    onSuccess: (result) => {
      if (result.xp_earned > 0) {
        showXPToast(result.xp_earned, result.all_completed ? "Combo !" : "Défi !");
      }
      queryClient.invalidateQueries({ queryKey: ["daily-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return {
    challenges: data?.challenges || [],
    streak: data?.streak || 0,
    allCompleted: data?.all_completed || false,
    isLoading,
    checkChallenges: checkMutation.mutateAsync,
    checking: checkMutation.isPending,
  };
}

export type { Challenge, DailyChallengesData };
