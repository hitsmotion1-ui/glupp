"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  Users,
  Beer,
  MapPin,
  Swords,
  Inbox,
  Activity,
  MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // On utilise les VRAIES variables retournées par ton hook useAdmin
  const { loadingStats, stats } = useAdmin();

  return (
    <div className="min-h-screen bg-[#14120F] text-[#E8E1D5] pb-24">
      {/* ── HEADER CORRIGÉ (Il a bien besoin d'un title) ── */}
      <AdminHeader title="Dashboard" subtitle="Overview of the Glupp platform" />

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

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
            <h2 className="text-xl font-semibold text-[#F7F3EE]">Statistiques Globales</h2>
          </div>

          {loadingStats ? (
            <div className="text-[#8C8273]">Chargement des statistiques...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* On utilise notre composant local pour éviter toute erreur de typage avec ton ancien StatCard */}
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
                icon={<Activity size={20} className="text-[#10B981]" />}
              />
              <DashboardStatCard
                title="En attente"
                value={stats?.pending_submissions || 0}
                icon={<Inbox size={20} className="text-[#F0C460]" />}
              />
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Composant Local (pour remplacer StatCard sans conflit)
// ═══════════════════════════════════════════
function DashboardStatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
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