"use client";

import { XP_LEVELS, getLevel } from "@/lib/utils/xp";

interface ProgressionTreeProps {
  xp: number;
}

export function ProgressionTree({ xp }: ProgressionTreeProps) {
  const currentLevel = getLevel(xp);

  return (
    <div className="space-y-2">
      {[...XP_LEVELS].reverse().map((level, index) => {
        const isReached = xp >= level.min;
        const isCurrent = currentLevel.level === level.level;

        return (
          <div
            key={level.level}
            className={`flex items-center gap-3 p-2.5 rounded-glupp transition-all ${
              isCurrent
                ? "bg-glupp-accent/15 border border-glupp-accent/30"
                : isReached
                ? "bg-glupp-card"
                : "bg-glupp-card/30 opacity-50"
            }`}
          >
            {/* Icon */}
            <span className={`text-xl ${!isReached ? "grayscale" : ""}`}>
              {level.icon}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-semibold ${
                  isCurrent
                    ? "text-glupp-accent"
                    : isReached
                    ? "text-glupp-cream"
                    : "text-glupp-text-muted"
                }`}
              >
                Nv.{level.level} — {level.title}
              </p>
              <p className="text-[10px] text-glupp-text-muted">
                {level.min.toLocaleString("fr-FR")} XP
              </p>
            </div>

            {/* Status */}
            {isCurrent && (
              <span className="text-[10px] font-medium text-glupp-accent bg-glupp-accent/20 px-2 py-0.5 rounded-full">
                Actuel
              </span>
            )}
            {isReached && !isCurrent && (
              <span className="text-[10px] text-glupp-success">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
