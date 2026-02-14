"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getLevel, getNextLevel, getLevelProgress } from "@/lib/utils/xp";
import type { Profile } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data as Profile);
    } else if (error?.code === "PGRST116") {
      // Profil absent (inscription avant schema) → auto-creation
      const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "user";
      const displayName =
        user.user_metadata?.display_name || username;

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (!insertError) {
        // Re-fetch apres insertion
        const { data: retryData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (retryData) setProfile(retryData as Profile);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const level = profile ? getLevel(profile.xp) : getLevel(0);
  const nextLevel = profile ? getNextLevel(profile.xp) : getNextLevel(0);
  const progress = profile ? getLevelProgress(profile.xp) : 0;

  return {
    profile,
    loading,
    level,
    nextLevel,
    progress,
    refetch: fetchProfile,
  };
}
