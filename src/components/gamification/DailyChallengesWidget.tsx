"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyChallenges, type Challenge } from "@/lib/hooks/useDailyChallenges";
import { Flame, CheckCircle, Circle, Zap, Gift, Calendar } from "lucide-react";

function ChallengeRow({ challenge, index }: { challenge: Challenge; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-glupp transition-all ${
        challenge.completed
          ? "bg-glupp-success/8 border border-glupp-success/20"
          : "bg-glupp-bg border border-glupp-border/50"
      }`}
    >
      <span className={`text-base shrink-0 ${challenge.completed ? "" : "grayscale-[30%]"}`}>
        {challenge.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${
          challenge.completed ? "text-glupp-success" : "text-glupp-cream"
        }`}>
          {challenge.title}
        </p>
        <p className="text-[10px] text-glupp-text-muted truncate">
          {challenge.description}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {challenge.completed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex items-center gap-1"
          >
            <CheckCircle size={14} className="text-glupp-success" />
            <span className="text-[10px] font-bold text-glupp-success">+{challenge.xp_reward}</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1">
            <Circle size={14} className="text-glupp-border" />
            <span className="text-[10px] text-glupp-text-muted">+{challenge.xp_reward}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function DailyChallengesWidget() {
  const { dailyChallenges, weeklyChallenges, streak, allDailyCompleted, isLoading, checkChallenges } = useDailyChallenges();

  // Vérifier automatiquement les défis au chargement
  useEffect(() => {
    if (dailyChallenges.length > 0) {
      checkChallenges().catch(() => {});
    }
  }, [dailyChallenges.length]);

  if (isLoading) {
    return (
      <div className="mx-4 mt-4 p-4 bg-glupp-card border border-glupp-border rounded-glupp-xl animate-pulse">
        <div className="h-4 bg-glupp-border rounded w-32 mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-glupp-border rounded" />
          <div className="h-10 bg-glupp-border rounded" />
          <div className="h-10 bg-glupp-border rounded" />
        </div>
      </div>
    );
  }

  if (dailyChallenges.length === 0 && weeklyChallenges.length === 0) return null;

  const completedDaily = dailyChallenges.filter((c) => c.completed).length;
  const dailyXp = dailyChallenges.reduce((sum, c) => sum + c.xp_reward, 0);
  const weeklyXp = weeklyChallenges.reduce((sum, c) => sum + c.xp_reward, 0);
  const totalXpPossible = dailyXp + 30 + weeklyXp; // +30 bonus combo

  return (
    <div className="mx-4 mt-4 space-y-3">
      {/* ═══ Défis quotidiens ═══ */}
      <div className={`p-4 rounded-glupp-xl border transition-colors ${
        allDailyCompleted 
          ? "bg-glupp-success/5 border-glupp-success/30" 
          : "bg-glupp-card border-glupp-border"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{allDailyCompleted ? "🎉" : "🎯"}</span>
            <h3 className="text-sm font-bold text-glupp-cream">
              {allDailyCompleted ? "Defis completes !" : "Defis du jour"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-glupp-gold/10 text-glupp-gold">
                <Flame size={10} />
                <span className="text-[10px] font-bold">{streak}j</span>
              </div>
            )}
            <div className="flex gap-1">
              {dailyChallenges.map((c, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${c.completed ? "bg-glupp-success" : "bg-glupp-border"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Daily challenges */}
        <div className="space-y-2">
          <AnimatePresence>
            {dailyChallenges.map((challenge, i) => (
              <ChallengeRow key={challenge.id} challenge={challenge} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Bonus combo */}
        <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-glupp ${
          allDailyCompleted
            ? "bg-glupp-gold/10 border border-glupp-gold/20"
            : "bg-glupp-bg/50 border border-dashed border-glupp-border/50"
        }`}>
          <div className="flex items-center gap-1.5">
            <Gift size={12} className={allDailyCompleted ? "text-glupp-gold" : "text-glupp-text-muted"} />
            <span className={`text-[10px] font-medium ${allDailyCompleted ? "text-glupp-gold" : "text-glupp-text-muted"}`}>
              Bonus combo ({completedDaily}/3)
            </span>
          </div>
          <span className={`text-[10px] font-bold ${allDailyCompleted ? "text-glupp-gold" : "text-glupp-text-muted"}`}>
            {allDailyCompleted ? "✓ +30 XP" : "+30 XP"}
          </span>
        </div>

        {/* Streak message */}
        {allDailyCompleted && streak > 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[10px] text-glupp-gold mt-2 font-medium">
            <Flame size={10} className="inline mr-0.5" />
            Streak de {streak} jour{streak > 1 ? "s" : ""} ! Continue demain !
          </motion.p>
        )}
      </div>

      {/* ═══ Défi hebdomadaire ═══ */}
      {weeklyChallenges.length > 0 && (
        <div className={`p-4 rounded-glupp-xl border transition-colors ${
          weeklyChallenges[0].completed
            ? "bg-glupp-gold/5 border-glupp-gold/30"
            : "bg-glupp-card border-glupp-border"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-glupp-accent" />
            <h3 className="text-sm font-bold text-glupp-cream">Defi de la semaine</h3>
          </div>
          {weeklyChallenges.map((challenge, i) => (
            <ChallengeRow key={challenge.id} challenge={challenge} index={i} />
          ))}
        </div>
      )}

      {/* Total XP */}
      {!allDailyCompleted && (
        <p className="text-center text-[9px] text-glupp-text-muted">
          <Zap size={8} className="inline" /> Jusqu&apos;a {totalXpPossible} XP disponibles
        </p>
      )}
    </div>
  );
}
