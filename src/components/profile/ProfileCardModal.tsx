"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Check, Beer, Swords, Camera, Trophy, Crown } from "lucide-react";
import { getLevel } from "@/lib/utils/xp";
import { supabase } from "@/lib/supabase/client";

interface ProfileCardData {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarFileName: string | null;
  xp: number;
  beersTasted: number;
  duelsPlayed: number;
  photosTaken: number;
  customTitle: string | null;
  customTitleIcon: string | null;
  trophyCount: number;
  topBeer: { name: string; brewery: string; elo: number } | null;
}

interface ProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProfileCardData;
}

function ProfileCardVisual({ data }: { data: ProfileCardData }) {
  const level = getLevel(data.xp);

  return (
    <div
      className="relative w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1E1B16] via-[#1A1714] to-[#141210] shadow-2xl"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#E08840]/8 rounded-full blur-[100px]" />

      {/* Header */}
      <div className="relative px-6 pt-8 pb-4 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-[#E08840]/15 border-2 border-[#E08840]/30 flex items-center justify-center overflow-hidden mb-3">
          {data.avatarFileName ? (
            <img src={`https://glupp.fr/avatars/${data.avatarFileName}.png`} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : data.avatarUrl ? (
            <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-[#E08840]">{(data.displayName || data.username)[0]?.toUpperCase()}</span>
          )}
        </div>

        {/* Name */}
        <h2 className="text-xl font-black text-white">{data.displayName || data.username}</h2>
        <p className="text-xs text-white/40">@{data.username}</p>

        {/* Title */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="text-sm">{data.customTitleIcon || level.icon}</span>
          <span className="text-xs font-medium text-[#E08840]">{data.customTitle || level.title}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-white/5">
            <Beer size={14} className="text-[#E08840]" />
            <p className="text-lg font-black text-white">{data.beersTasted}</p>
            <p className="text-[8px] text-white/30 uppercase">Bieres</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-white/5">
            <Swords size={14} className="text-[#A78BFA]" />
            <p className="text-lg font-black text-white">{data.duelsPlayed}</p>
            <p className="text-[8px] text-white/30 uppercase">Duels</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-white/5">
            <Camera size={14} className="text-[#4ECDC4]" />
            <p className="text-lg font-black text-white">{data.photosTaken}</p>
            <p className="text-[8px] text-white/30 uppercase">Photos</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-white/5">
            <Trophy size={14} className="text-[#F0C460]" />
            <p className="text-lg font-black text-white">{data.trophyCount}</p>
            <p className="text-[8px] text-white/30 uppercase">Trophees</p>
          </div>
        </div>
      </div>

      {/* Top beer */}
      {data.topBeer && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-[#F0C460]/8 border border-[#F0C460]/15">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={10} className="text-[#F0C460]" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#F0C460]">Ma biere #1</span>
          </div>
          <p className="text-sm font-bold text-white truncate">{data.topBeer.name}</p>
          <p className="text-[10px] text-white/40 truncate">{data.topBeer.brewery} · ELO {data.topBeer.elo}</p>
        </div>
      )}

      {/* XP bar */}
      <div className="mx-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-white/30">Niveau {level.level}</span>
          <span className="text-[9px] text-[#E08840] font-bold">{data.xp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-[#E08840] rounded-full" style={{ width: `${Math.min(100, (data.xp % 1000) / 10)}%` }} />
        </div>
      </div>

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

export function ProfileCardModal({ isOpen, onClose, data }: ProfileCardModalProps) {
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
    } catch { return null; }
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await generateImage();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `glupp-${data.username}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "glupp-profile.png", { type: "image/png" });
        await navigator.share({
          title: `${data.displayName || data.username} sur Glupp`,
          text: `${data.beersTasted} bieres, ${data.duelsPlayed} duels — rejoins-moi sur glupp.fr ! 🍺`,
          files: [file],
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`Decouvre mon profil Glupp ! ${data.beersTasted} bieres, ${data.duelsPlayed} duels 🍺 glupp.fr`);
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
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>

            <div ref={cardRef}>
              <ProfileCardVisual data={data} />
            </div>

            <div className="flex items-center gap-3 w-full max-w-[340px]">
              <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E08840] text-white font-bold text-sm hover:bg-[#E08840]/90 transition-colors">
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "Copie !" : "Partager"}
              </button>
              <button onClick={handleDownload} disabled={downloading} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 transition-colors border border-white/10">
                <Download size={16} />
                {downloading ? "..." : "Sauver"}
              </button>
            </div>

            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">Fermer</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { type ProfileCardData };
