"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "#E08840",
}: StatCardProps) {
  // Determine if trend is positive, negative, or neutral
  const trendColor = trend
    ? trend.startsWith("+")
      ? "text-[#4CAF50]"
      : trend.startsWith("-")
        ? "text-[#E05252]"
        : "text-[#A89888]"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>

        {/* Trend badge */}
        {trend && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${trendColor} bg-[#141210]`}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="mt-4 text-2xl font-bold text-[#F5E6D3] font-display tabular-nums">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>

      {/* Label */}
      <p className="mt-1 text-sm text-[#A89888]">{label}</p>
    </motion.div>
  );
}
