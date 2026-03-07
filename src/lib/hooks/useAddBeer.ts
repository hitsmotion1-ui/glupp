"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import { useAppStore } from "@/lib/store/useAppStore";
import { getDefaultColor, getDefaultTaste } from "@/lib/utils/beerDefaults";
import { XP_GAINS } from "@/lib/utils/xp";
import type { Beer } from "@/types";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface AddBeerInput {
  name: string;
  brewery: string;
  style: string;
  country: string;       // emoji flag
  country_code: string;  // ISO code
  region?: string;
  abv?: number | null;
  imageFile?: File | null;
}

export interface DuplicateCandidate {
  id: string;
  name: string;
  brewery: string;
  country: string;
  style: string;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useAddBeer() {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // ── Anti-duplicate check ──
  const checkDuplicates = async (name: string, brewery: string): Promise<DuplicateCandidate[]> => {
    if (!name.trim()) return [];

    let query = supabase
      .from("beers")
      .select("id, name, brewery, country, style")
      .eq("is_active", true)
      .ilike("name", `%${name.trim()}%`)
      .limit(5);

    // Also match on brewery if provided
    if (brewery.trim()) {
      // Do a second query to catch brewery matches
      const { data: byName } = await query;

      const { data: byBrewery } = await supabase
        .from("beers")
        .select("id, name, brewery, country, style")
        .eq("is_active", true)
        .ilike("brewery", `%${brewery.trim()}%`)
        .ilike("name", `%${name.trim().split(" ")[0]}%`)
        .limit(5);

      // Merge and deduplicate
      const all = [...(byName || []), ...(byBrewery || [])];
      const seen = new Set<string>();
      const unique: DuplicateCandidate[] = [];
      for (const item of all) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item as DuplicateCandidate);
        }
      }
      return unique.slice(0, 5);
    }

    const { data } = await query;
    return (data as DuplicateCandidate[]) || [];
  };

  // ── Add beer mutation ──
  const addBeerMutation = useMutation({
    mutationFn: async (input: AddBeerInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecte");

      const taste = getDefaultTaste(input.style);
      const color = getDefaultColor(input.style);

      // 0. Upload photo if provided
      let imageUrl: string | null = null;
      if (input.imageFile) {
        const timestamp = Date.now();
        const fileExt = input.imageFile.name.split(".").pop() || "jpg";
        const filePath = `proposals/${user.id}/${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("beer-photos")
          .upload(filePath, input.imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("beer-photos")
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        } else {
          console.warn("Photo upload failed:", uploadError.message);
        }
      }

      // 1. Insert beer with status: 'pending'
      const { data: beer, error: beerError } = await supabase
        .from("beers")
        .insert({
          name: input.name.trim(),
          brewery: input.brewery.trim(),
          style: input.style,
          country: input.country,
          country_code: input.country_code,
          region: input.region?.trim() || null,
          abv: input.abv ?? null,
          ibu: null,
          elo: 1500,
          total_votes: 0,
          rarity: "common",
          color,
          taste_bitter: taste.bitter,
          taste_sweet: taste.sweet,
          taste_fruity: taste.fruity,
          taste_body: taste.body,
          fun_fact: null,
          fun_fact_icon: "💡",
          image_url: imageUrl,
          is_active: true,
          added_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (beerError) throw new Error(beerError.message);

      // 2. Auto-glupp: add to user_beers
      const { error: gluppError } = await supabase
        .from("user_beers")
        .insert({
          user_id: user.id,
          beer_id: beer.id,
        });

      if (gluppError) {
        console.error("Auto-glupp failed:", gluppError.message);
      }

      // 3. Give +10 XP for the proposal
      try {
        const { error: xpError } = await supabase.rpc("add_xp", {
          p_user_id: user.id,
          p_amount: XP_GAINS.propose_beer,
          p_reason: "propose_beer",
        });

        // Fallback: increment XP directly if RPC doesn't exist
        if (xpError) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("xp")
            .eq("id", user.id)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ xp: (profile.xp || 0) + XP_GAINS.propose_beer })
              .eq("id", user.id);
          }
        }
      } catch {
        // XP award is non-critical, don't block the add flow
        console.error("Failed to award XP for beer proposal");
      }

      // 4. Update beers_tasted count
      await supabase
        .from("profiles")
        .select("beers_tasted")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            supabase
              .from("profiles")
              .update({ beers_tasted: (profile.beers_tasted || 0) + 1 })
              .eq("id", user.id);
          }
        });

      // 5. Notify admins
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          type: "admin_new_submission",
          title: "Nouvelle biere proposee",
          message: `${input.name.trim()} (${input.brewery.trim()}) proposee par un utilisateur`,
          metadata: { beer_id: beer.id, beer_name: input.name.trim() },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      return beer as Beer;
    },
    onSuccess: () => {
      showXPToast(XP_GAINS.propose_beer, "Biere proposee !");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "beers"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  const addBeer = async (input: AddBeerInput) => {
    return await addBeerMutation.mutateAsync(input);
  };

  const dismissDuplicates = () => {
    setDuplicates([]);
    setShowDuplicates(false);
  };

  return {
    addBeer,
    adding: addBeerMutation.isPending,
    checkDuplicates,
    duplicates,
    setDuplicates,
    showDuplicates,
    setShowDuplicates,
    dismissDuplicates,
  };
}
