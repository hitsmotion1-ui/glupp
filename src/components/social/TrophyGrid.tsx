"use client";

import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTrophies } from "@/lib/hooks/useTrophies";
import { Trophy, Lock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  collection: "Collection",
  style: "Styles",
  region: "Pays & Régions",
  rarity: "Rareté",
  social: "Social",
  photos: "Photos",
};

export function TrophyGrid() {
  const { trophies, byCategory, stats, isLoading } = useTrophies();
  const openTrophyModal = useAppStore((s) => s.openTrophyModal);

  if (isLoading) {
    return (
      <div className="px-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (trophies.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Trophy className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" />
        <p className="text-sm text-glupp-text-muted">
          Les trophées arrivent bientôt !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      {/* Stats header */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-glupp-gold" />
          <span className="font-display font-bold text-glupp-cream">
            {stats.unlocked}/{stats.total}
          </span>
        </div>
        <div className="flex-1">
          <ProgressBar
            value={stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}
            color="#DCB04C"
            height={6}
          />
        </div>
      </div>

      {/* By category */}
      {Object.entries(byCategory).map(([category, categoryTrophies]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[category] || category}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {categoryTrophies.map((trophy, i) => (
              <motion.button
                key={trophy.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openTrophyModal(trophy.id)}
                className={`relative p-4 rounded-glupp-lg border text-center transition-all ${
                  trophy.completed
                    ? "bg-glupp-gold/10 border-glupp-gold/40"
                    : "bg-glupp-card border-glupp-border hover:border-glupp-accent/30"
                }`}
              >
                {/* Emoji */}
                <div
                  className={`text-3xl mb-2 ${
                    trophy.completed ? "" : trophy.progress > 0 ? "opacity-70" : "opacity-40 grayscale"
                  }`}
                >
                  {trophy.emoji}
                </div>

                {/* Name */}
                <h4
                  className={`font-semibold text-xs leading-tight mb-2 ${
                    trophy.completed
                      ? "text-glupp-gold"
                      : "text-glupp-cream"
                  }`}
                >
                  {trophy.name}
                </h4>

                {/* Progress or completed */}
                {trophy.completed ? (
                  <div className="flex items-center justify-center gap-1">
                    <Trophy size={12} className="text-glupp-gold" />
                    <span className="text-[10px] font-medium text-glupp-gold">
                      Débloqué
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <ProgressBar
                      value={trophy.percentage}
                      height={4}
                      color={trophy.progress > 0 ? "#E08840" : "#6B6050"}
                    />
                    <p className="text-[10px] text-glupp-text-muted">
                      {trophy.progress}/{trophy.target}
                    </p>
                  </div>
                )}

                {/* Lock overlay for 0 progress */}
                {trophy.progress === 0 && !trophy.completed && (
                  <div className="absolute top-2 right-2">
                    <Lock size={10} className="text-glupp-text-muted" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
