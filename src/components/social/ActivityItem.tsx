"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { RarityBadge } from "@/components/beer/RarityBadge";
import { useAppStore } from "@/lib/store/useAppStore";
import { beerEmoji } from "@/lib/utils/xp";
import { Swords, Trophy, TrendingUp, MessageCircle, Send } from "lucide-react";
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
          <button
            onClick={() => openBeerModal(activity.beer_data!.id)}
            className="font-semibold text-glupp-accent hover:underline"
          >
            {beerEmoji(activity.beer_data.style)} {activity.beer_data.name}
          </button>
        ) : (
          <span className="font-semibold">une bière</span>
        )}
      </p>

      {typeof meta.bar === "string" && (
        <p className="text-xs text-glupp-text-muted">📍 {meta.bar}</p>
      )}

      {activity.tagged_users.length > 0 && (
        <p className="text-xs text-glupp-text-muted">
          avec {activity.tagged_users.map((u) => u.display_name || u.username).join(", ")}
        </p>
      )}

      <div className="flex items-center gap-2">
        {activity.beer_data && (
          <RarityBadge rarity={activity.beer_data.rarity as Rarity} />
        )}
        {xp > 0 && (
          <span className="text-xs font-medium text-glupp-accent">+{xp} XP</span>
        )}
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
  const meta = activity.metadata as Record<string, unknown>;
  const xp = (meta.xp as number) || 0;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <Swords size={14} className="inline text-glupp-accent mr-1" />
        a choisi{" "}
        {activity.beer_data ? (
          <button onClick={() => openBeerModal(activity.beer_data!.id)} className="font-semibold text-glupp-accent hover:underline">
            {activity.beer_data.name}
          </button>
        ) : ("une bière")}{" "}
        en duel
      </p>
      {xp > 0 && <span className="text-xs font-medium text-glupp-accent">+{xp} XP</span>}
    </div>
  );
}

function TrophyContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <Trophy size={14} className="inline text-glupp-gold mr-1" />
        a débloqué le trophée{" "}
        <span className="font-semibold text-glupp-gold">{(meta.trophy_name as string) || "un trophée"}</span>
      </p>
      {typeof meta.xp === "number" && <span className="text-xs font-medium text-glupp-gold">+{meta.xp} XP</span>}
    </div>
  );
}

function LevelUpContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <TrendingUp size={14} className="inline text-glupp-success mr-1" />
        est passé au niveau{" "}
        <span className="font-semibold text-glupp-gold">
          {String(meta.level_name || `Niveau ${Number(meta.level) || "?"}`)}
        </span>{" "}
        {String(meta.level_icon || "")}
      </p>
    </div>
  );
}

// Structure temporaire pour afficher les commentaires avant d'avoir la BDD
interface Comment {
  id: number;
  author: string;
  text: string;
}

export function ActivityItem({ activity, index = 0 }: { activity: ActivityEntry; index?: number }) {
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  // 1. On initialise le compteur à 0 (Fini les chiffres aléatoires !)
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0); 
  
  // 2. États pour les commentaires
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  const content = useMemo(() => {
    switch (activity.activity_type) {
      case "glupp": return <GluppContent activity={activity} />;
      case "duel": return <DuelContent activity={activity} />;
      case "trophy": return <TrophyContent activity={activity} />;
      case "level_up": return <LevelUpContent activity={activity} />;
      default: return <p className="text-sm text-glupp-text-muted">Activité {activity.activity_type}</p>;
    }
  }, [activity]);

  const handleLike = () => {
    if (!hasLiked) {
      setHasLiked(true);
      setLikeCount(prev => prev + 1);
    } else {
      setHasLiked(false);
      setLikeCount(prev => prev - 1);
    }
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    
    // On ajoute le commentaire à notre liste locale pour le voir tout de suite
    const newComment: Comment = {
      id: Date.now(),
      author: "Moi", // Plus tard, on mettra le pseudo de l'utilisateur connecté
      text: commentText.trim()
    };
    
    setComments(prev => [...prev, newComment]);
    setCommentText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
      className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-xl space-y-3"
    >
      <div className="flex gap-3">
        <button onClick={() => openUserProfileModal(activity.user_id)} className="shrink-0 mt-1">
          <Avatar url={activity.user_data.avatar_url} name={activity.user_data.display_name || activity.user_data.username} size="sm" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <button
              onClick={() => openUserProfileModal(activity.user_id)}
              className="font-semibold text-sm text-glupp-cream hover:text-glupp-accent transition-colors truncate"
            >
              {activity.user_data.display_name || activity.user_data.username}
            </button>
            <span className="text-[10px] text-glupp-text-muted shrink-0">{timeAgo(activity.created_at)}</span>
          </div>
          {content}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-glupp-border/50 flex items-center gap-5">
        
        {/* Bouton Tchin (Like) */}
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            hasLiked ? "text-glupp-gold" : "text-glupp-text-muted hover:text-glupp-cream"
          }`}
        >
          <motion.div 
            animate={hasLiked ? { 
              y: [0, -12, 0], 
              rotate: [0, -15, 10, 0], 
              scale: [1, 1.2, 1] 
            } : {}} 
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-lg origin-bottom-right"
          >
            🍺
          </motion.div>
          {/* Affiche le chiffre si > 0, sinon "Tchin" */}
          <span>{likeCount > 0 ? likeCount : "Tchin"}</span>
        </button>

        <button 
          onClick={() => setShowCommentInput(!showCommentInput)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            showCommentInput || comments.length > 0 ? "text-glupp-accent" : "text-glupp-text-muted hover:text-glupp-cream"
          }`}
        >
          <MessageCircle size={14} />
          <span>{comments.length > 0 ? `${comments.length} commentaire${comments.length > 1 ? 's' : ''}` : "Commenter"}</span>
        </button>
      </div>

      <AnimatePresence>
        {showCommentInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {/* 🆕 Affichage des commentaires existants */}
              {comments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {comments.map(c => (
                    <div key={c.id} className="bg-glupp-bg/50 rounded-lg p-2.5 text-xs">
                      <span className="font-semibold text-glupp-accent">{c.author}</span>
                      <span className="text-glupp-text-muted mx-1">•</span>
                      <span className="text-glupp-cream">{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Champ pour écrire un nouveau commentaire */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Un petit mot sympa ?"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  className="flex-1 bg-glupp-bg border border-glupp-border rounded-full px-4 py-1.5 text-xs text-glupp-cream focus:outline-none focus:border-glupp-accent"
                />
                <button 
                  onClick={submitComment}
                  disabled={!commentText.trim()}
                  className="p-1.5 rounded-full bg-glupp-accent text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}