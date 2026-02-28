"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { XP_GAINS, XP_LEVELS } from "@/lib/utils/xp";
import {
  Zap,
  Trophy,
  Info,
  Layers,
} from "lucide-react";

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const XP_GAIN_LABELS: Record<string, string> = {
  duel: "Duel joue",
  scan: "Scan biere",
  photo: "Photo prise",
  photo_geo: "Photo geolocalisee",
  tag_friend: "Taguer un ami",
  rare_beer: "Biere rare",
  epic_beer: "Biere epique",
  legendary_beer: "Biere legendaire",
  trophy: "Trophee debloque",
  challenge: "Challenge complete",
  gotw: "Glupp of the Week",
  passport_complete: "Passeport complete",
  bar_review: "Avis de bar",
  submit_beer: "Soumettre une biere",
  submit_bar: "Soumettre un bar",
};

const BUILD_DATE = "2026-02-28";
const VERSION = "Sprint 6 — Admin";

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <AdminHeader title="Parametres" subtitle="Configuration et constantes" />

      <div className="px-4 py-6 lg:px-8 space-y-8">
        {/* ─── XP Gains Section ─────────────── */}
        <section>
          <SectionHeading
            icon={Zap}
            title="Constantes XP"
            description="Points d'experience attribues par action"
            color="#F0C460"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.entries(XP_GAINS).map(([key, value]) => (
              <div
                key={key}
                className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-4 flex items-center justify-between gap-3 group hover:border-[#F0C460]/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#A89888] uppercase tracking-wider truncate">
                    {XP_GAIN_LABELS[key] ?? key}
                  </p>
                  <p className="text-[10px] text-[#6B6050] font-mono mt-0.5">
                    {key}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center justify-center min-w-[48px] h-8 px-2 bg-[#F0C460]/10 text-[#F0C460] text-sm font-bold rounded-lg tabular-nums">
                  +{value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── XP Levels Section ────────────── */}
        <section>
          <SectionHeading
            icon={Trophy}
            title="Niveaux XP"
            description="Progression des niveaux et titres"
            color="#E08840"
          />

          <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#3A3530]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Niveau
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Titre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      Icone
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap">
                      XP minimum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3530]/50">
                  {XP_LEVELS.map((level, idx) => (
                    <tr
                      key={level.level}
                      className={idx % 2 === 1 ? "bg-[#141210]/30" : ""}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#E08840]/10 text-[#E08840] text-xs font-bold">
                          {level.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#F5E6D3] font-medium whitespace-nowrap">
                        {level.title}
                      </td>
                      <td className="px-4 py-3 text-lg whitespace-nowrap">
                        {level.icon}
                      </td>
                      <td className="px-4 py-3 text-right text-[#F0C460] font-semibold tabular-nums whitespace-nowrap">
                        {level.min.toLocaleString("fr-FR")} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── Info Section ─────────────────── */}
        <section>
          <SectionHeading
            icon={Info}
            title="Informations"
            description="Metadata du build"
            color="#A89888"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoCard label="Version" value={VERSION} />
            <InfoCard label="Date de build" value={formatBuildDate(BUILD_DATE)} />
            <InfoCard
              label="Niveaux configures"
              value={`${XP_LEVELS.length} niveaux`}
            />
            <InfoCard
              label="Actions XP"
              value={`${Object.keys(XP_GAINS).length} actions`}
            />
            <InfoCard
              label="XP max (niveau max)"
              value={`${XP_LEVELS[XP_LEVELS.length - 1].min.toLocaleString("fr-FR")} XP`}
            />
            <InfoCard
              label="Framework"
              value="Next.js 15 + Supabase"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function SectionHeading({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: typeof Layers;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#F5E6D3]">{title}</h2>
        <p className="text-xs text-[#6B6050]">{description}</p>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-4">
      <dt className="text-[10px] uppercase tracking-wider text-[#6B6050] font-semibold">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[#F5E6D3] mt-1">{value}</dd>
    </div>
  );
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function formatBuildDate(date: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}
