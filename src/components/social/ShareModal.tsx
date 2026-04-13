"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Instagram, Check } from "lucide-react";
import { beerEmoji } from "@/lib/utils/xp";
import type { Rarity } from "@/types";

interface BeerCardData {
  beerName: string;
  brewery: string;
  style: string;
  country: string;
  rarity: Rarity;
  xpGained: number;
  photoUrl: string | null;
  barName: string | null;
  username: string;
  avatarUrl: string | null;
  level: { icon: string; level: number; title: string };
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BeerCardData;
}

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  common: { bg: "from-[#2A2520] to-[#1E1B16]", border: "border-[#6B6050]", glow: "", label: "Commune" },
  rare: { bg: "from-[#1a2540] to-[#0f1a30]", border: "border-blue-500/50", glow: "shadow-blue-500/10", label: "Rare" },
  epic: { bg: "from-[#2a1a40] to-[#1a1030]", border: "border-purple-500/50", glow: "shadow-purple-500/10", label: "Épique" },
  legendary: { bg: "from-[#3a2a10] to-[#2a1a00]", border: "border-yellow-500/50", glow: "shadow-yellow-500/20", label: "Légendaire" },
};

function BeerCardVisual({ data }: { data: BeerCardData }) {
  const rs = RARITY_STYLES[data.rarity] || RARITY_STYLES.common;

  return (
    <div
      className={`relative w-[340px] overflow-hidden rounded-2xl border-2 ${rs.border} bg-gradient-to-b ${rs.bg} shadow-2xl ${rs.glow}`}
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Header band */}
      <div className="relative px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#E08840]/20 flex items-center justify-center overflow-hidden">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-[#E08840]">{data.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-white/90">{data.username}</p>
            <p className="text-[9px] text-white/40">{data.level.icon} {data.level.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#E08840]/15 border border-[#E08840]/30">
          <span className="text-[10px] font-bold text-[#E08840]">+{data.xpGained} XP</span>
        </div>
      </div>

      {/* Photo area */}
      {data.photoUrl ? (
        <div className="relative mx-4 h-44 rounded-xl overflow-hidden">
          <img src={data.photoUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Rarity badge on photo */}
          <div className="absolute bottom-2 left-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              data.rarity === "legendary" ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/40" :
              data.rarity === "epic" ? "bg-purple-500/30 text-purple-300 border border-purple-500/40" :
              data.rarity === "rare" ? "bg-blue-500/30 text-blue-300 border border-blue-500/40" :
              "bg-white/10 text-white/60 border border-white/20"
            }`}>
              {rs.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-4 h-32 rounded-xl bg-white/5 flex items-center justify-center">
          <span className="text-5xl">{beerEmoji(data.style)}</span>
        </div>
      )}

      {/* Beer info */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start gap-2">
          <span className="text-2xl mt-0.5">{beerEmoji(data.style)}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-white leading-tight truncate">{data.beerName}</h3>
            <p className="text-xs text-white/50 truncate">{data.brewery}</p>
          </div>
        </div>
      </div>

      {/* Details bar */}
      <div className="px-5 pb-3 flex items-center gap-3 text-[10px] text-white/40">
        <span>{data.country}</span>
        <span>·</span>
        <span>{data.style}</span>
        {data.barName && (
          <>
            <span>·</span>
            <span className="truncate">📍 {data.barName}</span>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-tight text-[#E08840]">Glupp</span>
          <span className="text-[8px] text-white/20">·</span>
          <span className="text-[8px] text-white/20">glupp.fr</span>
        </div>
        <p className="text-[9px] text-white/25 italic">Every glupp counts.</p>
      </div>

      {/* Decorative corner elements for legendary/epic */}
      {data.rarity === "legendary" && (
        <>
          <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-yellow-500/10 to-transparent rounded-tl-full" />
        </>
      )}
      {data.rarity === "epic" && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
      )}
    </div>
  );
}

export function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
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
      a.download = `glupp-${data.beerName.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "glupp-beer-card.png", { type: "image/png" });
        await navigator.share({
          title: `${data.beerName} sur Glupp`,
          text: `Je viens de glupper ${data.beerName} ! 🍺 Rejoins-moi sur glupp.fr`,
          files: [file],
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(`Je viens de glupper ${data.beerName} sur Glupp ! 🍺 Rejoins-moi sur glupp.fr`);
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
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Card */}
            <div ref={cardRef}>
              <BeerCardVisual data={data} />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 w-full max-w-[340px]">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E08840] text-white font-bold text-sm hover:bg-[#E08840]/90 transition-colors"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "Copié !" : "Partager"}
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

            {/* Skip */}
            <button
              onClick={onClose}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Passer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { type BeerCardData };
