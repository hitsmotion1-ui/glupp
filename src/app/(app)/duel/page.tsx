"use client";

import { useDuel } from "@/lib/hooks/useDuel";
import { DuelCards } from "@/components/beer/DuelCards";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Swords, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DuelPage() {
  const {
    beerA,
    beerB,
    loading,
    submitting,
    canDuel,
    generatePair,
    submitVote,
    refreshTasted,
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
        <Swords size={48} className="text-glupp-text-muted mb-4" />
        <h2 className="font-display text-xl font-bold text-glupp-cream mb-2">
          Pas encore pret pour le duel !
        </h2>
        <p className="text-glupp-text-soft text-sm mb-6 max-w-xs">
          Tu dois d&apos;abord gouter au moins 2 bieres.
          Va dans ta collection pour ajouter tes premieres bieres.
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
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="font-display text-xl font-bold text-glupp-cream">
          Laquelle tu preferes ?
        </h2>
        <p className="text-xs text-glupp-text-muted mt-1">
          Choisis ta biere preferee
        </p>
      </div>

      {/* Duel Cards */}
      {beerA && beerB && (
        <DuelCards
          beerA={beerA}
          beerB={beerB}
          onSelect={submitVote}
          disabled={submitting}
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

    </div>
  );
}
