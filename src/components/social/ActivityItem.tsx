"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { RarityBadge } from "@/components/beer/RarityBadge";
import { useAppStore } from "@/lib/store/useAppStore";
import { beerEmoji } from "@/lib/utils/xp";
import { Swords, Trophy, TrendingUp, MessageCircle, Send, Plus, Loader2 } from "lucide-react";
import type { ActivityEntry } from "@/lib/hooks/useActivities";
import type { Rarity } from "@/types";

// --- Helpers pour le texte ---
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

// --- Sous-composants d'affichage ---
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

const QUICK_EMOJIS = ["🔥", "🤤", "😍", "🤮", "👑", "🚀"];

export function ActivityItem({ activity, index = 0 }: { activity: ActivityEntry; index?: number }) {
  const queryClient = useQueryClient();
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  // ID de l'utilisateur connecté
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  // UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");

  // ==========================================
  // 1. GESTION DES RÉACTIONS (Base de données)
  // ==========================================
  const { data: rawReactions = [] } = useQuery({
    queryKey: ["reactions", activity.id],
    queryFn: async () => {
      const { data } = await supabase.from("activity_reactions").select("emoji, user_id").eq("activity_id", activity.id);
      return data || [];
    }
  });

  const reactions = useMemo(() => {
    const acc: Record<string, { count: number; reacted: boolean }> = {};
    rawReactions.forEach((r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, reacted: false };
      acc[r.emoji].count += 1;
      if (r.user_id === currentUserId) acc[r.emoji].reacted = true;
    });
    return acc;
  }, [rawReactions, currentUserId]);

  const toggleReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!currentUserId) throw new Error("Non connecté");
      const isReacted = reactions[emoji]?.reacted;
      
      if (isReacted) {
        await supabase.from("activity_reactions").delete().match({ activity_id: activity.id, user_id: currentUserId, emoji });
      } else {
        await supabase.from("activity_reactions").insert({ activity_id: activity.id, user_id: currentUserId, emoji });
      }
    },
    onMutate: async (emoji) => {
      // Optimistic Update : L'UI change instantanément avant la réponse du serveur
      setShowEmojiPicker(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", activity.id] });
    }
  });

  // ==========================================
  // 2. GESTION DES COMMENTAIRES (Base de données)
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
    enabled: showCommentInput // ⚡ Ne télécharge les commentaires que si l'utilisateur ouvre la zone !
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
      queryClient.invalidateQueries({ queryKey: ["comments", activity.id] });
      queryClient.invalidateQueries({ queryKey: ["comments_count", activity.id] });
    }
  });


  // ==========================================
  // RENDU VISUEL
  // ==========================================
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
        
        {/* BOUTON PRINCIPAL 🍻 */}
        <button 
          onClick={() => toggleReactionMutation.mutate("🍻")}
          disabled={toggleReactionMutation.isPending}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
            reactions["🍻"]?.reacted ? "bg-glupp-gold/20 text-glupp-gold border border-glupp-gold/30" : "bg-glupp-bg border border-glupp-border text-glupp-text-muted hover:text-glupp-cream"
          }`}
        >
          <motion.div animate={reactions["🍻"]?.reacted ? { y: [0, -12, 0], rotate: [0, -15, 10, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }} className="text-sm origin-bottom-right">
            🍻
          </motion.div>
          {reactions["🍻"]?.count > 0 && <span>{reactions["🍻"].count}</span>}
        </button>

        {/* AUTRES RÉACTIONS */}
        {Object.entries(reactions).map(([emoji, data]) => {
          if (emoji === "🍻") return null;
          return (
            <button 
              key={emoji} onClick={() => toggleReactionMutation.mutate(emoji)} disabled={toggleReactionMutation.isPending}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                data.reacted ? "bg-glupp-accent/20 text-glupp-accent border border-glupp-accent/30" : "bg-glupp-bg border border-glupp-border text-glupp-text-muted"
              }`}
            >
              <span>{emoji}</span><span>{data.count}</span>
            </button>
          );
        })}

        {/* AJOUTER UN EMOJI */}
        <div className="relative">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 rounded-full text-glupp-text-muted hover:bg-glupp-bg hover:text-glupp-cream transition-colors">
            <Plus size={14} />
          </button>
         <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.8 }} 
                /* 🆕 FIX UI : On aligne à gauche, on donne une largeur fixe (w-44) et on fait passer à la ligne (flex-wrap) */
                className="absolute z-50 bottom-full mb-2 left-0 bg-glupp-card border border-glupp-border rounded-xl p-2.5 flex flex-wrap gap-3 shadow-xl w-44 origin-bottom-left"
              >
                {QUICK_EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => toggleReactionMutation.mutate(emoji)} 
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

      {/* ZONE DE COMMENTAIRES */}
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