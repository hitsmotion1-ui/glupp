"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { RarityBadge } from "@/components/beer/RarityBadge";
import { useAppStore } from "@/lib/store/useAppStore";
import { beerEmoji } from "@/lib/utils/xp";
import { Swords, Trophy, TrendingUp, MessageCircle, Send, Loader2, Flag, Camera, Users, X } from "lucide-react";
import type { ActivityEntry } from "@/lib/hooks/useActivities";
import type { Rarity } from "@/types";
import { ReportModal } from "@/components/global/ReportModal"; // 👈 L'import de la modale
import { useProfile } from "@/lib/hooks/useProfile";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  const weeks = Math.floor(days / 7);
  return `${weeks}sem`;
}

function GluppContent({ activity }: { activity: ActivityEntry }) {
  const openBeerModal = useAppStore((s) => s.openBeerModal);
  const meta = activity.metadata as Record<string, unknown>;
  const xp = (meta.xp as number) || 0;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        a gluppé{" "}
        {activity.beer_data ? (
          <button onClick={() => openBeerModal(activity.beer_data!.id)} className="font-semibold text-glupp-accent hover:underline">
            {beerEmoji(activity.beer_data.style)} {activity.beer_data.name}
          </button>
        ) : (<span className="font-semibold">une bière</span>)}
      </p>
      {typeof meta.bar === "string" && <p className="text-xs text-glupp-text-muted">📍 {meta.bar}</p>}
      {activity.tagged_users?.length > 0 && (
        <p className="text-xs text-glupp-text-muted">
          avec {activity.tagged_users.map((u) => u.display_name || u.username).join(", ")}
        </p>
      )}
      <div className="flex items-center gap-2">
        {activity.beer_data && <RarityBadge rarity={activity.beer_data.rarity as Rarity} />}
        {xp > 0 && <span className="text-xs font-medium text-glupp-accent">+{xp} XP</span>}
      </div>
      {activity.photo_url && (
        <button onClick={() => window.dispatchEvent(new CustomEvent('glupp-lightbox', { detail: activity.photo_url }))} className="block mt-2 rounded-glupp overflow-hidden w-full">
          <img src={activity.photo_url} alt="Photo glupp" className="w-full max-h-52 object-cover hover:opacity-90 transition-opacity" />
        </button>
      )}
    </div>
  );
}

function DuelContent({ activity }: { activity: ActivityEntry }) {
  const openBeerModal = useAppStore((s) => s.openBeerModal);
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <Swords size={14} className="inline text-glupp-accent mr-1" />
        a choisi {activity.beer_data ? (<button onClick={() => openBeerModal(activity.beer_data!.id)} className="font-semibold text-glupp-accent hover:underline">{activity.beer_data.name}</button>) : ("une bière")} en duel
      </p>
    </div>
  );
}

