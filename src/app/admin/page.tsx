"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { AdminHeader } from "@/components/admin/AdminHeader";
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
  MessageSquarePlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { getLevel } from "@/lib/utils/xp";
import Link from "next/link";
import React from "react";

// ═══════════════════════════════════════════
// Skeleton placeholders
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
  // 1. Récupération des données et des hooks depuis useAdmin
  const { 
    loadingStats, 
    stats, 
    useAdminUsers, 
    useAdminActivities 
  } = useAdmin();

  // 2. Appel des hooks pour obtenir le Leaderboard et l'Activité
  const { data: topUsers = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: recentActivity = [], isLoading: loadingActivity } = useAdminActivities();

  return (
    <div className="min-h-screen bg-[#14120F] text-[#E8E1D5] pb-24">
      {/* ── HEADER NAVIGATION ── */}
      <AdminHeader title="Dashboard" subtitle="Overview of the Glupp platform" />

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── BOUTON FEEDBACKS ── */}
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
            <h2 className="text-xl font-semibold text-[#F7F3EE]">Statistiques Globales</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingStats ? (
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
                <DashboardStatCard
                  title="Utilisateurs"
                  value={stats?.total_users || 0}
                  icon={<Users size={20} className="text-[#4ECDC4]" />}
                />
                <DashboardStatCard
                  title="Bières"
                  value={stats?.total_beers || 0}
                  icon={<Beer size={20} className="text-[#E08840]" />}
                />
                <DashboardStatCard
                  title="En attente"
                  value={stats?.pending_submissions || 0}
                  icon={<Inbox size={20} className="text-[#F0C460]" />}
                />
                <DashboardStatCard
                  title="Bars"
                  value={stats?.total_bars || 0}
                  icon={<MapPin size={20} className="text-[#8B5CF6]" />}
                />
                <DashboardStatCard
                  title="Duels Joués"
                  value={stats?.total_duels || 0}
                  icon={<Swords size={20} className="text-[#EF4444]" />}
                />
                <DashboardStatCard
                  title="Glupps"
                  value={stats?.total_glupps || 0}
                  icon={<Sparkles size={20} className="text-[#10B981]" />}
                />
              </>
            )}
          </div>
        </section>

        {/* ── TOP USERS (LEADERBOARD) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="text-[#F0C460]" size={20} />
              <h2 className="text-xl font-semibold text-[#F7F3EE]">Leaderboard</h2>
            </div>
          </div>

          {loadingUsers ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : topUsers.length === 0 ? (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-8 text-center">
              <Trophy className="mx-auto text-[#6B6050] mb-3" size={32} />
              <p className="text-[#8C8273]">Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topUsers.slice(0, 3).map((user, idx) => {
                const userLvl = getLevel(user.xp);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center p-4 bg-[#1E1B16] border border-[#3A3530] rounded-xl hover:border-[#6B6050] transition-colors"
                  >
                    <span className={`
                      text-lg font-bold w-8 shrink-0
                      ${idx === 0 ? 'text-[#F0C460]' : 
                        idx === 1 ? 'text-[#E8E1D5]' : 
                        idx === 2 ? 'text-[#E08840]' : 'text-[#6B6050]'}
                    `}>
                      #{idx + 1}
                    </span>
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-[#3A3530] ml-2 shrink-0 object-cover"
                    />
                    <div className="ml-4 min-w-0 flex-1">
                      <p className="text-[#F7F3EE] font-semibold truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-[#8C8273] truncate">
                        @{user.username}
                      </p>
                    </div>
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
            <h2 className="text-xl font-semibold text-[#F7F3EE]">Activité Récente</h2>
          </div>

          {loadingActivity ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-8 text-center">
              <Activity className="mx-auto text-[#6B6050] mb-3" size={32} />
              <p className="text-[#8C8273]">C'est bien calme ici...</p>
            </div>
          ) : (
            <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl divide-y divide-[#3A3530] overflow-hidden">
              {recentActivity.slice(0, 5).map((act) => {
                const timeAgo = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
                const userName = act.user?.display_name || act.user?.username || "Inconnu";
                const userAvatar = act.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

                const typeConfig: Record<string, { icon: React.ReactNode, label: string, color: string }> = {
                  tasting: { icon: <Beer size={16} />, label: "Check-in", color: "text-[#E08840]" },
                  photo: { icon: <Sparkles size={16} />, label: "Photo", color: "text-[#10B981]" },
                  duel: { icon: <Swords size={16} />, label: "Duel", color: "text-[#EF4444]" },
                  trophy: { icon: <Trophy size={16} />, label: "Trophy", color: "text-[#F0C460]" },
                  glupp: { icon: <Activity size={16} />, label: "Glupp", color: "text-[#4ECDC4]" },
                };

                const cfg = typeConfig[act.type] || { icon: <Activity size={16} />, label: act.type, color: "text-[#8C8273]" };

                return (
                  <div key={act.id} className="p-4 flex items-center gap-4 hover:bg-[#2A241C] transition-colors">
                    <div className={`w-8 h-8 rounded-full bg-[#14120F] border border-[#3A3530] flex items-center justify-center shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <img
                        src={userAvatar}
                        alt=""
                        className="w-8 h-8 rounded-full border border-[#3A3530] shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8E1D5] truncate">
                          <span className="font-semibold">{userName}</span>
                          <span className="text-[#8C8273] mx-1">
                            {cfg.label === "Check-in" ? "a gluppé" :
                             cfg.label === "Duel" ? "a joué un duel" :
                             cfg.label === "Photo" ? "a pris une photo" :
                             `a effectué l'action ${cfg.label.toLowerCase()}`}
                          </span>
                          {act.beer && (
                            <span className="text-[#E08840]"> · {act.beer.name}</span>
                          )}
                        </p>
                      </div>
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

// ═══════════════════════════════════════════
// Composant Local de Carte de Statistique
// ═══════════════════════════════════════════
interface DashboardStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

function DashboardStatCard({ title, value, icon }: DashboardStatCardProps) {
  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#14120F] border border-[#3A3530] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#F7F3EE]">{value}</p>
        <p className="text-xs text-[#8C8273] mt-1 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}