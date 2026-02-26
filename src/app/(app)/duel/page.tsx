"use client";

import { useDuel } from "@/lib/hooks/useDuel";
import { DuelCards } from "@/components/beer/DuelCards";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Swords, ArrowRight, Beer, Flame } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DuelPage() {
  const {
    beerA,
    beerB,
    loading,
    submitting,
    canDuel,
    duelCount,
    tastedCount,
    winnerId,
    eloDeltas,
    generatePair,
    submitVote,
  } = useDuel();

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-72" />
          <Skeleton className="flex-1 h-72" />
        </div>
      </div>
    );
  }

  if (!canDuel) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Swords size={56} className="text-glupp-accent mb-4" />
        </motion.div>
        <h2 className="font-display text-xl font-bold text-glupp-cream mb-2">
          L&apos;arene t&apos;attend !
        </h2>
        <p className="text-glupp-text-soft text-sm mb-6 max-w-xs">
          Tu dois d&apos;abord gouter au moins 2 bieres pour lancer des duels.
          Va glupper tes premieres bieres !
        </p>
        <Link href="/collection">
          <Button variant="primary" size="lg">
            Voir la Collection
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header with stats */}
      <div className="text-center mb-6">
        <h2 className="font-display text-xl font-bold text-glupp-cream">
          Laquelle tu preferes ?
        </h2>
        <p className="text-xs text-glupp-text-muted mt-1">
          Choisis ta biere preferee pour mettre a jour le classement
        </p>

        {/* Session counter */}
        {duelCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mt-3"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-glupp-accent/10 text-glupp-accent text-xs font-medium">
              <Swords size={12} />
              {duelCount} duel{duelCount > 1 ? "s" : ""}
            </div>
            {duelCount >= 3 && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-glupp-gold/10 text-glupp-gold text-xs font-medium">
                <Flame size={12} />
                En feu !
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Duel Cards */}
      {beerA && beerB && (
        <DuelCards
          beerA={beerA}
          beerB={beerB}
          onSelect={submitVote}
          disabled={submitting}
          winnerId={winnerId}
          eloDeltas={eloDeltas}
        />
      )}

      {/* Skip button */}
      <div className="text-center mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={generatePair}
          disabled={submitting}
        >
          Passer
        </Button>
      </div>

      {/* Pool info + suggestion */}
      <div className="mt-8 mx-4 p-3 bg-glupp-card-alt border border-glupp-border rounded-glupp text-center">
        <p className="text-xs text-glupp-text-soft mb-1">
          {tastedCount} biere{tastedCount > 1 ? "s" : ""} dans ton pool de duels
        </p>
        <Link
          href="/collection"
          className="text-xs text-glupp-accent font-medium hover:underline inline-flex items-center gap-1"
        >
          <Beer size={12} />
          Gluppe de nouvelles bieres pour plus de duels !
        </Link>
      </div>
    </div>
  );
}
