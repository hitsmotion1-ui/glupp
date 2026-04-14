"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { MILESTONE_CONFIGS } from "@/components/social/MilestoneModal";
import { getLevel } from "@/lib/utils/xp";

const BEER_MILESTONES = [10, 25, 50, 100, 200, 500];

export function useMilestones() {
  const showMilestone = useAppStore((s) => s.showMilestone);

  const checkAfterGlupp = useCallback((
    username: string,
    previousBeersCount: number,
    newBeersCount: number,
    previousXp: number,
    newXp: number,
    trophiesAwarded?: string[],
  ) => {
    // Petit délai pour laisser la célébration XP se terminer
    const delay = 1500;

    // 1. Vérifier palier de bières
    for (const milestone of BEER_MILESTONES) {
      if (previousBeersCount < milestone && newBeersCount >= milestone) {
        setTimeout(() => {
          showMilestone(MILESTONE_CONFIGS.beers(milestone, username));
        }, delay);
        return; // Un seul milestone à la fois
      }
    }

    // 2. Vérifier changement de niveau
    const oldLevel = getLevel(previousXp);
    const newLevel = getLevel(newXp);
    if (newLevel.level > oldLevel.level) {
      setTimeout(() => {
        showMilestone(MILESTONE_CONFIGS.level(newLevel.level, newLevel.title, username));
      }, delay);
      return;
    }

    // 3. Vérifier trophées débloqués
    if (trophiesAwarded && trophiesAwarded.length > 0) {
      setTimeout(() => {
        showMilestone(MILESTONE_CONFIGS.trophy(trophiesAwarded[0], "🏆", username));
      }, delay);
      return;
    }
  }, [showMilestone]);

  const checkTrophy = useCallback((name: string, emoji: string, username: string) => {
    setTimeout(() => {
      showMilestone(MILESTONE_CONFIGS.trophy(name, emoji, username));
    }, 500);
  }, [showMilestone]);

  const checkLevelUp = useCallback((level: number, title: string, username: string) => {
    setTimeout(() => {
      showMilestone(MILESTONE_CONFIGS.level(level, title, username));
    }, 500);
  }, [showMilestone]);

  return { checkAfterGlupp, checkTrophy, checkLevelUp };
}
