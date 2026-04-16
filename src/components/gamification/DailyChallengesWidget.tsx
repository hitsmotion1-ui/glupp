"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyChallenges } from "@/lib/hooks/useDailyChallenges";
import { Flame, CheckCircle, Circle, Zap, Gift } from "lucide-react";

export function DailyChallengesWidget() {
  const { challenges, streak, allCompleted, isLoading, checkChallenges } = useDailyChallenges();

  // Vérifier automatiquement les défis quand le composant charge
  useEffect(() => {
    if (challenges.length > 0 && !allCompleted) {
      checkChallenges().catch(() => {});
    }
  }, [challenges.length]);

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

  if (challenges.length === 0) return null;

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXpPossible = challenges.reduce((sum, c) => sum + c.xp_reward, 0) + 30; // +30 bonus combo

  return (
    <div className="mx-4 mt-4">
      <div className={`p-4 rounded-glupp-xl border transition-colors ${
        allCompleted 
          ? "bg-glupp-success/5 border-glupp-success/30" 
          : "bg-glupp-card border-glupp-border"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{allCompleted ? "🎉" : "🎯"}</span>
            <h3 className="text-sm font-bold text-glupp-cream">
              {allCompleted ? "Defis completes !" : "Defis du jour"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-glupp-gold/10 text-glupp-gold">
                <Flame size={10} />
                <span className="text-[10px] font-bold">{streak}j</span>
              </div>
            )}
            {/* Progress dots */}
            <div className="flex gap-1">
              {challenges.map((c, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    c.completed ? "bg-glupp-success" : "bg-glupp-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Challenges list */}
        <div className="space-y-2">
          <AnimatePresence>
            {challenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-glupp transition-all ${
                  challenge.completed
                    ? "bg-glupp-success/8 border border-glupp-success/20"
                    : "bg-glupp-bg border border-glupp-border/50"
                }`}
              >
                {/* Icon */}
                <span className={`text-base shrink-0 ${challenge.completed ? "" : "grayscale-[30%]"}`}>
                  {challenge.icon}
                </span>

                {/* Content */}
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

                {/* Status */}
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
            ))}
          </AnimatePresence>
        </div>

        {/* Bonus combo bar */}
        <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-glupp ${
          allCompleted
            ? "bg-glupp-gold/10 border border-glupp-gold/20"
            : "bg-glupp-bg/50 border border-dashed border-glupp-border/50"
        }`}>
          <div className="flex items-center gap-1.5">
            <Gift size={12} className={allCompleted ? "text-glupp-gold" : "text-glupp-text-muted"} />
            <span className={`text-[10px] font-medium ${
              allCompleted ? "text-glupp-gold" : "text-glupp-text-muted"
            }`}>
              Bonus combo (3/3)
            </span>
          </div>
          <span className={`text-[10px] font-bold ${
            allCompleted ? "text-glupp-gold" : "text-glupp-text-muted"
          }`}>
            {allCompleted ? "✓ +30 XP" : "+30 XP"}
          </span>
        </div>

        {/* Total XP possible */}
        {!allCompleted && (
          <p className="text-center text-[9px] text-glupp-text-muted mt-2">
            <Zap size={8} className="inline" /> Jusqu&apos;a {totalXpPossible} XP disponibles aujourd&apos;hui
          </p>
        )}

        {/* Streak message */}
        {allCompleted && streak > 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[10px] text-glupp-gold mt-2 font-medium"
          >
            <Flame size={10} className="inline mr-0.5" />
            Streak de {streak} jour{streak > 1 ? "s" : ""} ! Continue demain !
          </motion.p>
        )}
      </div>
    </div>
  );
}
