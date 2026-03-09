"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `il y a ${days}j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(iso)
  );
}

const RARITY_CONFIG: Record<string, { label: string; color: string }> = {
  common: { label: "Commune", color: "#A89888" },
  rare: { label: "Rare", color: "#3B82F6" },
  epic: { label: "Épique", color: "#A78BFA" },
  legendary: { label: "Légendaire", color: "#F0C460" },
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#3A3530]/40 ${className}`} />;
}

// ═══════════════════════════════════════════
// Lightbox
// ═══════════════════════════════════════════

interface LightboxEntry {
  photo_url: string;
  username: string;
  beerName: string;
  bar: string | null;
  createdAt: string;
}

function Lightbox({ entry, onClose }: { entry: LightboxEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-[#1E1B16] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Photo */}
        <img
          src={entry.photo_url}
          alt="Photo glupp"
          className="w-full max-h-[70vh] object-contain bg-black"
        />

        {/* Info */}
        <div className="px-4 py-3 flex items-center gap-3 border-t border-[#3A3530]">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F5E6D3] truncate">
              @{entry.username}
              <span className="text-[#A89888] font-normal"> · {entry.beerName}</span>
            </p>
            <p className="text-xs text-[#6B6050] flex items-center gap-1 mt-0.5">
              {entry.bar && (
                <>
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{entry.bar}</span>
                  <span className="mx-1">·</span>
                </>
              )}
              {timeAgo(entry.createdAt)}
            </p>
          </div>
          <a
            href={entry.photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#3A3530] text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#4A4540] transition-colors shrink-0"
          >
            <ExternalLink size={12} />
            Ouvrir
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function AdminGluppsPage() {
  const admin = useAdmin();

  const [page, setPage] = useState(0);
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxEntry | null>(null);

  const { data, isLoading } = admin.useAdminGlupps({ page, onlyWithPhoto });
  const glupps = data?.glupps ?? [];
  const total = data?.total ?? 0;
  const pageSize = admin.GLUPPS_PAGE_SIZE;
  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = (withPhoto: boolean) => {
    setOnlyWithPhoto(withPhoto);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-[#141210]">
      <AdminHeader
        title="Glupps"
        subtitle={`${total} glupp${total > 1 ? "s" : ""} au total`}
      />

      <div className="px-6 py-6 lg:px-8 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !onlyWithPhoto
                ? "bg-[#E08840] text-[#141210]"
                : "bg-[#1E1B16] border border-[#3A3530] text-[#A89888] hover:text-[#F5E6D3]"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => handleFilterChange(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              onlyWithPhoto
                ? "bg-[#E08840] text-[#141210]"
                : "bg-[#1E1B16] border border-[#3A3530] text-[#A89888] hover:text-[#F5E6D3]"
            }`}
          >
            <Camera size={14} />
            Avec photo
          </button>

          <span className="ml-auto text-xs text-[#6B6050]">
            {total} résultat{total > 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-[#3A3530]/50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : glupps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles size={36} strokeWidth={1.2} className="mb-2 text-[#3A3530]" />
              <p className="text-sm text-[#6B6050]">Aucun glupp trouvé</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="hidden lg:grid grid-cols-[56px_1fr_1fr_1fr_100px] gap-3 px-4 py-2.5 border-b border-[#3A3530] text-[10px] font-semibold uppercase tracking-wider text-[#6B6050]">
                <span>Photo</span>
                <span>Utilisateur</span>
                <span>Bière</span>
                <span>Localisation</span>
                <span className="text-right">Date</span>
              </div>

              <div className="divide-y divide-[#3A3530]/50">
                {glupps.map((g) => {
                  const meta = g.metadata as Record<string, unknown> | null;
                  const bar = (meta?.bar as string) || null;
                  const rarity = (g.beer as { rarity?: string } | null)?.rarity ?? "common";
                  const rc = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.common;
                  const user = g.user as { username?: string; display_name?: string; avatar_url?: string | null } | null;
                  const beer = g.beer as { name?: string; brewery?: string } | null;

                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3A3530]/20 transition-colors"
                    >
                      {/* Photo thumbnail / placeholder */}
                      {g.photo_url ? (
                        <button
                          onClick={() =>
                            setLightbox({
                              photo_url: g.photo_url!,
                              username: user?.username ?? "?",
                              beerName: beer?.name ?? "Bière inconnue",
                              bar,
                              createdAt: g.created_at,
                            })
                          }
                          className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#3A3530] hover:border-[#E08840] hover:opacity-90 transition-all"
                          title="Voir la photo"
                        >
                          <img
                            src={g.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-lg shrink-0 bg-[#3A3530]/40 flex items-center justify-center">
                          <Camera size={16} className="text-[#6B6050]" />
                        </div>
                      )}

                      {/* User */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#3A3530] shrink-0 overflow-hidden flex items-center justify-center">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-[#A89888]">
                              {(user?.username ?? "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F5E6D3] truncate">
                            {user?.display_name || user?.username || "?"}
                          </p>
                          <p className="text-xs text-[#6B6050] truncate">
                            @{user?.username ?? "?"}
                          </p>
                        </div>
                      </div>

                      {/* Beer */}
                      <div className="flex-1 min-w-0 hidden lg:block">
                        <p className="text-sm text-[#F5E6D3] truncate">{beer?.name ?? "—"}</p>
                        <p className="text-xs truncate" style={{ color: rc.color }}>
                          {rc.label} · {beer?.brewery ?? ""}
                        </p>
                      </div>

                      {/* Bar */}
                      <div className="flex-1 min-w-0 hidden lg:block">
                        {bar ? (
                          <p className="text-sm text-[#A89888] truncate flex items-center gap-1">
                            <MapPin size={11} className="shrink-0 text-[#6B6050]" />
                            {bar}
                          </p>
                        ) : (
                          <p className="text-xs text-[#3A3530]">—</p>
                        )}
                      </div>

                      {/* Date */}
                      <p className="text-xs text-[#6B6050] shrink-0 text-right w-24">
                        {timeAgo(g.created_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#1E1B16] border border-[#3A3530] text-[#A89888] hover:text-[#F5E6D3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Précédent
            </button>

            <span className="text-sm text-[#6B6050]">
              Page {page + 1} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#1E1B16] border border-[#3A3530] text-[#A89888] hover:text-[#F5E6D3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox entry={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