function DuelGroupContent({ activity }: { activity: ActivityEntry }) {
  const openBeerModal = useAppStore((s) => s.openBeerModal);
  const meta = activity.metadata as Record<string, unknown>;
  const duels = (meta.duels as Array<{
    beer_id: string;
    beer_name: string;
    beer_style: string;
    beer_country: string;
    loser_id: string;
  }>) || [];
  const totalDuels = (meta.total_duels as number) || duels.length;

  // Fetch loser beer names
  const loserIds = duels.map(d => d.loser_id).filter(Boolean);
  const { data: loserBeers = [] } = useQuery({
    queryKey: ["loser-beers", ...loserIds],
    queryFn: async () => {
      if (loserIds.length === 0) return [];
      const { data } = await supabase
        .from("beers")
        .select("id, name, style, country")
        .in("id", loserIds);
      return data || [];
    },
    enabled: loserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const loserMap = new Map(loserBeers.map((b: any) => [b.id, b]));

  return (
    <div className="space-y-2">
      <p className="text-sm text-glupp-cream">
        <Swords size={14} className="inline text-glupp-accent mr-1" />
        a fait <span className="font-semibold text-glupp-accent">{totalDuels} duel{totalDuels > 1 ? "s" : ""}</span>
      </p>
      <div className="space-y-1.5">
        {duels.map((duel, i) => {
          const loser = loserMap.get(duel.loser_id);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-glupp-bg/50 rounded-lg text-xs"
            >
              {/* Winner */}
              <button
                onClick={() => openBeerModal(duel.beer_id)}
                className="flex items-center gap-1 font-semibold text-glupp-gold hover:underline truncate flex-1 min-w-0"
              >
                <span className="text-[10px]">{beerEmoji(duel.beer_style)}</span>
                <span className="truncate">{duel.beer_name}</span>
              </button>

              {/* VS */}
              <span className="text-[9px] text-glupp-text-muted font-bold shrink-0 px-1">VS</span>

              {/* Loser */}
              {loser ? (
                <button
                  onClick={() => openBeerModal(duel.loser_id)}
                  className="flex items-center gap-1 text-glupp-text-muted hover:text-glupp-cream truncate flex-1 min-w-0 justify-end opacity-50"
                >
                  <span className="truncate">{loser.name}</span>
                  <span className="text-[10px]">{beerEmoji(loser.style)}</span>
                </button>
              ) : (
                <span className="text-glupp-text-muted opacity-40 truncate flex-1 text-right">...</span>
              )}
            </motion.div>
          );
        })}
      </div>
      {totalDuels > 5 && (
        <p className="text-[10px] text-glupp-text-muted text-center">
          + {totalDuels - 5} autre{totalDuels - 5 > 1 ? "s" : ""} duel{totalDuels - 5 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function TrophyContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <Trophy size={14} className="inline text-glupp-gold mr-1" />
        a débloqué le trophée <span className="font-semibold text-glupp-gold">{(meta.trophy_name as string) || "un trophée"}</span>
      </p>
    </div>
  );
}

function LevelUpContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <TrendingUp size={14} className="inline text-glupp-success mr-1" />
        est passé au niveau <span className="font-semibold text-glupp-gold">{String(meta.level_name || `Niveau ${Number(meta.level) || "?"}`)}</span>
      </p>
    </div>
  );
}

function CrewCheckinContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;
  const eventTitle = (meta.event_title as string) || "une sortie";
  const taggedCount = (meta.tagged_count as number) || 0;
  const taggedUserIds = (meta.tagged_user_ids as string[]) || [];

  // Fetch tagged user profiles
  const { data: taggedProfiles = [] } = useQuery({
    queryKey: ["tagged-profiles", activity.id],
    queryFn: async () => {
      if (taggedUserIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", taggedUserIds);
      return data || [];
    },
    enabled: taggedUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const taggedNames = taggedProfiles.map((p: any) => p.display_name || p.username);

  return (
    <div className="space-y-2">
      <p className="text-sm text-glupp-cream">
        <Camera size={14} className="inline text-green-400 mr-1" />
        a validé la sortie <span className="font-semibold text-glupp-accent">{eventTitle}</span>
      </p>
      {taggedNames.length > 0 && (
        <p className="text-xs text-glupp-text-muted flex items-center gap-1">
          <Users size={12} />
          avec {taggedNames.join(", ")}
        </p>
      )}
      {activity.photo_url && (
        <button onClick={() => window.dispatchEvent(new CustomEvent('glupp-lightbox', { detail: activity.photo_url }))} className="block mt-2 rounded-glupp overflow-hidden w-full text-left">
          <img src={activity.photo_url} alt="Photo de la sortie" className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity rounded-glupp" />
        </button>
      )}
    </div>
  );
}

export function ActivityItem({ activity, index = 0 }: { activity: ActivityEntry; index?: number }) {
  const queryClient = useQueryClient();
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

const { profile } = useProfile();
  const currentUserId = profile?.id;

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  // 👈 État pour la modale de signalement
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ==========================================
  // 🔌 ÉCOUTEUR TEMPS RÉEL (Spécifique à CETTE carte)
  // ==========================================
  useEffect(() => {
    const channel = supabase
      .channel(`activity-${activity.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_reactions", filter: `activity_id=eq.${activity.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reactions", activity.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_comments", filter: `activity_id=eq.${activity.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", activity.id] });
          queryClient.invalidateQueries({ queryKey: ["comments_count", activity.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activity.id, queryClient]);

  // ==========================================
  // 1. RÉACTION (Simplifiée : juste 🍻)
  // ==========================================
  const { data: reactionsData = [] } = useQuery({
    queryKey: ["reactions", activity.id],
    queryFn: async () => {
      const { data } = await supabase.from("activity_reactions").select("user_id").eq("activity_id", activity.id).eq("emoji", "🍻");
      return data || [];
    }
  });

  const hasReacted = reactionsData.some((r) => r.user_id === currentUserId);
  const reactionCount = reactionsData.length;

  const toggleReactionMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Non connecté");
      if (hasReacted) {
        await supabase.from("activity_reactions").delete().match({ activity_id: activity.id, user_id: currentUserId, emoji: "🍻" });
      } else {
        await supabase.from("activity_reactions").insert({ activity_id: activity.id, user_id: currentUserId, emoji: "🍻" });
      }
    },
    onMutate: () => {
      queryClient.setQueryData(["reactions", activity.id], (old: any) => {
        if (!old) return [];
        if (hasReacted) return old.filter((r: any) => r.user_id !== currentUserId);
        return [...old, { user_id: currentUserId }];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", activity.id] });
    }
  });

  // ==========================================
  // 2. COMMENTAIRES
  // ==========================================
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", activity.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_comments")
        .select("id, content, created_at, user_id, profiles(username, display_name)")
        .eq("activity_id", activity.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: showCommentInput
  });

  const { data: commentsCount = 0 } = useQuery({
    queryKey: ["comments_count", activity.id],
    queryFn: async () => {
      const { count } = await supabase.from("activity_comments").select("*", { count: "exact", head: true }).eq("activity_id", activity.id);
      return count || 0;
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!currentUserId) throw new Error("Non connecté");
      const { error } = await supabase.from("activity_comments").insert({ activity_id: activity.id, user_id: currentUserId, content: text });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
    }
  });

  const content = useMemo(() => {
    switch (activity.activity_type) {
      case "glupp": return <GluppContent activity={activity} />;
      case "duel": return <DuelContent activity={activity} />;
      case "duel_group": return <DuelGroupContent activity={activity} />;
      case "trophy": return <TrophyContent activity={activity} />;
      case "level_up": return <LevelUpContent activity={activity} />;
      case "crew_event_checkin": return <CrewCheckinContent activity={activity} />;
      default: return <p className="text-sm text-glupp-text-muted">Activité {activity.activity_type}</p>;
    }
  }, [activity]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
        className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-xl space-y-3 relative"
      >
        <div className="flex gap-3">
          <button onClick={() => openUserProfileModal(activity.user_id)} className="shrink-0 mt-1">
            <Avatar url={activity.user_data.avatar_url} name={activity.user_data.display_name || activity.user_data.username} size="sm" />
          </button>
          
          {/* Contenu et Header */}
          <div className="flex-1 min-w-0 pr-6"> {/* 👈 Ajout du pr-6 pour laisser la place au bouton */}
            <div className="flex items-baseline gap-2 mb-1">
              <button onClick={() => openUserProfileModal(activity.user_id)} className="font-semibold text-sm text-glupp-cream hover:text-glupp-accent transition-colors truncate">
                {activity.user_data.display_name || activity.user_data.username}
              </button>
              <span className="text-[10px] text-glupp-text-muted shrink-0">{timeAgo(activity.created_at)}</span>
            </div>
            {content}
          </div>

          {/* 👈 Le bouton Signaler, positionné en haut à droite absolu */}
          {currentUserId !== activity.user_id && ( // On empêche de se signaler soi-même
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="absolute top-4 right-4 p-1.5 text-glupp-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
              title="Signaler ce Glupp"
            >
              <Flag size={14} />
            </button>
          )}
        </div>

        <div className="pt-3 mt-2 border-t border-glupp-border/50 flex flex-wrap items-center gap-3">
          
          {/* BOUTON 🍻 UNIQUE */}
          <button 
            onClick={() => toggleReactionMutation.mutate()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              hasReacted ? "bg-glupp-gold/20 text-glupp-gold border border-glupp-gold/30" : "bg-glupp-bg border border-glupp-border text-glupp-text-muted hover:text-glupp-cream"
            }`}
          >
            <motion.div animate={hasReacted ? { y: [0, -12, 0], rotate: [0, -15, 10, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }} className="origin-bottom-right">
              🍻
            </motion.div>
            {reactionCount > 0 && <span>{reactionCount}</span>}
          </button>

          {/* BOUTON COMMENTAIRE */}
          <button 
            onClick={() => setShowCommentInput(!showCommentInput)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ml-auto ${
              showCommentInput || commentsCount > 0 ? "text-glupp-accent" : "text-glupp-text-muted hover:text-glupp-cream"
            }`}
          >
            <MessageCircle size={14} />
            <span>{commentsCount > 0 ? commentsCount : "Commenter"}</span>
          </button>
        </div>

        <AnimatePresence>
          {showCommentInput && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3">
                {commentsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-glupp-accent" size={16} /></div>
                ) : comments.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {comments.map((c: any) => (
                      <div key={c.id} className="bg-glupp-bg/50 rounded-lg p-2.5 text-xs flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-semibold text-glupp-accent">{c.profiles?.display_name || c.profiles?.username || "Glupper"}</span>
                          <span className="text-[9px] text-glupp-text-muted">{timeAgo(c.created_at)}</span>
                        </div>
                        <span className="text-glupp-cream">{c.content}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    type="text" placeholder="Ajouter un commentaire..." value={commentText}
                    onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCommentMutation.mutate(commentText)}
                    className="flex-1 bg-glupp-bg border border-glupp-border rounded-full px-4 py-1.5 text-xs text-glupp-cream focus:outline-none focus:border-glupp-accent"
                  />
                  <button 
                    onClick={() => addCommentMutation.mutate(commentText)} 
                    disabled={!commentText.trim() || addCommentMutation.isPending} 
                    className="p-1.5 rounded-full bg-glupp-accent text-white disabled:opacity-50 transition-opacity"
                  >
                    {addCommentMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 👈 L'intégration de la modale */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activityId={activity.id}
        reportedUserId={activity.user_id}
      />

      {/* Lightbox photo */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button 
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full z-10"
          >
            <X size={24} />
          </button>
          <img 
            src={lightboxUrl} 
            alt="Photo" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}