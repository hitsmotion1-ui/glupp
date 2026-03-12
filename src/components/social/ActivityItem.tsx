"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { RarityBadge } from "@/components/beer/RarityBadge";
import { useAppStore } from "@/lib/store/useAppStore";
import { beerEmoji } from "@/lib/utils/xp";
import { Swords, Trophy, TrendingUp, MessageCircle, Send, Loader2 } from "lucide-react";
import type { ActivityEntry } from "@/lib/hooks/useActivities";
import type { Rarity } from "@/types";

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
        <a href={activity.photo_url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-glupp overflow-hidden">
          <img src={activity.photo_url} alt="Photo glupp" className="w-full max-h-52 object-cover hover:opacity-90 transition-opacity" />
        </a>
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

export function ActivityItem({ activity, index = 0 }: { activity: ActivityEntry; index?: number }) {
  const queryClient = useQueryClient();
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");

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
      // Met à jour l'UI instantanément pour l'utilisateur qui clique (Optimistic Update)
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
      case "trophy": return <TrophyContent activity={activity} />;
      case "level_up": return <LevelUpContent activity={activity} />;
      default: return <p className="text-sm text-glupp-text-muted">Activité {activity.activity_type}</p>;
    }
  }, [activity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
      className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-xl space-y-3 relative"
    >
      <div className="flex gap-3">
        <button onClick={() => openUserProfileModal(activity.user_id)} className="shrink-0 mt-1">
          <Avatar url={activity.user_data.avatar_url} name={activity.user_data.display_name || activity.user_data.username} size="sm" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <button onClick={() => openUserProfileModal(activity.user_id)} className="font-semibold text-sm text-glupp-cream hover:text-glupp-accent transition-colors truncate">
              {activity.user_data.display_name || activity.user_data.username}
            </button>
            <span className="text-[10px] text-glupp-text-muted shrink-0">{timeAgo(activity.created_at)}</span>
          </div>
          {content}
        </div>
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
  );
}