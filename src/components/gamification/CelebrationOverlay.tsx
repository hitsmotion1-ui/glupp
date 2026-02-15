"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store/useAppStore";

const CONFETTI_COLORS = [
  "#E08840", // accent
  "#DCB04C", // gold
  "#4ECDC4", // rare
  "#A78BFA", // epic
  "#F0C460", // legendary
  "#FBF7F1", // cream
];

const PARTICLE_COUNT = 24;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function CelebrationOverlay() {
  const showCelebration = useAppStore((s) => s.showCelebration);
  const clearCelebration = useAppStore((s) => s.clearCelebration);

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        clearCelebration();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showCelebration, clearCelebration]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
            const color =
              CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
            const startX = randomBetween(10, 90);
            const endX = startX + randomBetween(-30, 30);
            const size = randomBetween(6, 12);
            const rotation = randomBetween(0, 720);
            const duration = randomBetween(1.2, 2.2);
            const delay = randomBetween(0, 0.4);

            return (
              <motion.div
                key={i}
                initial={{
                  x: `${startX}vw`,
                  y: "-5vh",
                  rotate: 0,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: `${endX}vw`,
                  y: "105vh",
                  rotate: rotation,
                  opacity: [1, 1, 0.5, 0],
                  scale: [1, 1.2, 0.8],
                }}
                transition={{
                  duration,
                  delay,
                  ease: "easeIn",
                }}
                style={{
                  position: "absolute",
                  width: size,
                  height: size * 0.6,
                  backgroundColor: color,
                  borderRadius: size > 9 ? "2px" : "50%",
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
