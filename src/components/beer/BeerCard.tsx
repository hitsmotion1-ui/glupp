"use client";

import type { Beer } from "@/types";
import { beerEmoji } from "@/lib/utils/xp";
import { RarityBadge } from "./RarityBadge";
import { Lock } from "lucide-react";

interface BeerCardProps {
  beer: Beer;
  tasted: boolean;
  onClick: () => void;
}

export function BeerCard({ beer, tasted, onClick }: BeerCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-3 rounded-glupp-lg border transition-all text-center ${
        tasted
          ? "bg-glupp-card border-glupp-border hover:border-glupp-text-muted active:scale-[0.97]"
          : "bg-glupp-card/50 border-glupp-border/50 opacity-60 grayscale hover:opacity-80"
      }`}
    >
      {/* Emoji */}
      <span className="text-3xl mb-2">{beerEmoji(beer.style)}</span>

      {/* Name */}
      <p className="text-xs font-semibold text-glupp-cream leading-tight line-clamp-2 mb-1">
        {beer.name}
      </p>

      {/* Brewery */}
      <p className="text-[10px] text-glupp-text-muted leading-tight line-clamp-1 mb-2">
        {beer.brewery}
      </p>

      {/* Country + Rarity */}
      <div className="flex items-center gap-1">
        <span className="text-xs">{beer.country}</span>
        <RarityBadge rarity={beer.rarity} />
      </div>

      {/* Lock overlay for untasted */}
      {!tasted && (
        <div className="absolute inset-0 flex items-center justify-center rounded-glupp-lg">
          <Lock size={16} className="text-glupp-text-muted" />
        </div>
      )}
    </button>
  );
}
