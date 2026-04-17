"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Check, Trophy, Swords, Beer, MapPin, Flame, TrendingUp } from "lucide-react";

interface WeeklyRecapData {
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  week_start: string;
  week_end: string;
  glupps: number;
  duels: number;
  xp_gained: number;
  countries: number;
  styles: number;
  trophies: number;
  fav_beer: string | null;
  fav_brewery: string | null;
  rank: number | null;
  total_users: number;
  streak: number;
}

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WeeklyRecapData;
}

function StatBlock({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5">
      <div style={{ color }} className="mb-0.5">{icon}</div>
      <p className="text-xl font-black text-white" style={{ color }}>{value}</p>
      <p className="text-[9px] text-white/40 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function WeeklyRecapVisual({ data }: { data: WeeklyRecapData }) {
  const weekStart = new Date(data.week_start);
  const weekEnd = new Date(data.week_end);
  const formatDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const hasActivity = data.glupps > 0 || data.duels > 0;

  return (
    <div
      className="relative w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1E1B16] via-[#1A1714] to-[#141210] shadow-2xl"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#E08840]/8 rounded-full blur-[100px]" />

      {/* Header */}
      <div className="relative px-5 pt-6 pb-4 text-center">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-2">Recap hebdomadaire</p>
        <h2 className="text-lg font-black text-white mb-1">
          Semaine du {formatDate(weekStart)}
        </h2>
        <p className="text-[10px] text-white/30">
          {formatDate(weekStart)} — {formatDate(weekEnd)}
        </p>

        {/* User badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className="w-5 h-5 rounded-full bg-[#E08840]/20 flex items-center justify-center overflow-hidden">
            {data.avatar_url ? (
              <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[8px] font-bold text-[#E08840]">{data.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <span className="text-xs font-semibold text-white/80">@{data.username}</span>
          {data.rank && (
            <span className="text-[9px] text-[#E08840] font-bold">#{data.rank}</span>
          )}
        </div>
      </div>

      {hasActivity ? (
        <>
          {/* Stats grid */}
          <div className="px-5 pb-3">
            <div className="grid grid-cols-3 gap-2">
              <StatBlock icon={<Beer size={16} />} value={data.glupps} label="Glupps" color="#E08840" />
              <StatBlock icon={<Swords size={16} />} value={data.duels} label="Duels" color="#A78BFA" />
              <StatBlock icon={<TrendingUp size={16} />} value={`+${data.xp_gained}`} label="XP" color="#4ECDC4" />
            </div>
          </div>

          {/* Highlights */}
          <div className="px-5 pb-4 space-y-2">
            {data.fav_beer && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <span className="text-sm">🍺</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider">Derniere decouverte</p>
                  <p className="text-xs text-white/80 font-semibold truncate">{data.fav_beer}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {data.countries > 0 && (
                <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-sm">🌍</span>
                  <div>
                    <p className="text-xs text-white/80 font-bold">{data.countries}</p>
                    <p className="text-[8px] text-white/30">pays</p>
                  </div>
                </div>
              )}
              {data.styles > 0 && (
                <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-sm">🎨</span>
                  <div>
                    <p className="text-xs text-white/80 font-bold">{data.styles}</p>
                    <p className="text-[8px] text-white/30">styles</p>
                  </div>
                </div>
              )}
              {data.trophies > 0 && (
                <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-sm">🏆</span>
                  <div>
                    <p className="text-xs text-white/80 font-bold">{data.trophies}</p>
                    <p className="text-[8px] text-white/30">trophees</p>
                  </div>
                </div>
              )}
            </div>

            {data.streak > 1 && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#E08840]/10 border border-[#E08840]/20">
                <Flame size={14} className="text-[#E08840]" />
                <span className="text-xs font-bold text-[#E08840]">Streak de {data.streak} jours !</span>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Semaine inactive */
        <div className="px-5 pb-4 text-center py-6">
          <p className="text-sm text-white/30 mb-2">Semaine tranquille 😴</p>
          <p className="text-xs text-white/20">Reviens glupper cette semaine !</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-tight text-[#E08840]">Glupp</span>
          <span className="text-[8px] text-white/20">·</span>
          <span className="text-[8px] text-white/20">glupp.fr</span>
        </div>
        <p className="text-[8px] text-white/15 italic">Every glupp counts.</p>
      </div>
    </div>
  );
}

export function WeeklyRecapModal({ isOpen, onClose, data }: WeeklyRecapModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#141210",
        scale: 2,
        useCORS: true,
      });
      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    } catch {
      return null;
    }
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await generateImage();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `glupp-recap-${data.week_start}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "glupp-weekly-recap.png", { type: "image/png" });
        await navigator.share({
          title: "Mon recap Glupp de la semaine",
          text: `Cette semaine : ${data.glupps} glupps, ${data.duels} duels, +${data.xp_gained} XP ! 🍺 Rejoins-moi sur glupp.fr`,
          files: [file],
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`Mon recap Glupp : ${data.glupps} glupps, ${data.duels} duels cette semaine ! 🍺 glupp.fr`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-5 max-w-sm w-full"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div ref={cardRef}>
              <WeeklyRecapVisual data={data} />
            </div>

            <div className="flex items-center gap-3 w-full max-w-[340px]">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E08840] text-white font-bold text-sm hover:bg-[#E08840]/90 transition-colors"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "Copie !" : "Partager"}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 transition-colors border border-white/10"
              >
                <Download size={16} />
                {downloading ? "..." : "Sauver"}
              </button>
            </div>

            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { type WeeklyRecapData };
