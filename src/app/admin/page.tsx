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
  Activity,
  MessageSquarePlus, // 👈 Ajout de l'icône
} from "lucide-react";
import { motion } from "framer-motion";
import { getLevel } from "@/lib/utils/xp";
import Link from "next/link"; // 👈 Ajout de Link pour la navigation

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
  const {
    loading,
    stats,
    topUsers,
    recentActivity,
  } = useAdmin();

  return (
    <div className="min-h-screen bg-[#14120F] text-[#E8E1D5] pb-24">
      {/* ── HEADER NAVIGATION ── */}
      <AdminHeader />

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── HEADER TEXT ── */}
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-[#F7F3EE]">
            Dashboard
          </h1>
          <p className="text-sm text-[#8C8273] mt-1">
            Overview of the Glupp platform.
          </p>
        </div>

        {/* 🆕 BOUTON FEEDBACKS */}
        <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F7F3EE] flex items-center gap-2">
              <MessageSquarePlus size={20} className="text-[#E08840]" />
              Retours utilisateurs
            </h2>
            <p className="text-sm text-[#8C8273] mt-1">
              Consulte les bugs, suggestions et problèmes signalés par la communauté.
            </p>
          </div>
          <Link
            href="/admin/feedbacks"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 bg-[#E08840] text-[#1E1B16] font-bold rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Voir les messages
          </Link>
        </div>

        {/* ── OVERVIEW STATS ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-[#8C8273]" size={20} />
            <h2 className="text-xl font-semibold text-[#F7F3EE]">Overview</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Users"
                  value={stats?.totalUsers || 0}
                  icon={<Users size={20} className="text-[#4ECDC4]" />}
                  trend="+12 this week" // placeholder
                  trendUp={true}
                />
                <StatCard
                  title="Total Beers"
                  value={stats?.totalBeers || 0}
                  icon={<Beer size={20} className="text-[#E08840]" />}
                />
                <StatCard
                  title="Submissions"
                  value={stats?.pendingSubmissions || 0}
                  icon={<Inbox size={20} className="text-[#F0C460]" />}
                  alert={stats?.pendingSubmissions ? stats.pendingSubmissions > 0 : false}
                />
                <StatCard
                  title="Check-ins"
                  value={stats?.totalCheckins || 0}
                  icon={<MapPin size={20} className="text-[#8B5CF6]" />}
                />
                <StatCard
                  title="Duels Played"
                  value={stats?.totalDuels || 0}
                  icon={<Swords size={20} className="text-[#EF4444]" />}
                />
                <StatCard
                  title="Photos"
                  value={stats?.totalPhotos || 0}
                  icon={<Sparkles size={20} className="text-[#10B981]" />}
                />
              </>
            )}
          </div>
        </section>

        {/* ── TOP USERS (XP) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="text-[#F0C460]" size={20} />
              <h2 className="text-xl font-semibold text-[#F7F3EE]">Leaderboard</h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : topUsers.length === 0 ? (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-8 text-center">
              <Trophy className="mx-auto text-[#6B6050] mb-3" size={32} />
              <p className="text-[#8C8273]">No users found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topUsers.map((user, idx) => {
                const userLvl = getLevel(user.xp);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center p-4 bg-[#1E1B16] border border-[#3A3530] rounded-xl hover:border-[#6B6050] transition-colors"
                  >
                    {/* Rank */}
                    <span className={`
                      text-lg font-bold w-8 shrink-0
                      ${idx === 0 ? 'text-[#F0C460]' : 
                        idx === 1 ? 'text-[#E8E1D5]' : 
                        idx === 2 ? 'text-[#E08840]' : 'text-[#6B6050]'}
                    `}>
                      #{idx + 1}
                    </span>

                    {/* Avatar */}
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-[#3A3530] ml-2 shrink-0 object-cover"
                    />

                    {/* Info */}
                    <div className="ml-4 min-w-0 flex-1">
                      <p className="text-[#F7F3EE] font-semibold truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-[#8C8273] truncate">
                        @{user.username}
                      </p>
                    </div>

                    {/* XP/Level */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#E08840]">
                        {user.xp} XP
                      </p>
                      <p className="text-[10px] text-[#8C8273] uppercase tracking-wider">
                        {userLvl.title}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── RECENT ACTIVITY ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-[#8C8273]" size={20} />
            <h2 className="text-xl font-semibold text-[#F7F3EE]">Live Activity</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-8 text-center">
              <Activity className="mx-auto text-[#6B6050] mb-3" size={32} />
              <p className="text-[#8C8273]">It's quiet... too quiet.</p>
            </div>
          ) : (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl divide-y divide-[#3A3530] overflow-hidden">
              {recentActivity.map((act) => {
                // Helpers for nice display
                const timeAgo = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
                const userName = act.user?.display_name || act.user?.username || "Unknown";
                const userAvatar = act.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

                // Config by type
                const typeConfig: Record<string, { icon: React.ReactNode, label: string, color: string }> = {
                  tasting: { icon: <Beer size={16} />, label: "Check-in", color: "text-[#E08840]" },
                  photo: { icon: <Sparkles size={16} />, label: "Photo", color: "text-[#10B981]" },
                  duel: { icon: <Swords size={16} />, label: "Duel", color: "text-[#EF4444]" },
                  trophy: { icon: <Trophy size={16} />, label: "Trophy", color: "text-[#F0C460]" },
                };

                const cfg = typeConfig[act.type] || { icon: <Activity size={16} />, label: act.type, color: "text-[#8C8273]" };

                return (
                  <div key={act.id} className="p-4 flex items-center gap-4 hover:bg-[#2A241C] transition-colors">
                    
                    {/* Activity Icon */}
                    <div className={`w-8 h-8 rounded-full bg-[#14120F] border border-[#3A3530] flex items-center justify-center shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {/* User Avatar */}
                      <img
                        src={userAvatar}
                        alt=""
                        className="w-8 h-8 rounded-full border border-[#3A3530] shrink-0 object-cover"
                      />
                      
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8E1D5] truncate">
                          <span className="font-semibold">{userName}</span>
                          <span className="text-[#8C8273] mx-1">
                            {cfg.label === "Check-in" ? "a gluppé" :
                             cfg.label === "Duel" ? "a joué un duel" :
                             cfg.label === "Photo" ? "a pris une photo" :
                             `a effectué ${cfg.label.toLowerCase()}`}
                          </span>
                          {act.beer && (
                            <span className="text-[#E08840]"> · {act.beer.name}</span>
                          )}
                        </p>
                      </div>

                      {/* Photo thumbnail (click to open full) */}
                      {act.photo_url && (
                        <a
                          href={act.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Voir la photo"
                          className="shrink-0"
                        >
                          <img
                            src={act.photo_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[#3A3530] hover:opacity-80 transition-opacity"
                          />
                        </a>
                      )}

                      {/* Time */}
                      <span className="text-xs text-[#6B6050] shrink-0">{timeAgo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}