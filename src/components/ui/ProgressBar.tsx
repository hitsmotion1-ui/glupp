"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  label?: string;
  subLabel?: string;
}

export function ProgressBar({
  value,
  color = "bg-glupp-accent",
  height = 8,
  label,
  subLabel,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || subLabel) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-glupp-text-soft">{label}</span>
          )}
          {subLabel && (
            <span className="text-xs text-glupp-text-muted">{subLabel}</span>
          )}
        </div>
      )}
      <div
        className="w-full bg-glupp-card-alt rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
