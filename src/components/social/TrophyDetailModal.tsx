"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTrophies } from "@/lib/hooks/useTrophies";
import { Trophy, Lock, Sparkles, Calendar } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  collection: "Collection",
  style: "Styles",
  region: "Pays & Régions",
  rarity: "Rareté",
  social: "Social",
  photos: "Photos",
};

export function TrophyDetailModal() {
  const selectedTrophyId = useAppStore((s) => s.selectedTrophyId);
  const closeTrophyModal = useAppStore((s) => s.closeTrophyModal);
  const { trophies } = useTrophies();

  const trophy = useMemo(
    () => trophies.find((t) => t.id === selectedTrophyId) || null,
    [trophies, selectedTrophyId]
  );

  if (!trophy) {
    return (
      <Modal isOpen={!!selectedTrophyId} onClose={closeTrophyModal}>
        <div className="text-center py-8">
          <p className="text-sm text-glupp-text-muted">Trophée introuvable</p>
        </div>
      </Modal>
    );
  }

  const completedDate = trophy.completedAt
    ? new Date(trophy.completedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Modal isOpen={!!selectedTrophyId} onClose={closeTrophyModal}>
      <div className="flex flex-col items-center text-center space-y-5 pb-4">
        {/* Big emoji with glow effect */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className={`relative text-6xl ${
            trophy.completed ? "" : trophy.progress > 0 ? "opacity-70" : "opacity-40 grayscale"
          }`}
        >
          {trophy.emoji}
          {trophy.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -top-1 -right-2"
            >
              <Sparkles size={20} className="text-glupp-gold" />
            </motion.div>
          )}
        </motion.div>

        {/* Name */}
        <h2
          className={`font-display text-xl font-bold ${
            trophy.completed ? "text-glupp-gold" : "text-glupp-cream"
          }`}
        >
          {trophy.name}
        </h2>

        {/* Category badge */}
        <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-wider font-semibold bg-glupp-card-alt text-glupp-text-soft rounded-full">
          {CATEGORY_LABELS[trophy.category || ""] || trophy.category || "Autre"}
        </span>

        {/* Description */}
        {trophy.description && (
          <p className="text-sm text-glupp-text-soft leading-relaxed max-w-xs">
            {trophy.description}
          </p>
        )}

        {/* Progress section */}
        <div className="w-full max-w-xs space-y-2">
          {trophy.completed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 p-3 bg-glupp-gold/10 border border-glupp-gold/30 rounded-glupp"
            >
              <Trophy size={18} className="text-glupp-gold" />
              <span className="font-semibold text-sm text-glupp-gold">
                Trophée débloqué !
              </span>
            </motion.div>
          ) : trophy.progress > 0 ? (
            <div className="space-y-2">
              <ProgressBar
                value={trophy.percentage}
                height={8}
                color="#E08840"
                label="Progression"
                subLabel={`${trophy.progress}/${trophy.target}`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 bg-glupp-card-alt border border-glupp-border rounded-glupp">
              <Lock size={16} className="text-glupp-text-muted" />
              <span className="text-sm text-glupp-text-muted">
                Pas encore commencé
              </span>
            </div>
          )}
        </div>

        {/* Completed date */}
        {completedDate && (
          <div className="flex items-center gap-1.5 text-xs text-glupp-text-muted">
            <Calendar size={12} />
            <span>Obtenu le {completedDate}</span>
          </div>
        )}

        {/* XP Reward */}
        <div className="flex items-center gap-2 px-4 py-2 bg-glupp-accent/10 rounded-full">
          <span className="text-sm font-bold text-glupp-accent">
            +{trophy.xp_reward} XP
          </span>
          <span className="text-xs text-glupp-text-muted">récompense</span>
        </div>
      </div>
    </Modal>
  );
}
