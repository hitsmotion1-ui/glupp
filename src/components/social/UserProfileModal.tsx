"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import { queryKeys } from "@/lib/queries/queryKeys";
import { supabase } from "@/lib/supabase/client";
import { getLevel, getNextLevel, getLevelProgress, formatNumber } from "@/lib/utils/xp";
import {
  Beer,
  Swords,
  Camera,
  Trophy,
  Calendar,
  ArrowLeftRight,
  Sparkles,
  User,
} from "lucide-react";
import type { Rarity } from "@/types";

const RARITY_CONFIG: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Commune", color: "#8D7C6C" },
  rare: { label: "Rare", color: "#4ECDC4" },
  epic: { label: "Épique", color: "#A78BFA" },
  legendary: { label: "Légendaire", color: "#F0C460" },
};

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  beers_tasted: number;
  duels_played: number;
  photos_taken: number;
  created_at: string;
}

interface CollectionComparison {
  common: number;
  onlyMe: number;
  onlyThem: number;
  commonBeers: Array<{
    id: string;
    name: string;
    brewery: string;
    rarity: Rarity;
  }>;
}

export function UserProfileModal() {
  const selectedUserId = useAppStore((s) => s.selectedUserId);
  const closeUserProfileModal = useAppStore((s) => s.closeUserProfileModal);
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  // Fetch user profile
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: queryKeys.profile.user(selectedUserId || ""),
    queryFn: async () => {
      if (!selectedUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", selectedUserId)
        .single();

      if (error) {
        console.error("profile fetch error:", error.message);
        return null;
      }
      return data as UserProfile;
    },
    enabled: !!selectedUserId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user trophies count
  const { data: trophyCount = 0 } = useQuery({
    queryKey: [...queryKeys.trophies.user(selectedUserId || ""), "count"],
    queryFn: async () => {
      if (!selectedUserId) return 0;
      const { count, error } = await supabase
        .from("user_trophies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", selectedUserId)
        .eq("completed", true);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!selectedUserId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch collection comparison
  const { data: comparison, isLoading: loadingComparison } = useQuery({
    queryKey: ["comparison", selectedUserId],
    queryFn: async (): Promise<CollectionComparison | null> => {
      if (!selectedUserId) return null;

      const {
        data: { user: me },
      } = await supabase.auth.getUser();
      if (!me) return null;

      // My beer IDs
      const { data: myBeers } = await supabase
        .from("user_beers")
        .select("beer_id")
        .eq("user_id", me.id);

      // Their beer IDs
      const { data: theirBeers } = await supabase
        .from("user_beers")
        .select("beer_id")
        .eq("user_id", selectedUserId);

      if (!myBeers || !theirBeers) return null;

      const mySet = new Set(myBeers.map((b) => b.beer_id));
      const theirSet = new Set(theirBeers.map((b) => b.beer_id));

      const commonIds = [...mySet].filter((id) => theirSet.has(id));
      const onlyMeCount = [...mySet].filter((id) => !theirSet.has(id)).length;
      const onlyThemCount = [...theirSet].filter((id) => !mySet.has(id)).length;

      // Fetch details for common beers (max 10 for display)
      let commonBeers: CollectionComparison["commonBeers"] = [];
      if (commonIds.length > 0) {
        const { data } = await supabase
          .from("beers")
          .select("id, name, brewery, rarity")
          .in("id", commonIds.slice(0, 10));

        commonBeers = (data || []) as CollectionComparison["commonBeers"];
      }

      return {
        common: commonIds.length,
        onlyMe: onlyMeCount,
        onlyThem: onlyThemCount,
        commonBeers,
      };
    },
    enabled: !!selectedUserId,
    staleTime: 5 * 60 * 1000,
  });

  const level = profile ? getLevel(profile.xp) : null;
  const nextLevel = profile ? getNextLevel(profile.xp) : null;
  const levelProgress = profile ? getLevelProgress(profile.xp) : 0;

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Modal isOpen={!!selectedUserId} onClose={closeUserProfileModal}>
      {loadingProfile ? (
        <div className="space-y-4 pb-4">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      ) : !profile ? (
        <div className="text-center py-8">
          <User className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" />
          <p className="text-sm text-glupp-text-muted">Profil introuvable</p>
        </div>
      ) : (
        <div className="space-y-5 pb-4">
          {/* Header — Avatar + Name + Level */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <Avatar
              url={profile.avatar_url}
              name={profile.display_name || profile.username}
              size="lg"
            />
            <h2 className="font-display text-xl font-bold text-glupp-cream mt-3">
              {profile.display_name || profile.username}
            </h2>
            <p className="text-sm text-glupp-text-muted">
              @{profile.username}
            </p>

            {/* Level badge */}
            {level && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{level.icon}</span>
                <span className="text-sm font-semibold text-glupp-accent">
                  {level.title}
                </span>
              </div>
            )}

            {/* XP bar */}
            {nextLevel && (
              <div className="w-48 mt-2">
                <ProgressBar
                  value={levelProgress}
                  height={4}
                  color="#E08840"
                  subLabel={`${formatNumber(profile.xp)} / ${formatNumber(nextLevel.min)} XP`}
                />
              </div>
            )}
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-2"
          >
            <StatCard
              icon={<Beer size={16} className="text-glupp-accent" />}
              value={profile.beers_tasted}
              label="Bières"
            />
            <StatCard
              icon={<Swords size={16} className="text-glupp-rarity-rare" />}
              value={profile.duels_played}
              label="Duels"
            />
            <StatCard
              icon={<Camera size={16} className="text-glupp-rarity-epic" />}
              value={profile.photos_taken}
              label="Photos"
            />
            <StatCard
              icon={<Trophy size={16} className="text-glupp-gold" />}
              value={trophyCount}
              label="Trophées"
            />
          </motion.div>

          {/* Member since */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-glupp-text-muted">
            <Calendar size={12} />
            <span>Membre depuis {memberSince}</span>
          </div>

          {/* ═══ Collection Comparison ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-glupp-accent" />
              <h3 className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider">
                Comparaison des collections
              </h3>
            </div>

            {loadingComparison ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : comparison ? (
              <div className="space-y-3">
                {/* Venn-like stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
                    <p className="font-display font-bold text-lg text-glupp-accent">
                      {comparison.common}
                    </p>
                    <p className="text-[10px] text-glupp-text-muted leading-tight">
                      En commun
                    </p>
                  </div>
                  <div className="text-center p-3 bg-glupp-success/10 border border-glupp-success/20 rounded-glupp">
                    <p className="font-display font-bold text-lg text-glupp-success">
                      {comparison.onlyMe}
                    </p>
                    <p className="text-[10px] text-glupp-text-muted leading-tight">
                      Toi seul
                    </p>
                  </div>
                  <div className="text-center p-3 bg-glupp-rarity-epic/10 border border-glupp-rarity-epic/20 rounded-glupp">
                    <p className="font-display font-bold text-lg text-glupp-rarity-epic">
                      {comparison.onlyThem}
                    </p>
                    <p className="text-[10px] text-glupp-text-muted leading-tight">
                      {profile.display_name || profile.username} seul
                    </p>
                  </div>
                </div>

                {/* Common beers list */}
                {comparison.commonBeers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-glupp-gold" />
                      <p className="text-xs text-glupp-text-soft font-medium">
                        Bières en commun
                      </p>
                    </div>
                    <div className="space-y-1">
                      {comparison.commonBeers.map((beer) => (
                        <button
                          key={beer.id}
                          onClick={() => {
                            openBeerModal(beer.id);
                            closeUserProfileModal();
                          }}
                          className="w-full flex items-center gap-2 p-2 bg-glupp-card-alt rounded-glupp hover:bg-glupp-card-alt/80 transition-colors text-left"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                RARITY_CONFIG[beer.rarity]?.color || "#8D7C6C",
                            }}
                          />
                          <span className="text-xs text-glupp-cream truncate flex-1">
                            {beer.name}
                          </span>
                          <span className="text-[10px] text-glupp-text-muted shrink-0">
                            {beer.brewery}
                          </span>
                        </button>
                      ))}
                    </div>
                    {comparison.common > comparison.commonBeers.length && (
                      <p className="text-[10px] text-glupp-text-muted text-center">
                        +{comparison.common - comparison.commonBeers.length}{" "}
                        autres bières en commun
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-glupp-text-muted text-center py-4">
                Comparaison indisponible
              </p>
            )}
          </motion.div>
        </div>
      )}
    </Modal>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-glupp-card border border-glupp-border rounded-glupp">
      {icon}
      <span className="font-display font-bold text-sm text-glupp-cream">
        {formatNumber(value)}
      </span>
      <span className="text-[10px] text-glupp-text-muted">{label}</span>
    </div>
  );
}
