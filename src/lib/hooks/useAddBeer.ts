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
  barcode?: string;      // 🆕 AJOUT CODE BARRES
  description?: string;  // 🆕 AJOUT COMMENTAIRE
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
      .neq("status", "rejected")
      .ilike("name", `%${name.trim()}%`)
      .limit(5);

    if (brewery.trim()) {
      const { data: byName } = await query;

      const { data: byBrewery } = await supabase
        .from("beers")
        .select("id, name, brewery, country, style")
        .eq("is_active", true)
        .neq("status", "rejected")
        .ilike("brewery", `%${brewery.trim()}%`)
        .ilike("name", `%${name.trim().split(" ")[0]}%`)
        .limit(5);

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

      // 0. Upload photo
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
        }
      }

      // 1. Check existing rejected
      const { data: rejectedList } = await supabase
        .from("beers")
        .select("id")
        .eq("added_by", user.id)
        .eq("status", "rejected")
        .eq("is_active", true)
        .ilike("name", input.name.trim())
        .order("created_at", { ascending: false })
        .limit(1);

      const existingRejected = rejectedList?.[0] ?? null;
      let beer: Beer;

      if (existingRejected) {
        // Update
        const { data: updatedList, error: updateError } = await supabase
          .from("beers")
          .update({
            name: input.name.trim(),
            brewery: input.brewery.trim(),
            style: input.style,
            country: input.country,
            country_code: input.country_code,
            region: input.region?.trim() || null,
            abv: input.abv ?? null,
            barcode: input.barcode || null, // 🆕 Envoi Barcode
            description: input.description || null, // 🆕 Envoi Commentaire
            color,
            taste_bitter: taste.bitter,
            taste_sweet: taste.sweet,
            taste_fruity: taste.fruity,
            taste_body: taste.body,
            ...(imageUrl ? { image_url: imageUrl } : {}),
            status: "pending",
          })
          .eq("id", existingRejected.id)
          .select();

        if (updateError) throw new Error(updateError.message);
        beer = updatedList[0] as Beer;
      } else {
        // Insert
        const { data: inserted, error: beerError } = await supabase
          .from("beers")
          .insert({
            name: input.name.trim(),
            brewery: input.brewery.trim(),
            style: input.style,
            country: input.country,
            country_code: input.country_code,
            region: input.region?.trim() || null,
            abv: input.abv ?? null,
            barcode: input.barcode || null, // 🆕 Envoi Barcode
            description: input.description || null, // 🆕 Envoi Commentaire
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
        beer = inserted as Beer;
      }

      // XP & Notifications
      try {
        const { error: xpError } = await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: XP_GAINS.propose_beer, p_reason: "propose_beer" });
        if (xpError) {
          const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
          if (profile) await supabase.from("profiles").update({ xp: (profile.xp || 0) + XP_GAINS.propose_beer }).eq("id", user.id);
        }
      } catch {}

      const { data: admins } = await supabase.from("profiles").select("id").eq("is_admin", true);
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

  return { addBeer, adding: addBeerMutation.isPending, checkDuplicates, duplicates, setDuplicates, showDuplicates, setShowDuplicates, dismissDuplicates };
}