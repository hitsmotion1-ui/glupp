"use client";

import type { Beer } from "@/types";
import { beerEmoji, formatNumber } from "@/lib/utils/xp";
import { RarityBadge } from "./RarityBadge";

interface BeerRowProps {
  beer: Beer;
  rank: number;
  onClick: () => void;
}

const MEDALS: Record<number, string> = {
  1: "\u{1F947}",
  2: "\u{1F948}",
  3: "\u{1F949}",
};

export function BeerRow({ beer, rank, onClick }: BeerRowProps) {
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-glupp-border/50 text-left ${
        isTop3
          ? "bg-glupp-warm/15 hover:bg-glupp-warm/25"
          : "hover:bg-glupp-card/50 active:bg-glupp-card"
      }`}
    >
      {/* Rank */}
      <span
        className={`w-8 text-center font-display font-bold text-sm ${
          rank === 1
            ? "text-glupp-gold"
            : rank === 2
            ? "text-glupp-text-soft"
            : rank === 3
            ? "text-glupp-accent"
            : "text-glupp-text-muted"
        }`}
      >
        {MEDALS[rank] || `#${rank}`}
      </span>

      {/* Emoji */}
      <span className="text-xl">{beerEmoji(beer.style)}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-glupp-cream truncate">
          {beer.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-glupp-text-muted truncate">
            {beer.brewery}
          </span>
          <RarityBadge rarity={beer.rarity} />
        </div>
      </div>

      {/* Country */}
      <span className="text-sm">{beer.country}</span>

      {/* ELO */}
      <span className="text-sm font-mono font-semibold text-glupp-gold w-12 text-right">
        {formatNumber(beer.elo)}
      </span>
    </button>
  );
}
