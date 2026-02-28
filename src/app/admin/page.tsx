"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import {
  Users,
  Beer,
  MapPin,
  Sparkles,
  Swords,
  Inbox,
  Star,
  Clock,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { getLevel } from "@/lib/utils/xp";

// ═══════════════════════════════════════════
// Skeleton placeholder for loading state
// ═══════════════════════════════════════════

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#3A3530]/40 ${className}`}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  );
}

// ═══════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════

export default function AdminDashboardPage() {
  const admin = useAdmin();
  const { stats, loadingStats } = admin;

  // Fetch recent pending submissions
  const { data: submissions = [], isLoading: loadingSubs } =
    admin.useAdminSubmissions("pending");

  // Fetch top users
  const { data: topUsers = [], isLoading: loadingUsers } =
    admin.useAdminUsers();

  const recentSubs = submissions.slice(0, 5);
  const topFive = topUsers.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#141210]">
      <AdminHeader title="Dashboard" subtitle="Vue d'ensemble de Glupp" />

      <div className="px-6 py-6 lg:px-8 space-y-8">
        {/* ── Stat Cards Grid ─────────────────── */}
        <section>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {loadingStats ? (
              Array.from({ length: 6 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            ) : (
              <>
                <StatCard
                  label="Utilisateurs"
                  value={stats?.total_users ?? 0}
                  icon={Users}
                  color="#3B82F6"
                />
                <StatCard
                  label="Bieres"
                  value={stats?.total_beers ?? 0}
                  icon={Beer}
                  color="#E08840"
                />
                <StatCard
                  label="Bars"
                  value={stats?.total_bars ?? 0}
                  icon={MapPin}
                  color="#4ECDC4"
                />
                <StatCard
                  label="Glupps"
                  value={stats?.total_glupps ?? 0}
                  icon={Sparkles}
                  color="#F0C460"
                />
                <StatCard
                  label="Duels"
                  value={stats?.total_duels ?? 0}
                  icon={Swords}
                  color="#A78BFA"
                />
                <StatCard
                  label="En attente"
                  value={stats?.pending_submissions ?? 0}
                  icon={Inbox}
                  color="#EF4444"
                />
              </>
            )}
          </div>
        </section>

        {/* ── Two-column layout: Submissions + Top Users ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Submissions */}
          <section>
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-[#F5E6D3] font-display">
              <Clock size={18} className="text-[#E08840]" />
              Soumissions en attente
            </h2>

            {loadingSubs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : recentSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-[#1E1B16] border border-[#3A3530] rounded-xl">
                <Inbox
                  size={36}
                  strokeWidth={1.2}
                  className="mb-2 text-[#3A3530]"
                />
                <p className="text-sm text-[#6B6050]">
                  Aucune soumission en attente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSubs.map((sub) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 bg-[#1E1B16] border border-[#3A3530] rounded-xl"
                  >
                    {/* Type badge */}
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold shrink-0 ${
                        sub.type === "beer"
                          ? "bg-[#E08840]/15 text-[#E08840]"
                          : sub.type === "bar"
                            ? "bg-[#4ECDC4]/15 text-[#4ECDC4]"
                            : "bg-[#A78BFA]/15 text-[#A78BFA]"
                      }`}
                    >
                      {sub.type === "beer" ? (
                        <Beer size={16} />
                      ) : sub.type === "bar" ? (
                        <MapPin size={16} />
                      ) : (
                        <Star size={16} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F5E6D3] truncate">
                        {(sub.data?.name as string) ?? sub.type}
                      </p>
                      <p className="text-xs text-[#A89888] truncate">
                        par{" "}
                        {sub.user?.display_name ?? sub.user?.username ?? "?"}
                        {" — "}
                        {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 bg-[#F0C460]/15 text-[#F0C460]">
                      En attente
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Top Users Leaderboard */}
          <section>
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-[#F5E6D3] font-display">
              <Trophy size={18} className="text-[#F0C460]" />
              Top Utilisateurs
            </h2>

            {loadingUsers ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : topFive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-[#1E1B16] border border-[#3A3530] rounded-xl">
                <Users
                  size={36}
                  strokeWidth={1.2}
                  className="mb-2 text-[#3A3530]"
                />
                <p className="text-sm text-[#6B6050]">
                  Aucun utilisateur
                </p>
              </div>
            ) : (
              <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden divide-y divide-[#3A3530]/50">
                {topFive.map((user, idx) => {
                  const level = getLevel(user.xp);
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      {/* Rank */}
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                          idx === 0
                            ? "bg-[#F0C460]/20 text-[#F0C460]"
                            : idx === 1
                              ? "bg-[#C0C0C0]/20 text-[#C0C0C0]"
                              : idx === 2
                                ? "bg-[#CD7F32]/20 text-[#CD7F32]"
                                : "bg-[#3A3530] text-[#A89888]"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3A3530] shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-[#A89888] font-bold">
                            {(
                              user.display_name ||
                              user.username ||
                              "?"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name + level */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F5E6D3] truncate">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-xs text-[#6B6050]">
                          {level.icon} Nv.{level.level}
                        </p>
                      </div>

                      {/* XP */}
                      <span className="text-sm font-bold text-[#F0C460] tabular-nums shrink-0">
                        {user.xp.toLocaleString("fr-FR")} XP
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
