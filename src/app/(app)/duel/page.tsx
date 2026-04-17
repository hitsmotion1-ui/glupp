"use client";

import { useState } from "react";
import { useDuel } from "@/lib/hooks/useDuel";
import { useActivities } from "@/lib/hooks/useActivities";
import { DuelCards } from "@/components/beer/DuelCards";
import { DuelHistoryModal } from "@/components/beer/DuelHistoryModal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActivityItem } from "@/components/social/ActivityItem";
import { GluppOfWeekBanner } from "@/components/gamification/GluppOfWeekBanner";
import { Swords, ArrowRight, Beer, Flame, ChevronRight, RefreshCw, History, Trophy, Lock, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DailyChallengesWidget } from "@/components/gamification/DailyChallengesWidget";

export default function DuelPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    beerA,
    beerB,
    loading,
    submitting,
    canDuel,
    hasFinishedAllDuels,
    hasReachedDailyLimit,
    duelsRemaining,
    todayDuelCount,
    dailyLimit,
    duelCount,
    tastedCount,
    winnerId,
    eloDeltas,
    skipDuel,
    submitVote,
    duelKey,
  } = useDuel();

  const { activities, isLoading: activitiesLoading } = useActivities();
  const recentActivities = activities.slice(0, 4);

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
    <div className="py-6 pb-24">
      {/* DAILY LIMIT REACHED */}
      {hasReachedDailyLimit ? (
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <div className="relative mb-4">
              <Swords size={56} className="text-glupp-text-muted mx-auto" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-glupp-accent flex items-center justify-center">
                <Lock size={14} className="text-glupp-bg" />
              </div>
            </div>
          </motion.div>
          <h2 className="font-display text-xl font-bold text-glupp-cream mb-2">
            Duels du jour termines !
          </h2>
          <p className="text-glupp-text-soft text-sm mb-3 max-w-xs mx-auto">
            Tu as joue tes {dailyLimit} duels aujourd&apos;hui. Reviens demain pour de nouveaux affrontements !
          </p>

          {/* Progress bar visual */}
          <div className="w-full max-w-xs mx-auto mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-glupp-text-muted">{todayDuelCount}/{dailyLimit} duels</span>
              <span className="text-xs text-glupp-accent font-medium flex items-center gap-1">
                <Clock size={10} />
                Reset a minuit
              </span>
            </div>
            <div className="w-full h-2 bg-glupp-border rounded-full overflow-hidden">
              <div className="h-full bg-glupp-accent rounded-full transition-all" style={{ width: "100%" }} />
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <Link href="/collection">
              <Button variant="primary" size="lg" className="w-full">
                Explorer le Beerdex
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => setIsHistoryOpen(true)}
              className="text-glupp-text-muted hover:text-glupp-cream"
            >
              <History size={16} className="mr-2" />
              Voir mon historique
            </Button>
          </div>

          <DuelHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
          />
      </div>
      ) : hasFinishedAllDuels ? (
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <Trophy size={56} className="text-glupp-gold mb-4 mx-auto" />
          </motion.div>
          <h2 className="font-display text-xl font-bold text-glupp-cream mb-2">
            Tu as tout joue !
          </h2>
          <p className="text-glupp-text-soft text-sm mb-6 max-w-xs mx-auto">
            Tu as duele toutes les bieres de ta collection. Ajoute de nouvelles bieres pour debloquer de nouveaux affrontements !
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <Link href="/collection">
              <Button variant="primary" size="lg" className="w-full">
                Voir la Collection
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => setIsHistoryOpen(true)}
              className="text-glupp-text-muted hover:text-glupp-cream"
            >
              <History size={16} className="mr-2" />
              Voir mon historique
            </Button>
          </div>

          <DuelHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
          />
        </div>
      ) : (
        <>
          {/* Header with stats */}
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold text-glupp-cream">
              Laquelle tu preferes ?
            </h2>
            <p className="text-xs text-glupp-text-muted mt-1">
              Choisis ta biere preferee pour mettre a jour le classement
            </p>

            {/* Daily counter */}
            <div className="flex items-center justify-center gap-3 mt-3">
              {/* Duels remaining */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-glupp-card border border-glupp-border">
                <Swords size={12} className="text-glupp-accent" />
                <div className="flex gap-0.5">
                  {Array.from({ length: dailyLimit }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < todayDuelCount ? "bg-glupp-accent" : "bg-glupp-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-glupp-text-muted ml-0.5">
                  {duelsRemaining} restant{duelsRemaining > 1 ? "s" : ""}
                </span>
              </div>

              {/* Session streak */}
              {duelCount >= 2 && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-glupp-gold/10 text-glupp-gold text-xs font-medium">
                  <Flame size={12} />
                  En feu !
                </div>
              )}
            </div>
          </div>

          {/* Duel Cards */}
          {beerA && beerB && (
            <DuelCards
              beerA={beerA}
              beerB={beerB}
              onSelect={submitVote}
              disabled={submitting || hasReachedDailyLimit}
              winnerId={winnerId}
              eloDeltas={eloDeltas}
              duelKey={duelKey}
            />
          )}

          {/* Boutons Passer & Historique */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipDuel}
              disabled={submitting}
              className="text-glupp-text-muted hover:text-glupp-cream transition-colors group flex items-center gap-2"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Passer ce duel
            </Button>

            <div className="w-px h-4 bg-glupp-border"></div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              disabled={submitting}
              className="text-glupp-text-muted hover:text-glupp-cream transition-colors flex items-center gap-2"
            >
              <History size={14} />
              Historique
            </Button>
          </div>

          {/* La Modale d'Historique */}
          <DuelHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
          />

          {/* Pool info */}
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
        </>
      )}

      {/* ⏬ SECTIONS PERMANENTES ⏬ */}
      
    
      {/* Défis quotidiens */}
      <DailyChallengesWidget />
      {/* Glupp of the Week */}
      <div className="px-4 mt-8">
        <GluppOfWeekBanner />
      </div>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <div className="mt-6 px-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-glupp-cream">
              Activite recente
            </h3>
            <Link
              href="/social"
              className="text-xs text-glupp-accent font-medium hover:underline inline-flex items-center gap-0.5"
            >
              Voir tout
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivities.map((activity, i) => (
              <ActivityItem key={activity.id} activity={activity} index={i} />
            ))}
          </div>
        </div>
      )}

      {activitiesLoading && (
        <div className="mt-6 px-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
