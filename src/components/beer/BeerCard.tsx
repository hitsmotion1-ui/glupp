"use client";

import type { Beer } from "@/types";
import { beerEmoji, RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";
import { RarityBadge } from "./RarityBadge";
import { Lock } from "lucide-react";

interface BeerCardProps {
  beer: Beer;
  tasted: boolean;
  onClick: () => void;
}

export function BeerCard({ beer, tasted, onClick }: BeerCardProps) {
  const rarityColor = RARITY_CONFIG[beer.rarity as Rarity]?.color;

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-3 rounded-glupp-lg border transition-all text-center ${
        tasted
          ? "bg-glupp-card border-glupp-border hover:border-glupp-text-muted active:scale-[0.97]"
          : "bg-glupp-card/40 border-glupp-border/40 hover:bg-glupp-card/60"
      }`}
      style={
        tasted && rarityColor
          ? { backgroundColor: `${rarityColor}12` }
          : undefined
      }
    >
      {/* Emoji */}
      <span className={`text-3xl mb-2 ${!tasted ? "grayscale opacity-40" : ""}`}>
        {beerEmoji(beer.style)}
      </span>

      {/* Name — always visible now */}
      <p
        className={`text-xs font-semibold leading-tight line-clamp-2 mb-1 ${
          tasted ? "text-glupp-cream" : "text-glupp-text-muted"
        }`}
      >
        {beer.name}
      </p>

      {/* Brewery — hidden for untasted */}
      <p className="text-[10px] text-glupp-text-muted leading-tight line-clamp-1 mb-2">
        {tasted ? beer.brewery : "???"}
      </p>

      {/* Country + Rarity — rarity always visible, country only when tasted */}
      <div className="flex items-center gap-1">
        {tasted && <span className="text-xs">{beer.country}</span>}
        <RarityBadge rarity={beer.rarity} />
      </div>

      {/* Lock overlay for untasted — smaller, bottom-right */}
      {!tasted && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-glupp-bg/80 flex items-center justify-center">
            <Lock size={10} className="text-glupp-text-muted" />
          </div>
        </div>
      )}
    </button>
  );
}
