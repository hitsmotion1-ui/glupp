"use client";

import { useGluppOfWeek } from "@/lib/hooks/useGluppOfWeek";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "@/components/beer/RarityBadge";
import { motion } from "framer-motion";
import { Flame, Clock, Check, Users, Sparkles, ChevronRight } from "lucide-react";
import { beerEmoji, RARITY_CONFIG } from "@/lib/utils/xp";
import type { Rarity } from "@/types";

export function GluppOfWeekBanner() {
  const { gotw, hasParticipated, daysLeft, loading } = useGluppOfWeek();
  const openGluppModal = useAppStore((s) => s.openGluppModal);
  const openBeerModal = useAppStore((s) => s.openBeerModal);

  if (loading || !gotw) return null;

  const beer = gotw.beer;
  const rarityConfig = RARITY_CONFIG[beer.rarity as Rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card
        className="p-4 relative overflow-hidden border-glupp-gold/30 bg-gradient-to-br from-glupp-card to-glupp-gold/5 cursor-pointer"
        onClick={() =>
          hasParticipated
            ? openBeerModal(beer.id)
            : openGluppModal(beer.id)
        }
      >
        {/* Glow effect */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-glupp-gold/10 blur-xl" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-3 relative">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-glupp-gold/15 rounded-full">
            <Flame size={12} className="text-glupp-gold" />
            <span className="text-[10px] font-bold text-glupp-gold uppercase tracking-wider">
              Glupp of the Week
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-glupp-card-alt rounded-full">
            <Clock size={10} className="text-glupp-text-muted" />
            <span className="text-[10px] text-glupp-text-muted">
              {daysLeft}j restant{daysLeft > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Beer info */}
        <div className="flex items-center gap-3 relative">
          {/* Emoji */}
          <div className="w-12 h-12 rounded-glupp bg-glupp-gold/10 flex items-center justify-center text-2xl shrink-0">
            {beerEmoji(beer.style)}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-glupp-cream text-sm truncate">
              {beer.name}
            </h3>
            <p className="text-xs text-glupp-text-muted truncate">
              {beer.brewery} {beer.country}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <RarityBadge rarity={beer.rarity as Rarity} />
              <span className="text-[10px] text-glupp-gold font-medium">
                +{gotw.bonus_xp} XP bonus
              </span>
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0">
            {hasParticipated ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 rounded-full">
                <Check size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">
                  Fait !
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-glupp-accent/15 rounded-full">
                <Sparkles size={14} className="text-glupp-accent" />
                <span className="text-xs text-glupp-accent font-medium">
                  Participer
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Participants count */}
        {gotw.participants > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-glupp-border/30">
            <Users size={12} className="text-glupp-text-muted" />
            <span className="text-[10px] text-glupp-text-muted">
              {gotw.participants} participant{gotw.participants > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
