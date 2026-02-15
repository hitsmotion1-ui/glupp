"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthData {
  user: User | null;
  profile: Profile | null;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<AuthData> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { user: null, profile: null };

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return {
        user,
        profile: profileData ? (profileData as Profile) : null,
      };
    },
    staleTime: Infinity,
  });

  // Listen for auth state changes and invalidate
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      // Invalidate auth query to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      // Also invalidate profile since user changed
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear all queries on sign out
    queryClient.clear();
    router.push("/login");
  };

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    loading,
    signOut,
  };
}
