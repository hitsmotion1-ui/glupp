"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Beer } from "@/types";
import { beerEmoji, formatNumber } from "@/lib/utils/xp";
import { RarityBadge } from "./RarityBadge";

interface DuelCardsProps {
  beerA: Beer;
  beerB: Beer;
  onSelect: (winnerId: string) => void;
  disabled: boolean;
  winnerId?: string | null;
  eloDeltas?: { a: number; b: number } | null;
}

export function DuelCards({
  beerA,
  beerB,
  onSelect,
  disabled,
  winnerId: externalWinnerId,
  eloDeltas,
}: DuelCardsProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const selected = externalWinnerId || localSelected;

  const handleSelect = (id: string) => {
    if (disabled || selected) return;
    setLocalSelected(id);
    onSelect(id);
  };

  // Reset local selected when new pair arrives
  const pairKey = `${beerA.id}-${beerB.id}`;

  const renderCard = (beer: Beer, side: "a" | "b") => {
    const isWinner = selected === beer.id;
    const isLoser = selected && selected !== beer.id;
    const delta = eloDeltas ? eloDeltas[side] : null;

    return (
      <motion.button
        key={beer.id}
        onClick={() => handleSelect(beer.id)}
        disabled={disabled || !!selected}
        animate={{
          scale: isWinner ? 1.05 : isLoser ? 0.92 : 1,
          opacity: isLoser ? 0.35 : 1,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`flex-1 bg-glupp-card rounded-glupp-xl p-4 flex flex-col items-center text-center transition-all active:scale-[0.97] disabled:cursor-default ${
          isWinner
            ? "border-2 border-glupp-gold shadow-lg shadow-glupp-gold/20"
            : "border border-glupp-border hover:border-glupp-accent/50"
        } ${isLoser ? "blur-[1px]" : ""}`}
      >
        {/* Emoji */}
        <span className="text-6xl mb-3">{beerEmoji(beer.style)}</span>

        {/* Name */}
        <p className="font-display font-semibold text-glupp-cream text-sm leading-tight mb-1 line-clamp-2">
          {beer.name}
        </p>

        {/* Brewery */}
        <p className="text-xs text-glupp-text-muted mb-2 line-clamp-1">
          {beer.brewery}
        </p>

        {/* Country + Style */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm">{beer.country}</span>
          <span className="text-[10px] text-glupp-text-muted">
            {beer.style}
          </span>
        </div>

        {/* ABV + ELO */}
        <div className="flex items-center gap-3 text-xs text-glupp-text-soft mb-2">
          {beer.abv && <span>{beer.abv}%</span>}
          <span className="font-mono text-glupp-gold">
            {formatNumber(beer.elo)}
          </span>
        </div>

        {/* Rarity */}
        <RarityBadge rarity={beer.rarity} />

        {/* Winner / Loser indicator with ELO delta */}
        <AnimatePresence>
          {isWinner && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3 flex flex-col items-center gap-1"
            >
              <span className="text-glupp-gold font-display font-bold text-sm">
                Victoire !
              </span>
              {delta !== null && delta !== 0 && (
                <motion.span
                  initial={{ y: -5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-mono text-glupp-success"
                >
                  ELO +{delta}
                </motion.span>
              )}
            </motion.div>
          )}
          {isLoser && delta !== null && delta !== 0 && (
            <motion.div
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 0.6 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-xs font-mono text-glupp-error"
            >
              ELO {delta}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pairKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative flex gap-3 px-4"
      >
        {renderCard(beerA, "a")}

        {/* VS badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-10 h-10 rounded-full bg-glupp-bg border-2 border-glupp-accent flex items-center justify-center shadow-lg">
            <span className="text-xs font-bold text-glupp-accent">VS</span>
          </div>
        </div>

        {renderCard(beerB, "b")}
      </motion.div>
    </AnimatePresence>
  );
}
